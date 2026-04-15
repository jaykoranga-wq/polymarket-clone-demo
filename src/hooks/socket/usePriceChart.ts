// src/hooks/usePriceChart.ts

import { useEffect, useState } from "react"

import { type OhlcCandle, useGetPriceHistoryQuery } from "@/features/api/markets/marketApi"

export type { OhlcCandle }

export type ChartTab = "1D" | "1W" | "1M" | "ALL"

export const TAB_INTERVAL: Record<ChartTab, string> = {
  "1D": "1d",
  "1W": "1w",
  "1M": "1m",
  ALL: "1y",
}

interface UsePriceChartOptions {
  optionGroupId: string
}

export const usePriceChart = ({ optionGroupId }: UsePriceChartOptions) => {
  const [tab, setTab] = useState<ChartTab>("1M")

  // console.log("[usePriceChart] optionGroupId:", optionGroupId, "| tab:", tab, "| interval:", TAB_INTERVAL[tab])

  const {
    data: history = [],
    isFetching,
    isError,
    error,
  } = useGetPriceHistoryQuery(
    { optionGroupId, interval: TAB_INTERVAL[tab] },
    { skip: !optionGroupId },
  )

  useEffect(() => {
    if (!optionGroupId) {
      console.warn("[usePriceChart] optionGroupId is empty — query skipped")
      return
    }
    // console.log("[usePriceChart] query state — isFetching:", isFetching, "| isError:", isError, "| dataPoints:", history.length)
    if (isError) console.error("[usePriceChart] query error:", error)
    if (history.length > 0) {
      // console.log("[usePriceChart] first candle:", history[0], "| last candle:", history[history.length - 1])
    }
  }, [optionGroupId, isFetching, isError, history, error])

  const changeTab = (newTab: ChartTab) => {
    console.log("[usePriceChart] tab changed:", tab, "→", newTab)
    setTab(newTab)
  }

  const lastPrice = history[history.length - 1]?.close ?? 0
  const firstPrice = history[0]?.close ?? 0
  const priceDelta = lastPrice - firstPrice
  const pctChange = firstPrice > 0 ? (priceDelta / firstPrice) * 100 : 0
  const isPositive = pctChange >= 0

  return { tab, history, changeTab, lastPrice, pctChange, isPositive, isFetching }
}
