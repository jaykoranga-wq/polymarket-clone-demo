import "./eventPage.css"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"
import { toast, Toaster } from "sonner"

import { LoginModal } from "@/components/auth/LoginModal"
import { IcoBookmarkSm, IcoClockSm, IcoShareSm, IcoVolSm } from "@/components/custom/EventPageIcons"
import TradePanel from "@/components/event/tradePanel/TradePanel"
import { CommentSection } from "@/components/market/comment/CommentSection"
import { MarketResolvedCard } from "@/components/market/MarketResolvedCard"
import { PriceChart } from "@/components/market/priceChart/PriceChart"
import { ShareModal } from "@/components/market/ShareModal"
import { ActivityTab, MarketRulesTab, OrderBookTab } from "@/components/market/tabs"
import { EventPageSkeleton } from "@/components/ui/MarketSkeleton"
import { useGetMarketByIdQuery } from "@/features/api/markets/marketApi"
import { useMagic } from "@/features/auth/lib/magic"
import { selectSelectedMarket } from "@/features/markets/marketSelectors"
import { usePriceChart } from "@/hooks/charts/usePriceChart"
import type { TradeOrder, TradePanelOrder } from "@/hooks/trade/TradeTypes"
import { useTrade } from "@/hooks/trade/useTrade"
import { formatMarketDate } from "@/libs/formatDate"

type TabKey = "rules" | "activity" | "orderbook" | "comments"

const TABS: { key: TabKey; label: string }[] = [
  { key: "rules", label: "Market Rules" },
  { key: "activity", label: "Activity" },
  { key: "orderbook", label: "Order Book" },
  { key: "comments", label: "Comments" },
]

// ─── EventPage ────────────────────────────────────────────────────────────────
const EventPage = () => {
  const { id } = useParams()
  const { magic } = useMagic()

  const [activeTab, setActiveTab] = useState<TabKey>("rules")
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isMobileTradeOpen, setIsMobileTradeOpen] = useState(false)

  const { executeTrade, tradeError, approvalState } = useTrade()

  // ── Primary data source: real API ──────────────────────────────────────────
  const { data: apiMarket, isLoading, isError } = useGetMarketByIdQuery(id ?? "")

  // ── Fallback: Redux selectedMarket set when card was clicked ───────────────
  const reduxMarket = useSelector(selectSelectedMarket)
  const market = apiMarket ?? (isError ? reduxMarket : null)

  // ── Chart state ────────────────────────────────────────────────────────────
  const yesProbability = (market?.yesProbability ?? 50) / 100
  const { tab, history, changeTab, lastPrice, pctChange, isPositive } = usePriceChart({
    marketId: id ?? "",
    startPrice: yesProbability,
  })

  // ── Resolution check ───────────────────────────────────────────────────────
  const isResolved = market?.resolutionTime
    ? new Date(market.resolutionTime).getTime() <= new Date().getTime()
    : false

  // ── Trade handler ──────────────────────────────────────────────────────────
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
      yesTokenOnChainId: market.yesTokenOnChainId ?? null,
      noTokenOnChainId: market.noTokenOnChainId ?? null,
    } satisfies TradeOrder)
  }

  const saveAsBookmark = () => toast.success("Saved")

  useEffect(() => {
    if (tradeError) {
      if (tradeError.includes('reason="rejected"')) {
        toast.error("User Rejected the request", {
          duration: 3000,
          position: "top-right",
          style: { fontSize: "12px", padding: "8px 12px", maxWidth: "320px" },
        })
      }
    }
  }, [tradeError])

  // ── Loading / not found ────────────────────────────────────────────────────
  if (isLoading) return <EventPageSkeleton />
  if (!market)
    return (
      <div
        className="flex items-center justify-center h-[60vh] text-[#5a6478] text-[13px] tracking-[0.06em]"
        style={{ fontFamily: "var(--mono)" }}
      >
        Market not found.
      </div>
    )

  const totalVolume = (market.yesVolume ?? 0) + (market.noVolume ?? 0)

  return (
    <>
      <div className="min-h-screen bg-background text-white selection:bg-primary/30 md:mx-20 overflow-x-hidden">
        <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title={market.title}
          probability={market.yesProbability ?? 50}
          outcome="Yes"
        />
        <Toaster richColors position="top-center" />

        {/* ── Breadcrumb ── */}
        <div className="ep-breadcrumb">
          <span>{market.category}</span>
          <span className="ep-breadcrumb-sep">›</span>
          <span className="ep-breadcrumb-curr">
            {market.title.length > 50 ? market.title.slice(0, 50) + "…" : market.title}
          </span>
        </div>

        {/* ── Title + icon buttons ── */}
        <div className="ep-title-row">
          <h1 className="ep-page-title">{market.title}</h1>
          <div className="ep-header-icons">
            <button className="ep-icon-btn sm" onClick={() => setShareOpen(true)}>
              <IcoShareSm />
            </button>
            <button className="ep-icon-btn sm" onClick={saveAsBookmark}>
              <IcoBookmarkSm />
            </button>
          </div>
        </div>

        {/* ── Meta chips — only once ── */}
        <div className="ep-stats">
          <div className="ep-chip">
            <IcoClockSm />
            Ends <strong>{formatMarketDate(market.resolutionTime)}</strong>
          </div>
          <div className="ep-chip">
            <IcoVolSm />
            <strong>${totalVolume.toLocaleString()}</strong> Vol
          </div>
          {isResolved && (
            <div
              className="ep-chip"
              style={{
                color: "#f59e0b",
                borderColor: "rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
              }}
            >
              ✓ Resolved
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className="ep-layout">
          {/* ══ LEFT ══ */}
          <div className="ep-left">
            {/* Chart */}
            <PriceChart
              history={history}
              tab={tab}
              onTabChange={changeTab}
              currentPrice={lastPrice}
              pctChange={pctChange}
              isPositive={isPositive}
            />

            {/* Tab bar */}
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
                <MarketRulesTab
                  description={market.description}
                  volume={totalVolume}
                  resolutionTime={market.resolutionTime}
                  createdAt={market.createdAt}
                />
              )}
              {activeTab === "activity" && <ActivityTab marketId={market.id} />}
              {activeTab === "orderbook" && (
                <OrderBookTab
                  marketId={market.id}
                  yesTokenId={market.yesTokenId as string}
                  noTokenId={market.noTokenId as string}
                />
              )}
              {activeTab === "comments" && <CommentSection marketId={market.id} />}
            </div>
          </div>
          {/* ══ END LEFT ══ */}

          {/* ══ RIGHT ══ */}
          <div className="ep-right">
            <div className="ep-sticky">
              {isResolved ? (
                <MarketResolvedCard
                  winningOutcome="NO"
                  // winningOutcome={market.winningOutcome as "YES" | "NO"}
                  resolutionTime={market.resolutionTime}
                />
              ) : (
                <TradePanel
                  yesProbability={market.yesProbability ?? 50}
                  noProbability={market.noProbability ?? 50}
                  isCrypto={false}
                  onLoginRequired={() => setIsLoginOpen(true)}
                  onDepositRequired={() => magic?.wallet?.showUI()}
                  onTrade={handleTrade}
                  approvalState={approvalState}
                />
              )}
            </div>
          </div>
          {/* ══ END RIGHT ══ */}
        </div>
      </div>

      {/* ── Mobile Trade Drawer ── */}
      {isMobileTradeOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-200"
            style={{ animation: "fadeIn 0.2s ease-out" }}
            onClick={() => setIsMobileTradeOpen(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#11141b] border-t border-white/10 rounded-[20px] z-201 max-h-[90vh] max-w-[60vw] overflow-y-auto"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="flex justify-between items-center px-6 pt-5 pb-2.5">
              <span className="font-bold text-lg">Place Bet</span>
              <button
                className="bg-white/5 border-none text-[#888] w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
                onClick={() => setIsMobileTradeOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="px-2.5 pb-7.5">
              <TradePanel
                yesProbability={market.yesProbability}
                noProbability={market.noProbability}
                isCrypto={false}
                onLoginRequired={() => setIsLoginOpen(true)}
                onDepositRequired={() => magic?.wallet?.showUI()}
                onTrade={(order) => {
                  handleTrade(order)
                  setIsMobileTradeOpen(false)
                }}
              />
            </div>
          </div>

          <style>{`
            @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translate(-50%, 100%) } to { transform: translate(-50%, -50%) } }
          `}</style>
        </>
      )}
    </>
  )
}

export default EventPage
