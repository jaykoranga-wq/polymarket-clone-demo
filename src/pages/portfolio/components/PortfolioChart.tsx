// src/pages/portfolio/components/PortfolioChart.tsx

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { memo, useEffect, useRef, useState } from "react"

import { formatCash } from "@/libs/formatCurrency"
import type { PortfolioChartPoint } from "@/mocks/mockPortfolio"

import { CHART_TABS, type ChartTab, PORTFOLIO_COLORS } from "../portfolioConstants"

const TABS = Object.values(CHART_TABS)

interface PortfolioChartProps {
  data: PortfolioChartPoint[]
  portfolioValue: number
  delta: number
  deltaPct: number
  // TODO: onTabChange(tab) → fetch different range from API
  onTabChange?: (tab: ChartTab) => void
}

export const PortfolioChart = memo(
  ({ data, portfolioValue, delta, deltaPct, onTabChange }: PortfolioChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const [activeTab, setActiveTab] = useState<ChartTab>(CHART_TABS.ONE_MONTH)

    const isPositive = delta >= 0

    // create chart once
    useEffect(() => {
      if (!containerRef.current) return

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 280,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(255,255,255,0.3)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          vertLine: { color: "rgba(0,200,83,0.3)", labelBackgroundColor: "#161a22" },
          horzLine: { color: "rgba(0,200,83,0.3)", labelBackgroundColor: "#161a22" },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.05)",
          timeVisible: true,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.05)",
          scaleMargins: { top: 0.1, bottom: 0.05 },
        },
        handleScroll: false,
        handleScale: false,
      })

      chartRef.current = chart

      const series = chart.addSeries(AreaSeries, {
        lineColor: PORTFOLIO_COLORS.GREEN,
        topColor: "rgba(0,200,83,0.25)",
        bottomColor: "rgba(0,200,83,0)",
        lineWidth: 2,
        priceFormat: {
          type: "custom",
          formatter: (v: number) => `$${v.toLocaleString()}`,
        },
      })

      seriesRef.current = series

      const observer = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
      })
      observer.observe(containerRef.current)

      return () => {
        observer.disconnect()
        chart.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }, [])

    // update data when it changes
    useEffect(() => {
      if (!seriesRef.current || data.length === 0) return
      const BASE = Math.floor(Date.now() / 1000) - data.length * 86400
      seriesRef.current.setData(
        data.map((p, i) => ({
          time: (BASE + i * 86400) as unknown as string,
          value: p.value,
        })),
      )
      chartRef.current?.timeScale().fitContent()
    }, [data])

    const handleTabChange = (tab: ChartTab) => {
      setActiveTab(tab)
      onTabChange?.(tab)
      // TODO: fetch new chart data for this range from API
    }

    return (
      <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 rounded-2xl mb-7.5 p-6 relative">
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: PORTFOLIO_COLORS.TEXT_MUTED,
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Portfolio Value
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: PORTFOLIO_COLORS.TEXT_PRIMARY,
                  letterSpacing: "-0.02em",
                }}
              >
                {formatCash(portfolioValue)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isPositive ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
                }}
              >
                {isPositive ? "+" : ""}
                {formatCash(delta)} ({isPositive ? "+" : ""}
                {deltaPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* tab switcher */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  background: activeTab === t ? PORTFOLIO_COLORS.GREEN : "transparent",
                  color: activeTab === t ? "#000" : PORTFOLIO_COLORS.TEXT_MUTED,
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* chart */}
        <div ref={containerRef} style={{ width: "100%", minHeight: 280 }} />
      </div>
    )
  },
)

PortfolioChart.displayName = "PortfolioChart"
