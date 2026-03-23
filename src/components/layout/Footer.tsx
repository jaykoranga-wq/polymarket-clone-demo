import { useNavigate } from "react-router"

export const Footer = () => {
  const navigate = useNavigate()

  return (
    <footer className="border-t border-[#3B82F638] bg-background mt-auto">
      <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col gap-12 justify-between">
        {/* ── Top section ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-16 ">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:col-span-2 max-w-lg">
            <div
              className="flex items-center gap-2 cursor-pointer w-fit"
              onClick={() => navigate("/")}
            >
              <img src="/logo.png" alt="logo" className="h-5.5 w-auto" />
            </div>
            <p className="font-base text-white leading-5 max-w-96">
              Polymarket is a decentralized information markets platform, letting you trade on the
              world's most highly-debated topics.
            </p>
          </div>

          {/* Platform links */}
          <div className="flex flex-col gap-3">
            <span className="font-sm font-bold tracking-widest text-white uppercase">Platform</span>
            {["How it works", "Market Rules", "Rewards Program"].map((item) => (
              <button
                key={item}
                className="font-base font-medium text-white hover:text-primary/80 hover:cursor-pointer transition-colors text-left w-fit"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Support links */}
          <div className="flex flex-col gap-3">
            <span className="font-sm font-bold tracking-widest text-white uppercase">Support</span>
            {["Discord Community", "Help Center", "Terms of Service"].map((item) => (
              <button
                key={item}
                className="font-base font-medium text-white hover:text-primary/80 hover:cursor-pointer transition-colors text-left w-fit"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:px-12">
          <span className="font-xs font-bold text-white leading-4 uppercase tracking-widest">
            © {new Date().getFullYear()} Polymarket Simulation
          </span>
          <div className="flex items-center gap-4">
            <span className="font-xs font-bold text-white uppercase tracking-widest">
              Network: Polygon
            </span>
            <span className="font-xs font-bold text-white uppercase tracking-widest">
              Latency: 24ms
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
