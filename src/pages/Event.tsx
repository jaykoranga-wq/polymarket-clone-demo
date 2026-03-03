import "./styles/eventPage.css"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Toaster } from "sonner"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { IcoBack } from "@/components/custom/IcoBack"
import { IcoBookmark } from "@/components/custom/IcoBookmark"
import { IcoClock } from "@/components/custom/IcoClock"
import { IcoLink } from "@/components/custom/IconLink"
import { IcoRepeat } from "@/components/custom/IcoRepeat"
import { IcoVol } from "@/components/custom/IcoVol"
import { CategoryTabs } from "@/components/layout/CategoryTabs"
import { Navbar } from "@/components/layout/Navbar"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { MARKET_TYPES } from "@/constants/marketTypes"
import { selectUserLoading } from "@/features/auth/authSlice"
import { setSelectedMarket } from "@/features/markets/marketSlice"
import { MOCK_MARKETS } from "@/features/markets/mockData"
import type { BinaryMarket } from "@/features/markets/types"
import { shorten } from "@/lib/utils"

import TradePanel from "../components/event/tradePanel/TradePanel"

const RULES_MAX = 200

// ─── EventPage ────────────────────────────────────────────────────────────────

const EventPage = () => {
  const navigate = useNavigate()
  //replae this with an API call
  const list = [...MOCK_MARKETS]
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const market = useAppSelector((state) => state.markets.selectedMarket)
  const userLoading = useSelector(selectUserLoading)

  const [chartTab, setChartTab] = useState("ALL")
  const [rulesOpen, setRulesOpen] = useState(false)
  //  console.log("id:", id)

  useEffect(() => {
    if (!id) return

    // if selectedMarket is already correct, skip
    if (market?.id === id) return

    const foundMarket = list.find((m) => m.id === id)
    if (foundMarket) {
      dispatch(setSelectedMarket(foundMarket))
    }
  }, [id, list])

  // ── Guard ──
  if (!market) {
    return (
      <div className="ep">
        <div className="ep-not-found">Market not found.</div>
      </div>
    )
  }

  // ── Binary-only data ──
  const isBinary = market.type === MARKET_TYPES.BINARY
  const bm = isBinary ? (market as BinaryMarket) : null
  const yesP = bm?.yesProbability ?? 50
  const noP = bm?.noProbability ?? 50

  // ── Order book depth ──
  const maxShares = market.orderBook
    ? Math.max(
        ...market.orderBook.yes.map((r) => r.shares),
        ...market.orderBook.no.map((r) => r.shares),
        1,
      )
    : 1

  // ── Rules preview ──
  const rules = market.rules ?? ""
  const rulesPreview =
    rules.length > RULES_MAX && !rulesOpen ? rules.slice(0, RULES_MAX) + "…" : rules

  return (
    <>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30  md:mx-20">
        <Toaster richColors position="top-center" />
        {userLoading && <AuthLoader />}
        <Navbar />
        <CategoryTabs />

        <div className="ep">
          {/* ── Back button ── */}
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

                {/* Stats chips */}
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

                {/* Legend */}
                <div className="ep-chart-legend">
                  <div className="ep-legend-item">
                    <div className="ep-legend-dot yes" /> YES
                  </div>
                  <div className="ep-legend-item">
                    <div className="ep-legend-dot no" /> NO
                  </div>
                </div>

                {/* Chart or empty */}
                {!market.priceHistory || market.priceHistory.length === 0 ? (
                  <div className="ep-chart-empty">No price history yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={market.priceHistory}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="ep-yes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ep-no" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fontSize: 10, fill: "#5a6478", fontFamily: "'DM Mono',monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}¢`}
                        tick={{ fontSize: 10, fill: "#5a6478", fontFamily: "'DM Mono',monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="yesPrice"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#ep-yes)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#22c55e", stroke: "#0d0f12", strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey={(d) => 1 - d.yesPrice}
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#ep-no)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#ef4444", stroke: "#0d0f12", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
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
                    {/* YES side */}
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
                    {/* NO side */}
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
                <TradePanel yesProbability={yesP} noProbability={noP} isCrypto={!isBinary} />
              </div>
            </div>
            {/* ══════════════ END RIGHT ══════════════ */}
          </div>
        </div>
      </div>
    </>
  )
}

export default EventPage
