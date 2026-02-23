import { ChevronRight } from "lucide-react"
import type { FC } from "react"

import type { Market } from "@/features/markets/types"

import { MarketCard } from "./MarketCard"

interface MarketGridProps {
  title: string
  markets: Market[]
}

export const MarketGrid: FC<MarketGridProps> = ({ title, markets }) => {
  if (markets.length === 0) return null

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">{title}</h2>
        <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          View All <ChevronRight className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </section>
  )
}
