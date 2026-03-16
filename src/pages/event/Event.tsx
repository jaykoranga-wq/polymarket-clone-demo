import "./eventPage.css"

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"
import { Toaster } from "sonner"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { LoginModal } from "@/components/auth/LoginModal"
// ✅ FIX 1: replaced IcoBookmark/IcoLink with smaller versions from new file
import {
  IcoBookmarkSm,
  IcoClockSm,
  IcoRepeatSm,
  IcoShareSm,
  IcoVolSm,
} from "@/components/custom/EventPageIcons"
import TradePanel from "@/components/event/tradePanel/TradePanel"
import { CommentSection } from "@/components/market/comment/CommentSection"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { selectUserLoading } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { shorten } from "@/features/markets/lib/utils"
import { setSelectedMarket } from "@/features/markets/marketSlice"
import { MARKET_TYPES } from "@/features/markets/marketTypes"
import type { BinaryMarket, PricePoint } from "@/features/markets/types"
import type { TradeOrder, TradePanelOrder } from "@/hooks/trade/TradeTypes"
import { useTrade } from "@/hooks/trade/useTrade"
// ✅ FIX 2: separate date formatter
import { formatMarketDate } from "@/libs/formatDate"
import { MOCK_MARKETS } from "@/mocks/mockData"

const RULES_MAX = 200
type TabKey = "rules" | "activity" | "orderbook" | "comments"

// ─── PriceChart ───────────────────────────────────────────────────────────────

const PriceChart = ({ priceHistory }: { priceHistory: PricePoint[] }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const yesRef = useRef<ISeriesApi<"Area"> | null>(null)

  useEffect(() => {
    if (!containerRef.current || priceHistory.length === 0) return

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
        vertLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1a1e26" },
        horzLine: { color: "rgba(255,255,255,0.15)", labelBackgroundColor: "#1a1e26" },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      handleScroll: false,
      handleScale: false,
    })

    chartRef.current = chart

    const yesSeries = chart.addSeries(AreaSeries, {
      lineColor: "#00c853",
      topColor: "rgba(0,200,83,0.22)",
      bottomColor: "rgba(0,200,83,0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (v: number) => `${(v * 100).toFixed(0)}¢`,
      },
    })
    yesRef.current = yesSeries

    const BASE_TIME = 1696118400
    yesSeries.setData(
      priceHistory.map((p, i) => ({
        time: (BASE_TIME + i * 86400) as unknown as string,
        value: p.yesPrice,
      })),
    )
    chart.timeScale().fitContent()

    const observer = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      yesRef.current = null
    }
  }, [priceHistory])

  return <div ref={containerRef} style={{ width: "100%", minHeight: 220 }} />
}

// ─── EventPage ────────────────────────────────────────────────────────────────

const EventPage = () => {
  // const navigate    = useNavigate()
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const market = useAppSelector((s) => s.markets.selectedMarket)
  const userLoading = useSelector(selectUserLoading)
  const { magic } = useMagic()

  const [chartTab, setChartTab] = useState("ALL")
  const [activeTab, setActiveTab] = useState<TabKey>("rules")
  const [rulesOpen, setRulesOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const { executeTrade, tradeError } = useTrade()

  const handleTrade = (params: TradePanelOrder) => {
    if (
      !market?.id ||
      !market?.yesTokenId ||
      !market?.noTokenId ||
      !market?.collateralToken ||
      !market?.conditionId
    ) {
      console.error("Market blockchain data missing — cannot trade")
      return
    }
    executeTrade({
      ...params,
      marketId: market.id,
      yesTokenId: market.yesTokenId,
      noTokenId: market.noTokenId,
      collateralToken: market.collateralToken,
      conditionId: market.conditionId,
    } satisfies TradeOrder)
  }

  useEffect(() => {
    if (!id || market?.id === id) return
    const found = [...MOCK_MARKETS].find((m) => m.id === id)
    if (found) dispatch(setSelectedMarket(found))
  }, [id])

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

  const TABS: { key: TabKey; label: string }[] = [
    { key: "rules", label: "Market Rules" },
    { key: "activity", label: "Activity" },
    { key: "orderbook", label: "Order Book" },
    { key: "comments", label: "Comments" },
  ]

  return (
    <>
      {tradeError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/40 text-red-300 text-sm px-4 py-2 rounded-xl z-50">
          {tradeError}
        </div>
      )}

      <div className="ep md:px-20 px-4 md:mx-20">
        <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <Toaster richColors position="top-center" />
        {userLoading && <AuthLoader />}

        {/* ── Breadcrumb ── */}
        <div className="ep-breadcrumb">
          <span>{market.category}</span>
          <span className="ep-breadcrumb-sep">›</span>
          <span className="ep-breadcrumb-curr">
            {market.title.length > 50 ? market.title.slice(0, 50) + "…" : market.title}
          </span>
        </div>

        {/* ── Title + icons on same row ── */}
        <div className="ep-title-row">
          <h1 className="ep-page-title">{market.title}</h1>
          {/* ✅ FIX 1: sm class → 32px buttons, new icons */}
          <div className="ep-header-icons">
            <button className="ep-icon-btn sm">
              <IcoShareSm />
            </button>
            <button className="ep-icon-btn sm">
              <IcoBookmarkSm />
            </button>
          </div>
        </div>

        {/* ── Meta chips ── */}
        {/* ✅ FIX 2: IcoClockSm (14px forced), formatMarketDate, new icons */}
        <div className="ep-stats">
          <div className="ep-chip">
            <IcoClockSm />
            Ends <strong>{formatMarketDate(market.expiryDate)}</strong>
          </div>
          <div className="ep-chip">
            <IcoVolSm />
            <strong>{market.volume}</strong> Vol
          </div>
          {/* {market.liquidity && (
            <div className="ep-chip">
              <IcoLiquiditySm />
              <strong>{market.liquidity}</strong> Liquidity
            </div>
          )} */}
          {market.frequency && (
            <div className="ep-chip">
              <IcoRepeatSm />
              {market.frequency}
            </div>
          )}
          {market.isTrending && <div className="ep-trending">🔥 Trending</div>}
        </div>

        {/* ── Two-column layout ── (unchanged below) ── */}
        <div className="ep-layout">
          {/* ══ LEFT ══ */}
          <div className="ep-left">
            {/* Chart card */}
            <div className="ep-chart-card">
              <div className="ep-chart-header">
                <div>
                  <div className="ep-price-label">Yes Price Probability</div>
                  <div className="ep-price-big">${(yesP / 100).toFixed(2)}</div>
                  <div className="ep-price-change">
                    <span>↗</span>
                    <span>+12.4% (24h)</span>
                  </div>
                </div>
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

              {!market.priceHistory || market.priceHistory.length === 0 ? (
                <div className="ep-chart-empty">No price history yet</div>
              ) : (
                <PriceChart priceHistory={market.priceHistory} />
              )}
            </div>

            {/* Bottom tabs */}
            <div className="ep-tabs-row">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`ep-tab${activeTab === t.key ? " active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="ep-tab-content">
              {activeTab === "rules" && (
                <div className="ep-section">
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
                    <div>
                      <div className="ep-meta-label">Volume</div>
                      <div className="ep-meta-value">{market.volume}</div>
                    </div>
                    <div>
                      <div className="ep-meta-label">End Date</div>
                      {/* ✅ formatMarketDate used here too */}
                      <div className="ep-meta-value">{formatMarketDate(market.expiryDate)}</div>
                    </div>
                    {market.createdAt && (
                      <div>
                        <div className="ep-meta-label">Created</div>
                        <div className="ep-meta-value">{formatMarketDate(market.createdAt)}</div>
                      </div>
                    )}
                    {market.resolver && (
                      <div>
                        <div className="ep-meta-label">Resolver</div>
                        <div className="ep-meta-value mono">{shorten(market.resolver)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <p className="ep-rules-text" style={{ textAlign: "center", padding: "48px 0" }}>
                  Activity feed coming soon.
                </p>
              )}

              {activeTab === "orderbook" && (
                <div className="ep-section">
                  <div className="ep-section-header">
                    <span className="ep-section-title">
                      Order Book <span className="ep-section-title-info">i</span>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--ep-mono)",
                        fontSize: 11,
                        color: "var(--ep-muted)",
                      }}
                    >
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
              )}

              {activeTab === "comments" && <CommentSection marketId={market.id} />}
            </div>
          </div>

          {/* ══ RIGHT ══ */}
          <div className="ep-right">
            <div className="ep-sticky">
              <TradePanel
                yesProbability={yesP}
                noProbability={noP}
                isCrypto={!isBinary}
                onLoginRequired={() => setIsLoginOpen(true)}
                onDepositRequired={() => magic?.wallet?.showUI()}
                onTrade={handleTrade}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default EventPage
