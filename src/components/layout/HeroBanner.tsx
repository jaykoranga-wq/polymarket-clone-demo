import { TrendingUp } from "lucide-react"
import type { FC } from "react"
import { useNavigate } from "react-router"

import { useAppDispatch } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { setSelectedMarket } from "@/features/markets/marketSlice"
import type { Market } from "@/features/markets/types"

interface HeroBannerProps {
  title: string
  description: string
  favorite: string
  favoriteProbability: number
  market: Market
}

export const HeroBanner: FC<HeroBannerProps> = ({
  title,
  description,
  favorite,
  favoriteProbability,
  market,
}) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  function handleClickTrade() {
    console.log("handle trade clicked ..")
    dispatch(setSelectedMarket(market))
    if (market) {
      navigate(`/event/${market?.id as string}`)
    }
  }

  return (
    <section className="relative w-full h-[220x] md:h-62.5 flex items-center overflow-hidden rounded-2xl bg-background border border-border mt-6">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-transparent z-10" />
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 50%, rgba(22, 199, 132, 0.15) 0%, transparent 60%)",
        }}
      />

      {/* Right Image */}
      <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden hidden md:block">
        <div className="relative h-full w-full">
          <img
            src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop"
            alt="Hero Visual"
            className="h-full w-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-linear-to-l from-background/20 via-background/80 to-background" />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-white/5 tracking-[0.2em] select-none">
              LIVE COVERAGE
            </span>
            <span className="text-2xl font-black text-white/10 mt-1 select-none">
              November 5th, 2024
            </span>
          </div>
        </div>
      </div>

      {/* Left Content */}
      <div className="relative z-20 p-5 md:p-6 max-w-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Trending Now
        </div>

        <h1 className="text-xl md:text-2xl font-black text-white leading-snug line-clamp-2">
          {title}
        </h1>

        <p className="text-muted-foreground text-xs md:text-sm max-w-md leading-relaxed line-clamp-2">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-0">
          <Button
            size="sm"
            className="bg-primary text-background font-bold hover:bg-primary/90 px-6 h-10 rounded-lg text-sm transition-transform active:scale-95 shadow-[0_6px_16px_-6px_rgba(22,199,132,0.4)]"
            onClick={handleClickTrade}
          >
            Trade Now
          </Button>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> Favorite
            </span>
            <span className="text-primary font-bold text-sm">
              {favorite} ({favoriteProbability}%)
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
