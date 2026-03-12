// src/pages/MarketsPage.tsx
import "./marketPage.css"

import { useMemo } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"

import { BinaryMarketCard } from "@/components/market/BinaryMarketCard"
import { MultiOptionBinaryMarketCard } from "@/components/market/MultiOptionBinaryMarketCard"
import {
  selectFilteredMarkets,
  selectNewMarkets,
  selectTrendingMarkets,
} from "@/features/markets/marketSelectors"
import { MARKET_TYPES } from "@/features/markets/marketTypes"
import type { Market } from "@/features/markets/types"

const GROUP_TITLES: Record<string, string> = {
  trending: "🔥 Trending Markets",
  ending_soon: "⏰ Ending Soon Markets",
  new_market: "🆕 New Markets",
  earn_rewards: "📈 Earn Rewards Markets",
}

const MarketsPage = () => {
  const { group } = useParams<{ group: string }>()

  const trending = useSelector(selectTrendingMarkets)
  const newMarkets = useSelector(selectNewMarkets)
  const allMarkets = useSelector(selectFilteredMarkets)

  // ✅ keys exactly match route param values e.g. /markets/trending
  const marketMap: Record<string, Market[]> = {
    trending,
    new_market: newMarkets,
    ending_soon: allMarkets.filter((m) => m.isTrending), // swap with real selector when ready
    earn_rewards: allMarkets,
  }

  // ✅ no useState + useEffect needed — useMemo re-runs when selectors update
  const markets = useMemo(() => {
    if (!group) return allMarkets
    return marketMap[group] ?? allMarkets
  }, [group, trending, newMarkets, allMarkets])

  const title = group ? (GROUP_TITLES[group] ?? "All Markets") : "All Markets"

  return (
    <div className="mp-wrap">
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
