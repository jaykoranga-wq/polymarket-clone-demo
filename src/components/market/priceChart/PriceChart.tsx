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

    // ── Create chart once on mount ─────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current) return

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#5a6478",
          fontFamily: "'DM Mono', 'Fira Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          vertLine: {
            color: "#00c853",
            labelBackgroundColor: "#161a22",
            width: 1,
            style: 1,
          },
          horzLine: {
            color: "#00c853",
            labelBackgroundColor: "#161a22",
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

    // ── Socket-ready: appendTick calls this externally ─────────────────────────
    // Expose series update method via ref for socket hook to call directly
    // This is what prevents full React rerender on every socket tick
    // Usage in parent: chartRef.current?.update(tick)
    // (see useMarketSocket.ts when implementing sockets)

    const pctFormatted = `${isPositive ? "+" : ""}${pctChange.toFixed(1)}%`

    return (
      <div className="ep-chart-card">
        {/* ── Header: price + change + tabs ── */}
        <div className="ep-chart-header">
          <div>
            <div className="ep-price-label">Yes Price Probability</div>
            <div className="ep-price-big">${currentPrice.toFixed(2)}</div>
            <div className={`ep-price-change${isPositive ? "" : " negative"}`}>
              <span>{isPositive ? "↗" : "↘"}</span>
              <span>{pctFormatted} (24h)</span>
            </div>
          </div>

          {/* Timeframe tabs */}
          <div className="ep-chart-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`ep-chart-tab${tab === t ? " active" : ""}`}
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
          <div ref={containerRef} style={{ width: "100%", minHeight: height }} />
        )}
      </div>
    )
  },
)

PriceChart.displayName = "PriceChart"
