import { BarChart3, Calendar, History, Share2 } from "lucide-react"
import type { FC } from "react"

import { Button } from "@/components/ui/button"
import type { BinaryMarket } from "@/features/markets/types"

import { PercentageBar } from "./PercentageBar"

interface MarketCardProps {
  market: BinaryMarket
}

export const BinaryMarketCard: FC<MarketCardProps> = ({ market }) => {
  return (
    <div className="group flex flex-col bg-surface border border-border rounded-xl p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer">
      <div className="flex gap-4 mb-4">
        <div className="size-12 min-w-12 rounded-lg overflow-hidden border border-border bg-background">
          <img
            src={market.thumbnailUrl}
            alt={market.title}
            className="size-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        </div>
        <h3 className="text-sm font-bold leading-tight line-clamp-2 min-h-10 group-hover:text-primary transition-colors">
          {market.title}
        </h3>
      </div>

      <div className="mt-auto space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-primary/10 border-primary/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95"
          >
            Yes {market.yesProbability}%
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-secondary/10 border-secondary/20 text-secondary font-bold hover:bg-secondary hover:text-background transition-all active:scale-95"
          >
            No {market.noProbability}%
          </Button>
        </div>

        <PercentageBar yesPercentage={market.yesProbability} noPercentage={market.noProbability} />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <BarChart3 className="size-3" /> {market.volume} Vol.
            </span>
            <span className="flex items-center gap-1">
              <History className="size-3" /> {market.frequency}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="size-3 hover:text-foreground transition-colors" />
            <Calendar className="size-3 hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}
