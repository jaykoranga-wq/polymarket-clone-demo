// src/pages/portfolio/components/tabs/PositionsTab.tsx

import { useState } from "react"

import { useGetOrdersQuery } from "@/features/api/orders/orderApi"
import {
  type ApiOrder,
  ORDER_STATUS_PARAM,
  ORDER_TYPE_PARAM,
} from "@/features/api/orders/orderApiTypes"
import { useRedeem } from "@/hooks/useRedeem"
import { MOCK_POSITIONS, type Position } from "@/mocks/mockPortfolio"

import { PORTFOLIO_COLORS, POSITION_SIDE } from "../../portfolioConstants"
import { Pagination } from "./OrdersAndHistoryTabs"

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

// ── Column layout ─────────────────────────────────────────────────────────────
const COL = "1fr 80px 80px 80px 80px 110px 150px"

// ── Map filled orders → Position (aggregate by market + side) ─────────────────
const aggregateFilledOrders = (orders: ApiOrder[]): Position[] => {
  const map = new Map<string, Position>()

  for (const o of orders) {
    const side = o.type === ORDER_TYPE_PARAM.BUY ? "YES" : "NO"
    const key = `${o.market.id}-${side}`
    const filledShares = Math.max(0, Number(o.shares) - Number(o.remainingShares))
    if (filledShares === 0) continue

    const priceCents = Math.round(Number(o.price) / 10000) // e.g. 500000 → 50¢
    const invested = (filledShares * priceCents) / 100 // USDC

    const existing = map.get(key)
    if (existing) {
      const newShares = existing.shares + filledShares
      existing.avgPrice =
        (existing.avgPrice * existing.shares + priceCents * filledShares) / newShares
      existing.shares = newShares
      existing.invested += invested
      existing.value = existing.invested // use cost basis as value (no live price)
    } else {
      map.set(key, {
        id: key,
        marketId: o.market.id,
        marketTitle: o.market.title,
        category: "",
        side: side as Position["side"],
        shares: filledShares,
        avgPrice: priceCents,
        nowPrice: priceCents, // live price unavailable; show avg as placeholder
        invested,
        value: invested,
        // blockchain fields — not available from orders API
        conditionId: "",
        yesTokenId: "",
        noTokenId: "",
        collateralToken: "",
        isResolved: false,
        winningOutcome: null,
        isRedeemed: false,
      })
    }
  }

  return Array.from(map.values())
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const canRedeem = (pos: Position): boolean =>
  pos.isResolved && pos.winningOutcome === pos.side && !pos.isRedeemed

const isLost = (pos: Position): boolean =>
  pos.isResolved && pos.winningOutcome !== null && pos.winningOutcome !== pos.side

// ── Sub-components ────────────────────────────────────────────────────────────
const ColHeader = ({ children, align = "left" }: { children: React.ReactNode; align?: string }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: PORTFOLIO_COLORS.TEXT_MUTED_2,
      textAlign: align as React.CSSProperties["textAlign"],
    }}
  >
    {children}
  </div>
)

const CategoryTag = ({ label, highlight }: { label: string; highlight?: boolean }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: highlight ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
      color: highlight ? "#f87171" : PORTFOLIO_COLORS.TEXT_MUTED,
      border: highlight ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)",
    }}
  >
    {label}
  </span>
)

const SidePill = ({ side }: { side: string }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      padding: "4px 10px",
      borderRadius: 20,
      background: side === POSITION_SIDE.YES ? "rgba(0,200,83,0.15)" : "rgba(229,57,53,0.15)",
      color: side === POSITION_SIDE.YES ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
      letterSpacing: "0.02em",
    }}
  >
    {side}
  </span>
)

// ── Redeem button variants ────────────────────────────────────────────────────
const RedeemButton = ({
  position,
  onRedeem,
  isLoading,
}: {
  position: Position
  onRedeem: (p: Position) => void
  isLoading: boolean
}) => {
  if (position.isRedeemed) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "5px 10px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          color: PORTFOLIO_COLORS.TEXT_MUTED_2,
        }}
      >
        ✓ Redeemed
      </span>
    )
  }

  if (isLost(position)) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: PORTFOLIO_COLORS.TEXT_MUTED_2,
          fontStyle: "italic",
        }}
      >
        No winnings
      </span>
    )
  }

  if (canRedeem(position)) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRedeem(position)
        }}
        disabled={isLoading}
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          background: isLoading ? "rgba(0,200,83,0.1)" : PORTFOLIO_COLORS.GREEN,
          color: isLoading ? PORTFOLIO_COLORS.GREEN : "#000",
          border: isLoading ? `1px solid rgba(0,200,83,0.3)` : "none",
          cursor: isLoading ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) e.currentTarget.style.opacity = "0.85"
        }}
        onMouseLeave={(e) => {
          if (!isLoading) e.currentTarget.style.opacity = "1"
        }}
      >
        {isLoading && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "2px solid rgba(0,200,83,0.3)",
              borderTopColor: PORTFOLIO_COLORS.GREEN,
              animation: "spin 0.7s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        {isLoading ? "Redeeming…" : "Redeem"}
      </button>
    )
  }

  return null
}

// ── PnL display ───────────────────────────────────────────────────────────────
const PnlDisplay = ({ position }: { position: Position }) => {
  const pnl = position.value - position.invested
  const pct = position.invested > 0 ? (pnl / position.invested) * 100 : 0
  const positive = pnl >= 0

  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: PORTFOLIO_COLORS.TEXT_PRIMARY }}>
        {position.isResolved && isLost(position) ? (
          <span style={{ color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>$0.00</span>
        ) : (
          `$${position.value.toFixed(2)}`
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 3,
          fontSize: 11,
          fontWeight: 600,
          color: positive ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
          marginTop: 2,
        }}
      >
        <span>{positive ? "↗" : "↘"}</span>
        <span>
          {positive ? "+" : ""}${Math.abs(pnl).toFixed(2)} ({positive ? "+" : ""}
          {pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const shimmer: React.CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "pos-shimmer 1.6s ease-in-out infinite",
  borderRadius: 6,
}

const PositionsSkeleton = () => (
  <>
    <style>{`@keyframes pos-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "grid",
          gridTemplateColumns: COL,
          gap: 8,
          padding: "16px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...shimmer, height: 14, width: "65%" }} />
          <div style={{ ...shimmer, height: 10, width: "25%" }} />
        </div>
        {[50, 60, 55, 60, 50, 70].map((w, j) => (
          <div key={j} style={{ ...shimmer, height: 12, width: `${w}%`, marginLeft: "auto" }} />
        ))}
      </div>
    ))}
  </>
)

// ── Position row ──────────────────────────────────────────────────────────────
const PositionRow = ({
  position,
  onRedeem,
  redeemingId,
  isRedeeming,
}: {
  position: Position
  onRedeem: (p: Position) => void
  redeemingId: string | null
  isRedeeming: boolean
}) => {
  const thisIsRedeeming = redeemingId === position.id && isRedeeming

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: COL,
        gap: 8,
        padding: "16px",
        borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        alignItems: "center",
        transition: "background 0.15s",
        cursor: "pointer",
        background: canRedeem(position) ? "rgba(0,200,83,0.03)" : "transparent",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = canRedeem(position)
          ? "rgba(0,200,83,0.06)"
          : "rgba(255,255,255,0.02)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = canRedeem(position)
          ? "rgba(0,200,83,0.03)"
          : "transparent")
      }
    >
      {/* market title + tags */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: PORTFOLIO_COLORS.TEXT_PRIMARY,
            marginBottom: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {position.marketTitle}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {position.category && <CategoryTag label={position.category} />}
          {position.tags?.map((tag) => (
            <CategoryTag key={tag} label={tag} highlight />
          ))}
          {position.isResolved && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 6,
                background: canRedeem(position)
                  ? "rgba(0,200,83,0.12)"
                  : isLost(position)
                    ? "rgba(229,57,53,0.10)"
                    : "rgba(255,255,255,0.06)",
                color: canRedeem(position)
                  ? PORTFOLIO_COLORS.GREEN
                  : isLost(position)
                    ? PORTFOLIO_COLORS.RED
                    : PORTFOLIO_COLORS.TEXT_MUTED_2,
              }}
            >
              {position.isRedeemed
                ? "Resolved"
                : canRedeem(position)
                  ? `Resolved · ${position.winningOutcome} won ✓`
                  : `Resolved · ${position.winningOutcome} won`}
            </span>
          )}
        </div>
      </div>

      {/* side */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <SidePill side={position.side} />
      </div>

      {/* shares */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
          textAlign: "right",
        }}
      >
        {position.shares.toLocaleString()}
      </div>

      {/* avg price */}
      <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {position.avgPrice.toFixed(2)}¢
      </div>

      {/* now price */}
      <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {position.isResolved ? (
          <span style={{ color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>Resolved</span>
        ) : (
          `${position.nowPrice.toFixed(2)}¢`
        )}
      </div>

      {/* invested */}
      <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        ${position.invested.toFixed(2)}
      </div>

      {/* value + redeem */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <PnlDisplay position={position} />
        <RedeemButton position={position} onRedeem={onRedeem} isLoading={thisIsRedeeming} />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ label }: { label: string }) => (
  <div
    style={{
      padding: "60px 20px",
      textAlign: "center",
      color: PORTFOLIO_COLORS.TEXT_MUTED,
      fontSize: 13,
      fontWeight: 500,
    }}
  >
    {label}
  </div>
)

// ── PositionsTab ──────────────────────────────────────────────────────────────
interface PositionsTabProps {
  search: string
}

export const PositionsTab = ({ search }: PositionsTabProps) => {
  const [page, setPage] = useState(1)
  const skip = (page - 1) * PAGE_SIZE

  const { data, isLoading } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.FILLED,
    limit: PAGE_SIZE,
    skip,
  })

  const apiPositions = aggregateFilledOrders(data?.data.data ?? [])
  const totalApiCount = data?.data.count ?? 0
  const totalPages = Math.max(Math.ceil(totalApiCount / PAGE_SIZE), 1)

  // combine mock + API positions, then filter by search
  const combined = [...MOCK_POSITIONS, ...apiPositions].filter((p) =>
    p.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  const { redeem, redeemingId, isRedeeming } = useRedeem()

  if (isLoading) return <PositionsSkeleton />

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pos-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COL,
          gap: 8,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
          alignItems: "center",
        }}
      >
        <ColHeader>Market</ColHeader>
        <ColHeader align="center">Side</ColHeader>
        <ColHeader align="right">Shares</ColHeader>
        <ColHeader align="right">Avg</ColHeader>
        <ColHeader align="right">Now</ColHeader>
        <ColHeader align="right">Invested</ColHeader>
        <ColHeader align="right">Value</ColHeader>
      </div>

      {combined.length === 0 ? (
        <EmptyState label="No positions found." />
      ) : (
        combined.map((pos) => (
          <PositionRow
            key={pos.id}
            position={pos}
            onRedeem={redeem}
            redeemingId={redeemingId}
            isRedeeming={isRedeeming}
          />
        ))
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </>
  )
}
