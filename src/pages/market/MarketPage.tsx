// src/pages/MarketsPage.tsx
import "./marketPage.css"

import { useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"

import { useAppDispatch } from "@/app/hooks"
import { BinaryMarketCard } from "@/components/market/BinaryMarketCard"
import { MultiOptionBinaryMarketCard } from "@/components/market/MultiOptionBinaryMarketCard"
import {
  selectAllMarkets, // ← raw unfiltered list
  selectNewMarkets,
  selectTrendingMarkets,
} from "@/features/markets/marketSelectors"
import { setSelectedCategory } from "@/features/markets/marketSlice"
import { MARKET_TYPES } from "@/features/markets/marketTypes"
import type { Market } from "@/features/markets/types"

const GROUP_TITLES: Record<string, string> = {
  trending: "🔥 Trending Markets",
  ending_soon: "⏰ Ending Soon Markets",
  new_market: "🆕 New Markets",
  earn_rewards: "📈 Earn Rewards Markets",
}

// these are your fixed group keys — anything else is treated as a category
const KNOWN_GROUPS = new Set(["trending", "ending_soon", "new_market", "earn_rewards"])

const MarketsPage = () => {
  const dispatch = useAppDispatch()
  const { group } = useParams<{ group: string }>()
  console.log(group)

  const trending = useSelector(selectTrendingMarkets)
  const newMarkets = useSelector(selectNewMarkets)
  const allMarkets = useSelector(selectAllMarkets) // ← raw, no category filter
  useEffect(() => {
    return () => {
      dispatch(setSelectedCategory(""))
    }
  }, [])

  const markets = useMemo(() => {
    if (!group) return allMarkets

    // ✅ known group key → use selector result
    if (KNOWN_GROUPS.has(group)) {
      const groupMap: Record<string, Market[]> = {
        trending,
        new_market: newMarkets,
        ending_soon: allMarkets,
        earn_rewards: allMarkets,
      }
      return groupMap[group] ?? allMarkets
    }

    // ✅ not a known group → treat as category, filter from URL param directly
    // this survives refresh because group comes from URL, not Redux
    if (group === "All Markets") return allMarkets
    return allMarkets.filter((m) => {
      if (m.category.toLowerCase() === group.toLowerCase()) return true
    })
  }, [group, trending, newMarkets, allMarkets])

  const title = group ? (GROUP_TITLES[group] ?? `${group} `) : "All Markets"

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 md:mx-20">
      <div className="mp-header">
        <h1 className="mp-title">{title}</h1>
        <span className="mp-count">{markets.length} markets</span>
      </div>

      {markets.length === 0 ? (
        <p className="mp-empty">No markets found.</p>
      ) : (
        <div className="mp-list">
          {markets.map((market) => {
            if (market.type === MARKET_TYPES.MULTI_OPTION_BINARY) {
              return <MultiOptionBinaryMarketCard key={market.id} market={market} />
            }
            if (market.type === MARKET_TYPES.BINARY) {
              return <BinaryMarketCard key={market.id} market={market} />
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export default MarketsPage
