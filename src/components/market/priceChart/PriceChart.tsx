// src/components/market/PriceChart/PriceChart.tsx
//
// ── Design decisions ──────────────────────────────────────────────────────────
// 1. memo() — prevents rerender when EventPage parent updates unrelated state
// 2. seriesRef — socket ticks call series.update() DIRECTLY, bypassing React
// 3. Full rerender only happens when `history` prop array reference changes
//    (tab switch) — not on individual ticks
// ─────────────────────────────────────────────────────────────────────────────

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type OhlcData,
  type SingleValueData,
} from "lightweight-charts"
import { memo, useEffect, useRef } from "react"

import type { ChartTab, PricePoint } from "@/mocks/mockPriceHistory"

// ── Props interface ───────────────────────────────────────────────────────────
export interface PriceChartProps {
  // data
  history: PricePoint[] // full price history array
  tab: ChartTab // active timeframe tab
  onTabChange: (t: ChartTab) => void

  // header display
  currentPrice: number // 0–1, shown as $0.65
  pctChange: number // e.g. 12.4 — shown as +12.4%
  isPositive: boolean // controls green vs red color

  // optional
  height?: number // chart height in px, default 220
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS: ChartTab[] = ["1D", "1W", "1M", "ALL"]

// ── Component — wrapped in memo to isolate rerenders ─────────────────────────
export const PriceChart = memo(
  ({
    history,
    tab,
    onTabChange,
    currentPrice,
    pctChange,
    isPositive,
    height = 220,
  }: PriceChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    // ── Create chart once on mount ─────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current) return

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "white",
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          vertLine: {
            color: "#00c853",
            width: 1,
            style: 0, // Solid
            labelVisible: false,
          },
          horzLine: {
            color: "#00c853",
            width: 1,
            style: 0, // Solid
            labelVisible: false,
          },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.05)",
          timeVisible: false,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.05)",
          scaleMargins: { top: 0.12, bottom: 0.12 },
        },
        handleScroll: false,
        handleScale: false,
      })

      chartRef.current = chart

      const series = chart.addSeries(AreaSeries, {
        lineColor: "#00c853",
        topColor: "rgba(0,200,83,0.18)",
        bottomColor: "rgba(0,200,83,0)",
        lineWidth: 2,
        priceFormat: {
          type: "custom",
          formatter: (v: number) => `${(v * 100).toFixed(0)}¢`,
        },
      })

      seriesRef.current = series

      // ── Tooltip logic ────────────────────────────────────────────────────────
      chart.subscribeCrosshairMove((param) => {
        if (!tooltipRef.current || !containerRef.current) return

        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > containerRef.current.clientWidth ||
          param.point.y < 0 ||
          param.point.y > height
        ) {
          tooltipRef.current.style.display = "none"
        } else {
          const data = param.seriesData.get(series)
          if (!data) {
            tooltipRef.current.style.display = "none"
            return
          }

          tooltipRef.current.style.display = "block"
          const price = "value" in data ? (data as SingleValueData).value : (data as OhlcData).close
          const coordinate = series.priceToCoordinate(price)

          // Tooltip content
          const priceEl = tooltipRef.current.querySelector(".tt-price")
          const dateEl = tooltipRef.current.querySelector(".tt-date")

          if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`
          if (dateEl) {
            const date = new Date((param.time as number) * 1000)
            const formattedDate = date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
            // Ensure format "MMM DD, HH:mm"
            dateEl.textContent = formattedDate.replace(",", "")
            // Actually to match "Oct 24, 14:20" exactly with comma and space
            dateEl.textContent = `${date.toLocaleString("en-US", { month: "short", day: "numeric" })}, ${date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`
          }

          // Positioning
          const tooltipWidth = 120
          const tooltipHeight = 70
          const margin = 15

          let left = param.point.x + margin
          if (left > containerRef.current.clientWidth - tooltipWidth) {
            left = param.point.x - tooltipWidth - margin
          }

          let top = coordinate! - tooltipHeight - margin
          if (top < 0) {
            top = coordinate! + margin
          }

          tooltipRef.current.style.left = `${left}px`
          tooltipRef.current.style.top = `${top}px`
        }
      })

      // resize observer — chart fills container on window resize
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
    }, [height]) // only recreate if height prop changes

    // ── Update data when history changes (tab switch) ──────────────────────────
    // Does NOT recreate the chart — just replaces data
    useEffect(() => {
      if (!seriesRef.current || history.length === 0) return

      const data = history.map((p) => ({
        time: p.timestamp as unknown as string,
        value: p.yesPrice,
      }))

      seriesRef.current.setData(data)
      chartRef.current?.timeScale().fitContent()
    }, [history])

    const pctFormatted = `${isPositive ? "+" : ""}${pctChange.toFixed(1)}%`

    return (
      <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 rounded-2xl mb-7.5 p-6 relative">
        {/* ── Header: price + change + tabs ── */}
        <div className="flex md:flex-row flex-col md:items-center justify-between gap-0.5 pb-2">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-sm">Price History</span>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="text-white font-2xl font-black">${currentPrice.toFixed(2)}</div>
                <div className={`text-primary flex items-center${isPositive ? "" : " negative"}`}>
                  <span>{isPositive ? "↗" : "↘"}</span>
                  <span>{pctFormatted} (24h)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe tabs */}
          <div className="flex gap-2 p-1 rounded-2md max-w-fit border border-white/10 m-0 bg-white/5">
            {TABS.map((t) => (
              <button
                key={t}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer transition-all duration-120 hover:text-[#e2e8f0]
                  ${tab === t ? " bg-primary text-black shadow-[0px_4px_6px_-4px_rgba(16,210,96,0.3),0px_10px_15px_-3px_rgba(16,210,96,0.3)]" : "bg-transparent text-white/60"}`}
                onClick={() => onTabChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chart canvas ── */}
        {history.length === 0 ? (
          <div className="ep-chart-empty">No price history yet</div>
        ) : (
          <div className="relative overflow-hidden">
            <div ref={containerRef} style={{ width: "100%", minHeight: height }} />
            {/* Custom Tooltip */}
            <div
              ref={tooltipRef}
              className="absolute z-10 pointer-events-none bg-[#102218] border border-[#00c853] rounded-md p-2.5 shadow-2xl space-y-0.5"
              style={{ display: "none", width: "120px" }}
            >
              <div className="font-xs font-bold text-muted-foreground uppercase tracking-wider">
                Current Price
              </div>
              <div className="tt-price font-sm font-black text-white leading-tight">$0.00</div>
              <div className="tt-date font-xs text-secondary">Date here</div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

PriceChart.displayName = "PriceChart"
