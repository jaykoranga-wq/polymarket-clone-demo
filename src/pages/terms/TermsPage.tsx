// src/pages/terms/TermsPage.tsx

import { useEffect, useState } from "react"

import { TERMS_META, TERMS_SECTIONS } from "@/data/termsData"

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f13",
  surface: "#161a22",
  border: "rgba(255,255,255,0.07)",
  green: "#00c853",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.5)",
  muted2: "rgba(255,255,255,0.25)",
  body: "rgba(255,255,255,0.75)",
} as const

// ── TermsPage ─────────────────────────────────────────────────────────────────
const TermsPage = () => {
  const [activeSection, setActiveSection] = useState(TERMS_SECTIONS[0]?.id)

  // highlight active section on scroll
  useEffect(() => {
    window.scrollTo(0, 0)
    const handleScroll = () => {
      for (const section of [...TERMS_SECTIONS].reverse()) {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(section.id)
          break
        }
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.scroll(0, 0)
    }
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 100px",
          display: "flex",
          gap: 48,
          alignItems: "flex-start",
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            position: "sticky",
            top: 96,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.muted2,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            Contents
          </div>
          {TERMS_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                textAlign: "left",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: activeSection === s.id ? 700 : 500,
                color: activeSection === s.id ? C.green : C.muted,
                background: activeSection === s.id ? "rgba(0,200,83,0.08)" : "transparent",
                borderLeft: `2px solid ${activeSection === s.id ? C.green : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.15s",
                lineHeight: 1.4,
              }}
              onMouseEnter={(e) => {
                if (activeSection !== s.id) e.currentTarget.style.color = C.text
              }}
              onMouseLeave={(e) => {
                if (activeSection !== s.id) e.currentTarget.style.color = C.muted
              }}
            >
              {s.title}
            </button>
          ))}
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* page header */}
          <div
            style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}
          >
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
                color: C.text,
              }}
            >
              Terms and Conditions
            </h1>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: C.muted }}>
                Last updated: <strong style={{ color: C.text }}>{TERMS_META.lastUpdated}</strong>
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                Effective: <strong style={{ color: C.text }}>{TERMS_META.effectiveDate}</strong>
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                Version: <strong style={{ color: C.text }}>{TERMS_META.version}</strong>
              </span>
            </div>
            <p style={{ fontSize: 14, color: C.body, marginTop: 16, lineHeight: 1.7 }}>
              Please read these Terms and Conditions carefully before using the Polymarket platform.
              By accessing or using our service, you agree to be bound by these terms.
            </p>
          </div>

          {/* sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {TERMS_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} style={{ scrollMarginTop: 96 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.text,
                    margin: "0 0 16px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {section.title}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.content.map((para, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: 14,
                        lineHeight: 1.8,
                        color: C.body,
                        margin: 0,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* footer note */}
          <div
            style={{
              marginTop: 48,
              padding: "20px 24px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.6,
            }}
          >
            Questions about these terms? Contact us at{" "}
            <a
              href={`mailto:${TERMS_META.contactEmail}`}
              style={{ color: C.green, textDecoration: "none" }}
            >
              {TERMS_META.contactEmail}
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TermsPage
