import "./styles/eventPage.css"

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router"
import { Toaster } from "sonner"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { LoginModal } from "@/components/auth/LoginModal"
import { IcoBack } from "@/components/custom/IcoBack"
import { IcoBookmark } from "@/components/custom/IcoBookmark"
import { IcoClock } from "@/components/custom/IcoClock"
import { IcoLink } from "@/components/custom/IconLink"
import { IcoRepeat } from "@/components/custom/IcoRepeat"
import { IcoVol } from "@/components/custom/IcoVol"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { selectUserLoading } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { shorten } from "@/features/markets/lib/utils"
import { setSelectedMarket } from "@/features/markets/marketSlice"
import { MARKET_TYPES } from "@/features/markets/marketTypes"
import type { BinaryMarket, PricePoint } from "@/features/markets/types"
import { MOCK_MARKETS } from "@/mocks/mockData"

import TradePanel from "../components/event/tradePanel/TradePanel"

const RULES_MAX = 200

// ─── PriceChart — lightweight-charts ─────────────────────────────────────────

interface PriceChartProps {
  priceHistory: PricePoint[]
}

const PriceChart = ({ priceHistory }: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const yesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const noRef = useRef<ISeriesApi<"Area"> | null>(null)

  useEffect(() => {
    if (!containerRef.current || priceHistory.length === 0) return

    // ── Create chart instance ─────────────────────────────────────────────────
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#5a6478",
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        vertLine: {
          color: "rgba(255,255,255,0.15)",
          labelBackgroundColor: "#1a1e26",
        },
        horzLine: {
          color: "rgba(255,255,255,0.15)",
          labelBackgroundColor: "#1a1e26",
        },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: false, // hide raw unix timestamps — looks cleaner
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      handleScroll: false, // disable scroll on the chart so page scrolls normally
      handleScale: false,
    })

    chartRef.current = chart

    // ── YES series — green area ───────────────────────────────────────────────
    const yesSeries = chart.addSeries(AreaSeries, {
      lineColor: "#22c55e",
      topColor: "rgba(34,197,94,0.2)",
      bottomColor: "rgba(34,197,94,0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (v: number) => `${(v * 100).toFixed(0)}¢`,
      },
    })
    yesRef.current = yesSeries

    // ── NO series — red area ──────────────────────────────────────────────────
    const noSeries = chart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      topColor: "rgba(239,68,68,0.12)",
      bottomColor: "rgba(239,68,68,0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (v: number) => `${(v * 100).toFixed(0)}¢`,
      },
    })
    noRef.current = noSeries

    // ── Feed data ─────────────────────────────────────────────────────────────
    // lightweight-charts needs { time, value }
    // time must be a unix timestamp (number) or "YYYY-MM-DD" string
    // your mock uses "Oct 1" style strings — we use sequential unix timestamps
    // starting from a fixed base, one day apart — visually correct
    const BASE_TIME = 1696118400 // Oct 1 2023 in unix seconds

    const yesData = priceHistory.map((p, i) => ({
      time: (BASE_TIME + i * 86400) as unknown as string,
      value: p.yesPrice, // keep 0–1 range, formatter shows as cents
    }))

    // const noData = priceHistory.map((p, i) => ({
    //   time:  (BASE_TIME + i * 86400) as unknown as string,
    //   value: 1 - p.yesPrice,
    // }))

    yesSeries.setData(yesData)
    // noSeries.setData(noData)
    chart.timeScale().fitContent()

    // ── Resize observer — chart fills container on window resize ──────────────
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    observer.observe(containerRef.current)

    // ── Cleanup — ALWAYS remove chart on unmount ──────────────────────────────
    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      yesRef.current = null
      noRef.current = null
    }
  }, [priceHistory])

  return <div ref={containerRef} style={{ width: "100%", minHeight: 220 }} />
}

// ─── EventPage ────────────────────────────────────────────────────────────────

const EventPage = () => {
  const navigate = useNavigate()
  const list = [...MOCK_MARKETS]
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const market = useAppSelector((state) => state.markets.selectedMarket)
  const userLoading = useSelector(selectUserLoading)
  const { magic } = useMagic()

  const [chartTab, setChartTab] = useState("ALL")
  const [rulesOpen, setRulesOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    if (market?.id === id) return
    const foundMarket = list.find((m) => m.id === id)
    if (foundMarket) dispatch(setSelectedMarket(foundMarket))
  }, [id, list])

  if (!market) {
    return (
      <div className="ep">
        <div className="ep-not-found">Market not found.</div>
      </div>
    )
  }

  const isBinary = market.type === MARKET_TYPES.BINARY
  const bm = isBinary ? (market as BinaryMarket) : null
  const yesP = bm?.yesProbability ?? 50
  const noP = bm?.noProbability ?? 50

  const maxShares = market.orderBook
    ? Math.max(
        ...market.orderBook.yes.map((r) => r.shares),
        ...market.orderBook.no.map((r) => r.shares),
        1,
      )
    : 1

  const rules = market.rules ?? ""
  const rulesPreview =
    rules.length > RULES_MAX && !rulesOpen ? rules.slice(0, RULES_MAX) + "…" : rules

  return (
    <>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 md:mx-20">
        <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <Toaster richColors position="top-center" />
        {userLoading && <AuthLoader />}

        <div className="ep">
          <button className="ep-back" onClick={() => navigate(-1)}>
            <IcoBack /> Back to markets
          </button>

          <div className="ep-layout">
            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <div className="ep-left">
              {/* ── Header ── */}
              <div className="ep-header">
                <div className="ep-header-top">
                  <img className="ep-thumb" src={market.thumbnailUrl} alt={market.title} />
                  <div className="ep-title-wrap">
                    <div className="ep-category">{market.category}</div>
                    <h1 className="ep-title">{market.title}</h1>
                  </div>
                  <div className="ep-header-icons">
                    <button className="ep-icon-btn">
                      <IcoLink />
                    </button>
                    <button className="ep-icon-btn">
                      <IcoBookmark />
                    </button>
                  </div>
                </div>

                <div className="ep-stats">
                  <div className="ep-chip">
                    <IcoVol />
                    <strong>{market.volume}</strong> Vol
                  </div>
                  <div className="ep-chip">
                    <IcoClock />
                    Ends <strong>{market.expiryDate}</strong>
                  </div>
                  <div className="ep-chip">
                    <IcoRepeat />
                    {market.frequency}
                  </div>
                  {market.isTrending && <div className="ep-trending">🔥 Trending</div>}
                </div>
              </div>

              {/* ── Price Chart ── */}
              <div className="ep-section">
                <div className="ep-section-header">
                  <span className="ep-section-title">Price History</span>
                  <div className="ep-chart-tabs">
                    {["1D", "1W", "1M", "ALL"].map((t) => (
                      <button
                        key={t}
                        className={`ep-chart-tab${chartTab === t ? " active" : ""}`}
                        onClick={() => setChartTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YES / NO legend */}
                <div className="ep-chart-legend">
                  <div className="ep-legend-item">
                    <div className="ep-legend-dot yes" /> YES
                  </div>
                  <div className="ep-legend-item">
                    <div className="ep-legend-dot no" /> NO
                  </div>
                </div>

                {/* ── Chart — lightweight-charts replaces Recharts here ── */}
                {!market.priceHistory || market.priceHistory.length === 0 ? (
                  <div className="ep-chart-empty">No price history yet</div>
                ) : (
                  <PriceChart priceHistory={market.priceHistory} />
                )}
              </div>

              {/* ── Order Book ── */}
              <div className="ep-section">
                <div className="ep-section-header">
                  <span className="ep-section-title">
                    Order Book
                    <span className="ep-section-title-info">i</span>
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                    PRICE · SHARES
                  </span>
                </div>

                {!market.orderBook ? (
                  <div className="ep-ob-empty">No orders yet</div>
                ) : (
                  <div className="ep-ob-grid">
                    <div>
                      <div className="ep-ob-col-label yes">▲ YES</div>
                      <div className="ep-ob-col-head">
                        <span>Price</span>
                        <span style={{ textAlign: "right" }}>Shares</span>
                      </div>
                      {market.orderBook.yes.map((row, i) => (
                        <div key={i} className="ep-ob-row yes">
                          <div
                            className="ep-ob-depth"
                            style={{ width: `${(row.shares / maxShares) * 100}%` }}
                          />
                          <span className="ep-ob-price yes">{(row.price * 100).toFixed(0)}¢</span>
                          <span className="ep-ob-shares">{row.shares.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="ep-ob-col-label no">▼ NO</div>
                      <div className="ep-ob-col-head">
                        <span>Price</span>
                        <span style={{ textAlign: "right" }}>Shares</span>
                      </div>
                      {market.orderBook.no.map((row, i) => (
                        <div key={i} className="ep-ob-row no">
                          <div
                            className="ep-ob-depth"
                            style={{ width: `${(row.shares / maxShares) * 100}%` }}
                          />
                          <span className="ep-ob-price no">{(row.price * 100).toFixed(0)}¢</span>
                          <span className="ep-ob-shares">{row.shares.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Rules & About ── */}
              <div className="ep-section">
                <div className="ep-section-header">
                  <span className="ep-section-title">Rules &amp; Resolution</span>
                </div>

                {rules ? (
                  <>
                    <p className="ep-rules-text">{rulesPreview}</p>
                    {rules.length > RULES_MAX && (
                      <button className="ep-rules-toggle" onClick={() => setRulesOpen((p) => !p)}>
                        {rulesOpen ? "▲ Show less" : "▼ Show more"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="ep-rules-text">No resolution rules provided.</p>
                )}

                <div className="ep-meta-grid">
                  <div className="ep-meta-item">
                    <div className="ep-meta-label">Volume</div>
                    <div className="ep-meta-value">{market.volume}</div>
                  </div>
                  <div className="ep-meta-item">
                    <div className="ep-meta-label">End Date</div>
                    <div className="ep-meta-value">{market.expiryDate}</div>
                  </div>
                  {market.createdAt && (
                    <div className="ep-meta-item">
                      <div className="ep-meta-label">Created At</div>
                      <div className="ep-meta-value">{market.createdAt}</div>
                    </div>
                  )}
                  {market.resolver && (
                    <div className="ep-meta-item">
                      <div className="ep-meta-label">Resolver</div>
                      <div className="ep-meta-value mono">{shorten(market.resolver)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* ══════════════ END LEFT ══════════════ */}

            {/* ══════════════ RIGHT COLUMN ══════════════ */}
            <div className="ep-right">
              <div className="ep-sticky">
                <TradePanel
                  yesProbability={yesP}
                  noProbability={noP}
                  isCrypto={!isBinary}
                  onLoginRequired={() => {
                    setIsLoginOpen(true)
                  }}
                  onDepositRequired={() => magic?.wallet?.showUI()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default EventPage
