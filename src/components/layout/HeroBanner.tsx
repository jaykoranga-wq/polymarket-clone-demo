import { TrendingUp } from "lucide-react"
import type { FC } from "react"

import { Button } from "@/components/ui/button"

interface HeroBannerProps {
  title: string
  description: string
  favorite: string
  favoriteProbability: number
}

export const HeroBanner: FC<HeroBannerProps> = ({
  title,
  description,
  favorite,
  favoriteProbability,
}) => {
  return (
    <section className="relative w-full overflow-hidden rounded-2xl bg-[#0B0F14] border border-border mt-6">
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10" />
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 50%, rgba(22, 199, 132, 0.15) 0%, transparent 60%)",
        }}
      />

      {/* Visual Content (Right Side) */}
      <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden hidden md:block">
        <div className="relative h-full w-full">
          <img
            src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop"
            alt="Hero Visual"
            className="h-full w-full object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0B0F14]/20 via-[#0B0F14]/80 to-[#0B0F14]" />

          {/* Accent Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-6xl font-black text-white/5 tracking-[0.2em] select-none">
              LIVE COVERAGE
            </span>
            <span className="text-4xl font-black text-white/10 mt-2 select-none">
              November 5th, 2024
            </span>
          </div>
        </div>
      </div>

      {/* Content (Left Side) - Needs higher Z-index */}
      <div className="relative z-20 p-8 md:p-12 max-w-2xl flex flex-col gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Trending Now
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">{title}</h1>

        <p className="text-muted-foreground text-lg max-w-lg leading-relaxed">{description}</p>

        <div className="flex flex-wrap items-center gap-6 mt-2">
          <Button
            size="lg"
            className="bg-primary text-background font-black hover:bg-primary/90 px-8 h-14 rounded-xl text-lg transition-transform active:scale-95 shadow-[0_8px_20px_-6px_rgba(22,199,132,0.4)]"
          >
            Trade Now
          </Button>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> Favorite
            </span>
            <span className="text-primary font-bold">
              {favorite} ({favoriteProbability}%)
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
