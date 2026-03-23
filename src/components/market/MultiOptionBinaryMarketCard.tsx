import { BarChart3, Bookmark, Gift, RefreshCcw } from "lucide-react"
import type { FC } from "react"

import { IcoAI } from "@/components/custom/IcoAI"
import type { MultiOptionBinaryMarket } from "@/features/markets/types"

import YesNoComponent from "./YesNoComponent"
interface MarketCardProps {
  market: MultiOptionBinaryMarket
}
export const MultiOptionBinaryMarketCard: FC<MarketCardProps> = ({ market }) => {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
      }}
      className="group flex flex-col border border-border rounded-xl p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="size-10 min-w-10 rounded-md overflow-hidden border border-white ">
          <img
            src={market.thumbnailUrl}
            alt={market.title}
            className="size-full object-cover  group-hover:grayscale transition-all duration-300"
          />
        </div>
        <h3 className="font-default font-bold leading-tight line-clamp-2 min-h-10 group-hover:text-primary transition-colors">
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
            <RefreshCcw className="size-3" /> {market.frequency}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IcoAI size={12} className="hover:text-white transition-colors" />
          <Gift className="size-3 hover:text-white transition-colors" />
          <Bookmark className="size-3 hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  )
}
