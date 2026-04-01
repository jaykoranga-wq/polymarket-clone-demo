// src/hooks/usePriceChart.ts

import { useCallback, useState } from "react"

import { type ChartTab, generateMockPriceHistory, type PricePoint } from "@/mocks/mockPriceHistory"

interface UsePriceChartOptions {
  startPrice?: number // initial yes probability 0–1, e.g. 0.65
}

export const usePriceChart = ({ startPrice = 0.5 }: UsePriceChartOptions) => {
  const [tab, setTab] = useState<ChartTab>("1M")
  const [history, setHistory] = useState<PricePoint[]>(() =>
    generateMockPriceHistory("1M", startPrice),
  )

  // change timeframe tab — regenerates mock data
  // TODO: replace setHistory call with API fetch when backend ready
  const changeTab = useCallback(
    (newTab: ChartTab) => {
      setTab(newTab)
      setHistory(generateMockPriceHistory(newTab, startPrice))
      // future: dispatch(fetchPriceHistory({ marketId, range: newTab }))
    },
    [startPrice],
  )

  // called by socket — updates chart WITHOUT full rerender
  // PriceChart reads this via ref and calls series.update() directly
  const appendTick = useCallback((tick: PricePoint) => {
    setHistory((prev) => {
      const next = [...prev, tick]
      return next.slice(-500) // keep max 500 points in memory
    })
  }, [])

  // computed from last two points
  const lastPrice = history[history.length - 1]?.yesPrice ?? startPrice
  const firstPrice = history[0]?.yesPrice ?? startPrice
  const priceDelta = lastPrice - firstPrice
  const pctChange = firstPrice > 0 ? (priceDelta / firstPrice) * 100 : 0
  const isPositive = pctChange >= 0

  return {
    tab,
    history,
    changeTab,
    appendTick,
    lastPrice,
    pctChange,
    isPositive,
  }
}
