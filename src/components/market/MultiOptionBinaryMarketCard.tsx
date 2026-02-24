import { BarChart3, Calendar, History, Share2 } from "lucide-react"
import type { FC } from "react"

import type { MultiOptionBinaryMarket } from "@/features/markets/types"

import YesNoComponent from "./YesNoComponent"
interface MarketCardProps {
  market: MultiOptionBinaryMarket
}
export const MultiOptionBinaryMarketCard: FC<MarketCardProps> = ({ market }) => {
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
      {/* the area should be scrollable and below component of YesNoComponent should be at the bottom of the card */}
      <div className="relative overflow-y-auto h-24.75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-2 m-0">
        {market.options.map((option) => (
          <YesNoComponent key={option.date} option={option} />
        ))}
        {/* <YesNoComponent market={market} />
        <YesNoComponent market={market} />
        <YesNoComponent market={market} />
        <YesNoComponent market={market} />
        <YesNoComponent market={market} /> */}
      </div>
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
  )
}
