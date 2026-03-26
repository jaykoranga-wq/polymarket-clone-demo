import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { TrendingUp } from "lucide-react"
import { Flame, Gift, RefreshCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router"
import { Toaster } from "sonner"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { LoginModal } from "@/components/auth/LoginModal"
import { IcoAI } from "@/components/custom/IcoAI"
import { IcoBack } from "@/components/custom/IcoBack"
import { IcoBookmark } from "@/components/custom/IcoBookmark"
import { IcoClock } from "@/components/custom/IcoClock"
import { IcoVol } from "@/components/custom/IcoVol"
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
import { MOCK_COMMENTS } from "@/mocks/mockComments"
import { MOCK_MARKETS } from "@/mocks/mockData"

const RULES_MAX = 200

// ─── PriceChart — lightweight-charts ─────────────────────────────────────────

interface PriceChartProps {
  priceHistory: PricePoint[]
}

const PriceChart = ({ priceHistory }: PriceChartProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const yesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const noRef = useRef<ISeriesApi<"Area"> | null>(null)

  useEffect(() => {
    if (!containerRef.current || priceHistory.length === 0) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "white",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
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

    const BASE_TIME = 1696118400

    const yesData = priceHistory.map((p, i) => ({
      time: (BASE_TIME + i * 86400) as unknown as string,
      value: p.yesPrice,
    }))

    yesSeries.setData(yesData)
    chart.timeScale().fitContent()

    chart.subscribeCrosshairMove((param) => {
      const tooltip = tooltipRef.current
      const wrapper = wrapperRef.current
      if (!tooltip || !wrapper) return

      if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        tooltip.style.display = "none"
        return
      }

      const seriesData = param.seriesData.get(yesSeries)
      if (!seriesData || !("value" in seriesData)) {
        tooltip.style.display = "none"
        return
      }

      const price = (seriesData as { value: number }).value
      const time = param.time as number
      const date = new Date(time * 1000)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ]
      const dateStr = `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`

      const labelEl = tooltip.querySelector(".chart-tooltip-label") as HTMLElement
      const priceEl = tooltip.querySelector(".chart-tooltip-price") as HTMLElement
      const dateEl = tooltip.querySelector(".chart-tooltip-date") as HTMLElement
      if (labelEl) labelEl.textContent = "CURRENT PRICE"
      if (priceEl) priceEl.textContent = `$${price.toFixed(2)}`
      if (dateEl) dateEl.textContent = dateStr

      tooltip.style.display = "block"

      const tooltipWidth = 140
      const tooltipHeight = 70
      const gap = 14

      let left = param.point.x - tooltipWidth / 2
      let top = param.point.y - tooltipHeight - gap

      const containerWidth = containerRef.current?.clientWidth ?? 0
      if (left < 0) left = 0
      if (left + tooltipWidth > containerWidth) left = containerWidth - tooltipWidth
      if (top < 0) top = param.point.y + gap

      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
    })

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      yesRef.current = null
      noRef.current = null
    }
  }, [priceHistory])

  return (
    /* chart-wrapper: position relative */
    <div ref={wrapperRef} className="relative">
      <div ref={containerRef} style={{ width: "100%", minHeight: 220 }} />
      {/* chart-tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-10 pointer-events-none hidden flex-col items-center gap-0.5 px-4 py-2.5 rounded-[10px] min-w-[130px]"
        style={{
          background: "rgba(13,15,18,0.92)",
          border: "1px solid rgba(34,197,94,0.35)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          transition: "opacity 0.12s ease",
        }}
      >
        {/* chart-tooltip-label */}
        <div className="chart-tooltip-label text-[9px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          CURRENT PRICE
        </div>
        {/* chart-tooltip-price */}
        <div
          className="chart-tooltip-price text-[22px] font-semibold leading-[1.2] text-white"
          style={{ fontFamily: "var(--font)" }}
        >
          $0.00
        </div>
        {/* chart-tooltip-date */}
        <div
          className="chart-tooltip-date text-[10px] text-white/45"
          style={{ fontFamily: "var(--mono)" }}
        />
      </div>
    </div>
  )
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
  const [activeTab, setActiveTab] = useState("Market Rules")
  const [isMobileTradeOpen, setIsMobileTradeOpen] = useState(false)
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
    if (!id) return
    if (market?.id === id) return
    const foundMarket = list.find((m) => m.id === id)
    if (foundMarket) dispatch(setSelectedMarket(foundMarket))
  }, [dispatch, id, list, market?.id])

  if (!market) {
    return (
      /* ep + ep-not-found */
      <div
        className="flex items-center justify-center h-[60vh] text-[#5a6478] text-[13px] tracking-[0.06em]"
        style={{ fontFamily: "var(--mono)" }}
      >
        Market not found.
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
      {tradeError && <p className="text-red-500">{tradeError}</p>}

      {/*
        Root wrapper:
          min-h-screen bg-background text-white selection:bg-primary/30 md:mx-20 overflow-x-hidden
          + ep variables via inline style
      */}
      <div
        className="min-h-screen bg-background text-white selection:bg-primary/30 md:mx-20 overflow-x-hidden"
        style={{
          // CSS variable definitions from .ep
          ["--bg" as string]: "#0d0f12",
          ["--s1" as string]: "#13161d",
          ["--s2" as string]: "#191c22",
          ["--s3" as string]: "#21262f",
          ["--border" as string]: "rgba(255,255,255,0.07)",
          ["--border2" as string]: "#2A2A2A",
          ["--text" as string]: "#e2e8f0",
          ["--muted" as string]: "#5a6478",
          ["--dim" as string]: "#2a3040",
          ["--yes" as string]: "#22c55e",
          ["--yes-dim" as string]: "rgba(34,197,94,0.1)",
          ["--no" as string]: "#ef4444",
          ["--no-dim" as string]: "rgba(239,68,68,0.1)",
          ["--blue" as string]: "#3b82f6",
          ["--amber" as string]: "#f59e0b",
          color: "#e2e8f0",
          fontFamily: "var(--font)",
        }}
      >
        <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <Toaster richColors position="top-center" />
        {userLoading && <AuthLoader />}

        {/* ep container */}
        <div className="container">
          {/* ep-back */}
          <button
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs text-[#5a6478] bg-transparent border-none cursor-pointer tracking-[0.04em] transition-colors duration-150 hover:text-[#e2e8f0] [&_svg]:w-3.5 [&_svg]:h-3.5"
            style={{ fontFamily: "var(--mono)" }}
            onClick={() => navigate(-1)}
          >
            <IcoBack /> Back to markets
          </button>

          {/* breadcrumb */}
          <div className="flex items-center space-x-2 text-sm pl-6 mt-2">
            <span className="text-gray-400">Trending</span>
            <span className="text-gray-500">{">"}</span>
            <span className="text-white font-medium">Trump</span>
          </div>

          {/*
            ep-header:
              padding: 4px 24px 30px
              flex justify-between gap-5 items-end
              on mobile: flex-col, items-start, px-6 py-2.5, gap-4
          */}
          <div className="flex justify-between gap-5 items-end px-6 pt-1 pb-[30px] max-lg:flex-col max-lg:items-start max-lg:py-2.5 max-lg:gap-4">
            {/* ep-header-top */}
            <div className="flex flex-col items-start gap-3.5">
              {/* ep-title-wrap */}
              <div className="flex-1 min-w-0">
                {/* ep-title: font-size 36px, font-weight 900, line-height 1.25, color #fff, margin 0 */}
                {/* mobile: font-size 28px */}
                <h1 className="text-[36px] max-lg:text-[28px] font-black leading-[1.25] text-white m-0">
                  {market.title}
                </h1>
              </div>

              {/* ep-stats: flex, items-center, gap-4, flex-wrap */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* ep-chip: flex items-center gap-1.5, text-sm, text-white, whitespace-nowrap */}
                {/* [&_svg]: w-3.5 h-3.5, color white, stroke-width 2.5 */}
                <div className="flex items-center gap-[5px] text-sm text-white whitespace-nowrap [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-white [&_svg]:[stroke-width:2.5px]">
                  <IcoClock />
                  Ends <strong className="text-white font-bold">{market.expiryDate}</strong>
                </div>
                <div className="flex items-center gap-[5px] text-sm text-white whitespace-nowrap [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-white [&_svg]:[stroke-width:2.5px]">
                  <IcoVol />
                  <strong className="text-white font-bold">{market.volume}</strong> Vol
                </div>
                <div className="flex items-center gap-[5px] text-sm text-white whitespace-nowrap [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-white [&_svg]:[stroke-width:2.5px]">
                  <RefreshCcw />
                  {market.frequency}
                </div>
                {market.isTrending && (
                  <div className="flex items-center gap-[5px] text-sm text-white whitespace-nowrap [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-white [&_svg]:[stroke-width:2.5px]">
                    <Flame /> Trending
                  </div>
                )}
              </div>
            </div>

            {/* ep-header-icons: flex, gap-3, pt-0.5, flex-shrink-0 */}
            <div className="flex gap-3 pt-0.5 flex-shrink-0">
              {/* ep-icon-btn: w-9 h-9 rounded-[6px] bg-[var(--s2)]/20 border border-[#2A2A2A]
                  text-[#CBD5E1] flex items-center justify-center cursor-pointer
                  transition-all duration-150 hover:text-[#e2e8f0] hover:bg-[var(--s3)]
                  [&_svg]:w-5 [&_svg]:h-5 */}
              <button
                className="w-9 h-9 rounded-[6px] border border-[#2A2A2A] text-[#CBD5E1] flex items-center justify-center cursor-pointer transition-all duration-150 hover:text-[#e2e8f0] hover:bg-[#21262f] [&_svg]:w-5 [&_svg]:h-5"
                style={{ background: "rgba(25,28,34,0.2)" }}
              >
                <IcoAI size={14} />
              </button>
              <button
                className="w-9 h-9 rounded-[6px] border border-[#2A2A2A] text-[#CBD5E1] flex items-center justify-center cursor-pointer transition-all duration-150 hover:text-[#e2e8f0] hover:bg-[#21262f] [&_svg]:w-5 [&_svg]:h-5"
                style={{ background: "rgba(25,28,34,0.2)" }}
              >
                <Gift size={14} />
              </button>
              <button
                className="w-9 h-9 rounded-[6px] border border-[#2A2A2A] text-[#CBD5E1] flex items-center justify-center cursor-pointer transition-all duration-150 hover:text-[#e2e8f0] hover:bg-[#21262f] [&_svg]:w-5 [&_svg]:h-5"
                style={{ background: "rgba(25,28,34,0.2)" }}
              >
                <IcoBookmark />
              </button>
            </div>
          </div>

          {/*
            ep-mobile-trade-toggle-btn:
              flex items-center justify-center px-4 py-2
              bg-primary text-black border-none rounded-lg
              font-bold text-sm mx-6 mb-4 w-fit cursor-pointer
              shadow-[0_4px_12px_rgba(34,197,94,0.2)]
              lg:hidden
          */}
          <button
            className="flex items-center justify-center px-4 py-2 bg-primary text-black border-none rounded-lg font-bold text-sm mx-6 mb-4 w-fit cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.2)] lg:hidden"
            onClick={() => setIsMobileTradeOpen(true)}
          >
            <TrendingUp size={16} className="mr-2" />
            Trade
          </button>

          {/*
            ep-layout:
              grid, 1fr 340px, gap-6, items-start
              max-[1479px]: grid-cols-[1fr_300px] gap-4
              max-lg: grid-cols-1 (ep-right hidden)
          */}
          <div
            className="grid items-start gap-6 max-[1479px]:gap-4"
            style={{
              gridTemplateColumns: "1fr 340px",
            }}
          >
            {/* Override grid for smaller screens via a style tag workaround using CSS custom prop */}
            <style>{`
              @media (max-width: 1479px) {
                .ep-layout-inner { grid-template-columns: 1fr 300px !important; gap: 16px !important; }
              }
              @media (max-width: 1023px) {
                .ep-layout-inner { grid-template-columns: 1fr !important; }
                .ep-right-col { display: none !important; }
              }
            `}</style>

            {/* ══════════════ LEFT COLUMN ══════════════ */}
            {/* ep-left: min-w-0 */}
            <div className="min-w-0">
              {/* Price Chart section: pl-6 pb-[30px] */}
              <div className="pl-6 pb-[30px]">
                {/* border border-white/10 rounded-xl p-6 pt-0 bg-gradient-to-b from-white/5 to-white/[0.02] */}
                <div className="border border-white/10 rounded-xl p-6 pt-0 bg-gradient-to-b from-white/5 to-white/[0.02]">
                  {/* flex items-center justify-between gap-0.5 pt-6 pb-2 */}
                  <div className="flex items-center justify-between gap-0.5 pt-6 pb-2">
                    <div className="flex flex-col">
                      {/* text-muted-foreground font-sm */}
                      <span className="text-muted-foreground text-sm">Price History</span>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          {/* text-white font-2xl font-black */}
                          <div className="text-white text-2xl font-black">$0.68</div>
                          {/* text-primary flex items-center */}
                          <div className="text-primary flex items-center">
                            <TrendingUp />
                            +12.4%(24h)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/*
                      ep-chart-tabs:
                        flex gap-2 p-1 bg-white/[0.02] border border-white/[0.06]
                        rounded-[10px] m-0
                    */}
                    <div
                      className="flex gap-2 p-1 rounded-[10px] m-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {["1D", "1W", "1M", "ALL"].map((t) => (
                        /*
                          ep-chart-tab: px-[11px] py-[5px] rounded-lg text-sm font-medium
                          font-mono bg-none border-none text-white/60 cursor-pointer
                          transition-all duration-[120ms] hover:text-[#e2e8f0]
                          active: bg-[#10D260] shadow-[0px_4px_6px_-4px_rgba(16,210,96,0.3),0px_10px_15px_-3px_rgba(16,210,96,0.3)] text-black
                        */
                        <button
                          key={t}
                          className={`px-[11px] py-[5px] rounded-lg text-sm font-medium border-none cursor-pointer transition-all duration-[120ms] hover:text-[#e2e8f0] ${
                            chartTab === t
                              ? "bg-[#10D260] text-black shadow-[0px_4px_6px_-4px_rgba(16,210,96,0.3),0px_10px_15px_-3px_rgba(16,210,96,0.3)]"
                              : "bg-transparent text-white/60"
                          }`}
                          style={{ fontFamily: "var(--mono)" }}
                          onClick={() => setChartTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ep-chart-legend: flex gap-3.5 mb-3 */}
                  <div className="flex gap-3.5 mb-3">
                    {/* ep-legend-item: flex items-center gap-[5px] text-[11px] text-white font-mono */}
                    <div
                      className="flex items-center gap-[5px] text-[11px] text-white"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      {/* ep-legend-dot yes: w-[7px] h-[7px] rounded-full bg-[#22c55e] */}
                      <div className="w-[7px] h-[7px] rounded-full bg-[#22c55e]" /> YES
                    </div>
                    <div
                      className="flex items-center gap-[5px] text-[11px] text-white"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      {/* ep-legend-dot no: bg-[#ef4444] */}
                      <div className="w-[7px] h-[7px] rounded-full bg-[#ef4444]" /> NO
                    </div>
                  </div>

                  {!market.priceHistory || market.priceHistory.length === 0 ? (
                    /*
                      ep-chart-empty: flex items-center justify-center h-[200px]
                      text-[#5a6478] font-mono text-xs tracking-[0.06em]
                    */
                    <div
                      className="flex items-center justify-center h-[200px] text-[#5a6478] text-xs tracking-[0.06em]"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      No price history yet
                    </div>
                  ) : (
                    <PriceChart priceHistory={market.priceHistory} />
                  )}
                </div>
              </div>

              {/*
                ep-main-tabs:
                  flex gap-6 px-6 border-b border-[#10D26010] mb-2
                  mobile: gap-4 px-4 overflow-x-auto scrollbar-none whitespace-nowrap
              */}
              <div className="flex gap-6 px-6 border-b border-[#10D26010] mb-2 max-lg:gap-4 max-lg:px-4 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[-ms-overflow-style:none] max-lg:[&::-webkit-scrollbar]:hidden">
                {["Market Rules", "Order Book", `Comments (${MOCK_COMMENTS.length})`].map(
                  (tabLabel) => {
                    const tabValue = tabLabel.startsWith("Comments") ? "Comments" : tabLabel
                    return (
                      /*
                      ep-main-tab: py-3 px-0.5 text-sm font-medium text-[#5a6478]
                      bg-none border-none cursor-pointer transition-all duration-200
                      relative hover:text-[#e2e8f0]
                      active: text-[#10D260]
                      active::after: absolute bottom-[-1px] left-0 right-0 h-[2px]
                        bg-[#10D260] shadow-[0_0_10px_rgba(16,210,96,0.4)]
                      mobile: whitespace-nowrap py-2.5 px-1
                    */
                      <button
                        key={tabValue}
                        className={`py-3 px-0.5 text-sm font-medium bg-transparent border-none cursor-pointer transition-all duration-200 relative hover:text-[#e2e8f0] max-lg:whitespace-nowrap max-lg:py-2.5 max-lg:px-1 ${
                          activeTab === tabValue
                            ? "text-[#10D260] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-[#10D260] after:shadow-[0_0_10px_rgba(16,210,96,0.4)] after:content-['']"
                            : "text-[#5a6478]"
                        }`}
                        onClick={() => setActiveTab(tabValue)}
                      >
                        {tabLabel}
                      </button>
                    )
                  },
                )}
              </div>

              {/* ── Order Book ── */}
              {activeTab === "Order Book" && (
                /* ep-section: px-6 pb-6 pt-2 / mobile px-4 pb-4 pt-2 */
                <div className="px-6 pb-6 pt-2 max-lg:px-4 max-lg:pb-4">
                  {/* ep-section-header: flex items-center pb-[14px] */}
                  <div className="flex items-center pb-[14px]">
                    <span className="font-normal text-base text-white">PRICE · SHARES</span>
                  </div>

                  {!market.orderBook ? (
                    /* ep-ob-empty: flex items-center justify-center h-20 text-[#5a6478] font-mono text-xs */
                    <div
                      className="flex items-center justify-center h-20 text-[#5a6478] text-xs"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      No orders yet
                    </div>
                  ) : (
                    /* ep-ob-grid: grid grid-cols-2 gap-3 */
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        {/* ep-ob-col-label yes: font-mono text-[10px] font-semibold tracking-[0.1em] uppercase mb-2.5 px-1 text-[#22c55e] */}
                        <div
                          className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2.5 px-1 text-[#22c55e]"
                          style={{ fontFamily: "var(--mono)" }}
                        >
                          ▲ YES
                        </div>
                        {/* ep-ob-col-head: grid grid-cols-2 text-sm text-muted-foreground px-1.5 pb-1 */}
                        <div className="grid grid-cols-2 text-sm text-muted-foreground px-1.5 pb-1">
                          <span>Price</span>
                          <span className="text-right">Shares</span>
                        </div>
                        {market.orderBook.yes.map((row, i) => (
                          /*
                            ep-ob-row yes:
                              relative grid grid-cols-2 font-mono text-xs px-1.5 py-1
                              rounded-[5px] overflow-hidden mb-0.5
                          */
                          <div
                            key={i}
                            className="relative grid grid-cols-2 text-xs px-1.5 py-1 rounded-[5px] overflow-hidden mb-0.5"
                            style={{ fontFamily: "var(--mono)" }}
                          >
                            {/* ep-ob-depth yes: absolute top-0 left-0 bottom-0 rounded-[5px] pointer-events-none bg-[var(--color-option-yes)] */}
                            <div
                              className="absolute top-0 left-0 bottom-0 rounded-[5px] pointer-events-none"
                              style={{
                                width: `${(row.shares / maxShares) * 100}%`,
                                background: "var(--color-option-yes)",
                              }}
                            />
                            {/* ep-ob-price yes: relative font-medium text-[#22c55e] */}
                            <span className="relative font-medium text-[#22c55e]">
                              {(row.price * 100).toFixed(0)}¢
                            </span>
                            {/* ep-ob-shares: relative text-right text-white */}
                            <span className="relative text-right text-white">
                              {row.shares.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        {/* ep-ob-col-label no: text-[#ef4444] */}
                        <div
                          className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-2.5 px-1 text-[#ef4444]"
                          style={{ fontFamily: "var(--mono)" }}
                        >
                          ▼ NO
                        </div>
                        <div className="grid grid-cols-2 text-sm text-muted-foreground px-1.5 pb-1">
                          <span>Price</span>
                          <span className="text-right">Shares</span>
                        </div>
                        {market.orderBook.no.map((row, i) => (
                          <div
                            key={i}
                            className="relative grid grid-cols-2 text-xs px-1.5 py-1 rounded-[5px] overflow-hidden mb-0.5"
                            style={{ fontFamily: "var(--mono)" }}
                          >
                            <div
                              className="absolute top-0 left-0 bottom-0 rounded-[5px] pointer-events-none"
                              style={{
                                width: `${(row.shares / maxShares) * 100}%`,
                                background: "var(--color-option-no)",
                              }}
                            />
                            {/* ep-ob-price no: text-[#ef4444] */}
                            <span className="relative font-medium text-[#ef4444]">
                              {(row.price * 100).toFixed(0)}¢
                            </span>
                            <span className="relative text-right text-white">
                              {row.shares.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Rules & About ── */}
              {activeTab === "Market Rules" && (
                <div className="px-6 pb-6 pt-2 max-lg:px-4 max-lg:pb-4">
                  {rules ? (
                    <>
                      {/*
                        text-rule font-sm → text-white text-sm leading-[1.75]
                        pl-3.5 mb-1.5
                        (maps to .ep-rules-text)
                      */}
                      <p className="text-sm text-white leading-[1.75] pl-3.5 mb-1.5">
                        {rulesPreview}
                      </p>
                      {rules.length > RULES_MAX && (
                        /*
                          text-primary font-base mb-[34px]
                          (maps to .ep-rules-toggle style but using primary color and the mb-8.5 ≈ 34px)
                        */
                        <button
                          className="bg-transparent border-none cursor-pointer text-sm text-primary p-0 mb-[34px] block transition-opacity duration-150 hover:opacity-70"
                          style={{ fontFamily: "var(--mono)" }}
                          onClick={() => setRulesOpen((p) => !p)}
                        >
                          {rulesOpen ? "▲ Show less" : "▼ Show more"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-[13px] text-white leading-[1.75] pl-3.5 mb-1.5">
                      No resolution rules provided.
                    </p>
                  )}

                  {/* ep-meta-grid: grid grid-cols-2 gap-2 */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* ep-meta-item: rounded-[9px] px-[13px] py-[11px] border border-white/[0.07] bg-white/5 */}
                    <div className="rounded-[9px] px-[13px] py-[11px] border border-white/[0.07] bg-white/5">
                      {/* ep-meta-label: font-mono text-[10px] uppercase tracking-[0.1em] text-[#5a6478] mb-1 */}
                      <div
                        className="text-[10px] uppercase tracking-[0.1em] text-[#5a6478] mb-1"
                        style={{ fontFamily: "var(--mono)" }}
                      >
                        Volume
                      </div>
                      {/* ep-meta-value: text-[13px] font-medium text-[#e2e8f0] */}
                      <div className="text-[13px] font-medium text-[#e2e8f0]">{market.volume}</div>
                    </div>

                    <div className="rounded-[9px] px-[13px] py-[11px] border border-white/[0.07] bg-white/5">
                      <div
                        className="text-[10px] uppercase tracking-[0.1em] text-[#5a6478] mb-1"
                        style={{ fontFamily: "var(--mono)" }}
                      >
                        End Date
                      </div>
                      <div className="text-[13px] font-medium text-[#e2e8f0]">
                        {market.expiryDate}
                      </div>
                    </div>

                    {market.createdAt && (
                      <div className="rounded-[9px] px-[13px] py-[11px] border border-white/[0.07] bg-white/5">
                        <div
                          className="text-[10px] uppercase tracking-[0.1em] text-[#5a6478] mb-1"
                          style={{ fontFamily: "var(--mono)" }}
                        >
                          Created At
                        </div>
                        <div className="text-[13px] font-medium text-[#e2e8f0]">
                          {market.createdAt}
                        </div>
                      </div>
                    )}

                    {market.resolver && (
                      <div className="rounded-[9px] px-[13px] py-[11px] border border-white/[0.07] bg-white/5">
                        <div
                          className="text-[10px] uppercase tracking-[0.1em] text-[#5a6478] mb-1"
                          style={{ fontFamily: "var(--mono)" }}
                        >
                          Resolver
                        </div>
                        {/* ep-meta-value mono: font-mono text-[11px] text-[#3b82f6] break-all */}
                        <div
                          className="text-[11px] text-[#3b82f6] break-all"
                          style={{ fontFamily: "var(--mono)" }}
                        >
                          {shorten(market.resolver)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Comments ── */}
              {activeTab === "Comments" && <CommentSection marketId={market.id} />}
            </div>
            {/* ══════════════ END LEFT ══════════════ */}

            {/* ══════════════ RIGHT COLUMN ══════════════ */}
            {/*
              ep-right: min-w-0 mt-0
              hidden on max-lg (ep-right-col class used for media query override)
            */}
            <div className="ep-right-col min-w-0 mt-0 max-lg:hidden">
              {/* ep-sticky: sticky top-5 */}
              <div className="sticky top-5">
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

          {/* ── Mobile Trade Drawer ── */}
          {isMobileTradeOpen && (
            <>
              {/*
                ep-mobile-trade-overlay:
                  fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]
                  animate-[fadeIn_0.2s_ease-out]
              */}
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
                style={{ animation: "fadeIn 0.2s ease-out" }}
                onClick={() => setIsMobileTradeOpen(false)}
              />
              {/*
                ep-mobile-trade-drawer:
                  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  bg-[#11141b] border-t border-white/10 rounded-[20px] z-[201]
                  max-h-[90vh] max-w-[60vw] overflow-y-auto
                  animate-[slideUp_0.3s_ease-out]
              */}
              <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#11141b] border-t border-white/10 rounded-[20px] z-[201] max-h-[90vh] max-w-[60vw] overflow-y-auto"
                style={{ animation: "slideUp 0.3s ease-out" }}
              >
                {/* ep-drawer-header: flex justify-between items-center px-6 pt-5 pb-2.5 */}
                <div className="flex justify-between items-center px-6 pt-5 pb-2.5">
                  {/* ep-drawer-title: font-bold text-lg */}
                  <span className="font-bold text-lg">Place Bet</span>
                  {/*
                    ep-drawer-close:
                      bg-white/5 border-none text-[#888] w-8 h-8 rounded-full
                      flex items-center justify-center text-sm cursor-pointer
                  */}
                  <button
                    className="bg-white/5 border-none text-[#888] w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
                    onClick={() => setIsMobileTradeOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                {/* ep-drawer-body: px-2.5 pb-[30px] */}
                <div className="px-2.5 pb-[30px]">
                  <TradePanel
                    yesProbability={yesP}
                    noProbability={noP}
                    isCrypto={!isBinary}
                    onLoginRequired={() => setIsLoginOpen(true)}
                    onDepositRequired={() => magic?.wallet?.showUI()}
                    onTrade={(order) => {
                      handleTrade(order)
                      setIsMobileTradeOpen(false)
                    }}
                  />
                </div>
              </div>

              {/* Keyframe animations needed for drawer — injected via style tag */}
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translate(-50%, 100%); }
                  to { transform: translate(-50%, -50%); }
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default EventPage
