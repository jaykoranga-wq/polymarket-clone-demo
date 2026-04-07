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
          textColor: "white",
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
        <div className="flex md:flex-row flex-col md:items-center justify-between gap-3 pb-3">
          <div>
            <div className="text-muted-foreground font-sm">Portfolio Value</div>
            <div className="flex items-center gap-3">
              <span className="text-white font-2xl font-black">{formatCash(portfolioValue)}</span>
              <span className="text-primary ">
                {isPositive ? "+" : ""}
                {formatCash(delta)} ({isPositive ? "+" : ""}
                {deltaPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* tab switcher */}
          <div className="flex gap-2 p-1 rounded-2md max-w-fit border border-white/10 m-0 bg-white/5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-120 hover:text-[#e2e8f0]
                  ${activeTab === t ? " bg-primary text-black shadow-[0px_4px_6px_-4px_rgba(16,210,96,0.3),0px_10px_15px_-3px_rgba(16,210,96,0.3)]" : "bg-transparent text-white/60"}`}
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
