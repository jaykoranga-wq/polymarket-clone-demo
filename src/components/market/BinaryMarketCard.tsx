import { Bookmark, Bot, ImageIcon, RefreshCw } from "lucide-react"
import type { FC } from "react"
import { useNavigate } from "react-router"

import { useAppDispatch } from "@/app/hooks"
import { IcoVolSm } from "@/components/custom/EventPageIcons"
import { setSelectedMarket } from "@/features/markets/marketSlice"
import type { Market } from "@/features/markets/types"

interface MarketCardProps {
  market: Market
}

export const BinaryMarketCard: FC<MarketCardProps> = ({ market }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const yesP = market.yesProbability ?? 50
  const noP = market.noProbability ?? 50

  const totalVolume = (market.yesVolume ?? 0) + (market.noVolume ?? 0)
  const volumeLabel =
    totalVolume >= 1_000_000
      ? `$${(totalVolume / 1_000_000).toFixed(1)}M`
      : totalVolume >= 1_000
        ? `$${(totalVolume / 1_000).toFixed(0)}K`
        : `$${totalVolume.toLocaleString()}`

  const handleNavigation = () => {
    dispatch(setSelectedMarket(market))
    navigate(`/event/${market.id}`)
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4  "
      style={{
        background: "black",
        border: "1px solid rgba(255,255,255,0.07)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Title row: thumbnail + title ── */}
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 rounded-lg overflow-hidden"
          style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <img
            src={
              market.image?.length
                ? market.image.includes("string")
                  ? "/fallbackImg.jpg"
                  : market.image
                : "/fallbackImg.jpg"
            }
            alt={market.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <h3
          onClick={handleNavigation}
          className="line-clamp-3 leading-snug cursor-pointer w-full object-contain"
          style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", flex: 1 }}
        >
          {market.title}
        </h3>
      </div>

      {/* ── YES / NO buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={handleNavigation}
          className="flex-1 py-3 rounded-[10px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{
            background: "rgba(0,200,83,0.15)",
            color: "#00c853",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          Yes
        </button>
        <button
          onClick={handleNavigation}
          className="flex-1 py-3 rounded-[10px] transition-opacity hover:opacity-90 cursor-pointer"
          style={{
            background: "rgba(229,57,53,0.15)",
            color: "#e53935",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          No
        </button>
      </div>

      {/* ── Probability bar + labels ── */}
      <div className="flex flex-col gap-1">
        {/* bar */}
        <div
          className="w-full overflow-hidden"
          style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}
        >
          <div
            style={{
              height: "100%",
              width: `${yesP}%`,
              background: "#00c853",
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        {/* pct labels */}
        <div className="flex justify-between">
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00c853" }}>{yesP}%</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e53935" }}>{noP}%</span>
        </div>
      </div>

      {/* ── Footer row ── */}
      <div
        className="flex items-center justify-between pt-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* left: vol + frequency */}
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
          >
            <IcoVolSm size={13} />
            {volumeLabel} Vol.
          </span>
          {market.frequency && (
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
            >
              <RefreshCw size={11} />
              {market.frequency}
            </span>
          )}
        </div>

        {/* right: action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => e.stopPropagation()}
            style={{ color: "rgba(255,255,255,0.3)" }}
            className="hover:text-white transition-colors"
          >
            <Bot size={14} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{ color: "rgba(255,255,255,0.3)" }}
            className="hover:text-white transition-colors"
          >
            <ImageIcon size={14} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{ color: "rgba(255,255,255,0.3)" }}
            className="hover:text-white transition-colors"
          >
            <Bookmark size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
