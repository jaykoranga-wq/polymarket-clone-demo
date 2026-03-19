import "./eventPage.css"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useParams } from "react-router"
import { toast, Toaster } from "sonner"

import { LoginModal } from "@/components/auth/LoginModal"
import { IcoBookmarkSm, IcoClockSm, IcoShareSm, IcoVolSm } from "@/components/custom/EventPageIcons"
import TradePanel from "@/components/event/tradePanel/TradePanel"
import { CommentSection } from "@/components/market/comment/CommentSection"
import { PriceChart } from "@/components/market/priceChart/PriceChart"
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

  const { executeTrade, tradeError, approvalState } = useTrade()

  // ── Primary data source: real API ──────────────────────────────────────────
  const { data: apiMarket, isLoading, isError } = useGetMarketByIdQuery(id ?? "")

  // ── Fallback: Redux selectedMarket set when card was clicked ───────────────
  // This allows mock markets (IDs unknown to the API) to still render correctly.
  const reduxMarket = useSelector(selectSelectedMarket)

  // Prefer API result; fall back to Redux only when API errors/404s
  const market = apiMarket ?? (isError ? reduxMarket : null)

  // ── Chart state ────────────────────────────────────────────────────────────
  const yesProbability = (market?.yesProbability ?? 50) / 100
  const { tab, history, changeTab, lastPrice, pctChange, isPositive } = usePriceChart({
    marketId: id ?? "",
    startPrice: yesProbability,
  })

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

  if (isLoading) return <EventPageSkeleton />
  if (!market)
    return (
      <div className="ep">
        <div className="ep-not-found">Market not found.</div>
      </div>
    )

  const totalVolume = (market.yesVolume ?? 0) + (market.noVolume ?? 0)

  return (
    <>
      <div className="ep md:px-20 px-4 md:mx-20">
        <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <Toaster richColors position="top-center" />

        {/* ── Breadcrumb ── */}
        <div className="ep-breadcrumb">
          <span>{market.category}</span>
          <span className="ep-breadcrumb-sep">›</span>
          <span className="ep-breadcrumb-curr">
            {market.title.length > 50 ? market.title.slice(0, 50) + "…" : market.title}
          </span>
        </div>

        {/* ── Title + icons ── */}
        <div className="ep-title-row">
          <h1 className="ep-page-title">{market.title}</h1>
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
        <div className="ep-stats">
          <div className="ep-chip">
            <IcoClockSm />
            Ends <strong>{formatMarketDate(market.resolutionTime)}</strong>
          </div>
          <div className="ep-chip">
            <IcoVolSm />
            <strong>${totalVolume.toLocaleString()}</strong> Vol
          </div>
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
              {activeTab === "orderbook" && <OrderBookTab marketId={market.id} />}
              {activeTab === "comments" && <CommentSection marketId={market.id} />}
            </div>
          </div>
          {/* ══ END LEFT ══ */}

          {/* ══ RIGHT ══ */}
          <div className="ep-right">
            <div className="ep-sticky">
              <TradePanel
                yesProbability={market.yesProbability ?? 50}
                noProbability={market.noProbability ?? 50}
                isCrypto={false}
                onLoginRequired={() => setIsLoginOpen(true)}
                onDepositRequired={() => magic?.wallet?.showUI()}
                onTrade={handleTrade}
                approvalState={approvalState}
              />
            </div>
          </div>
          {/* ══ END RIGHT ══ */}
        </div>
      </div>
    </>
  )
}

export default EventPage
