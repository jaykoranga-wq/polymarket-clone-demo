// src/components/layout/Footer.tsx
// Links come from src/data/footerData.ts — edit that file to change links.

import { useNavigate } from "react-router"

import { FOOTER_GROUPS, type FooterLink } from "@/data/footerData"

// ── Single link button ────────────────────────────────────────────────────────
const FooterLinkBtn = ({ link }: { link: FooterLink }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (link.external) {
      window.open(link.external, "_blank", "noopener noreferrer")
    } else if (link.path) {
      navigate(link.path)
    } else if (link.slug) {
      navigate(`/page/${link.slug}`)
    }
  }

  return (
    <button
      key={link.label}
      onClick={handleClick}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-fit"
    >
      {link.label}
    </button>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
export const Footer = () => {
  const navigate = useNavigate()

  return (
    <footer className="border-t border-white/6 bg-background mt-auto">
      <div className="container mx-auto px-4 md:px-20 py-12">
        {/* ── Top section ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div
              className="flex items-center gap-2 cursor-pointer w-fit"
              onClick={() => navigate("/")}
            >
              <div className="size-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-background">P</span>
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">Polymarket</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Polymarket is a decentralized information markets platform, letting you trade on the
              world's most highly-debated topics.
            </p>
          </div>

          {/* Link groups — rendered from footerData.ts */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.heading} className="flex flex-col gap-3">
              <span className="text-xs font-bold tracking-widest text-foreground uppercase">
                {group.heading}
              </span>
              {group.links.map((link) => (
                <FooterLinkBtn key={link.label} link={link} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} Polymarket Simulation
          </span>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Network: <span className="text-primary font-semibold">Polygon</span>
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Latency: <span className="text-primary font-semibold">24ms</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
