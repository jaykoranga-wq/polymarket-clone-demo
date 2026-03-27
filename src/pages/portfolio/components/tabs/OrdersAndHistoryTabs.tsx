// src/pages/portfolio/components/tabs/OrdersAndHistoryTabs.tsx

import { useState } from "react"
import { toast } from "sonner"

import { useGetOrdersQuery } from "@/features/api/orders/orderApi"
import { useCancelOrderMutation } from "@/features/api/orders/orderApi"
import {
  mapApiOrderToPortfolioOrder,
  ORDER_STATUS_PARAM,
} from "@/features/api/orders/orderApiTypes"
import { formatMarketDate } from "@/libs/formatDate"
import { type HistoryItem, MOCK_HISTORY, type PortfolioOrder } from "@/mocks/mockPortfolio"

import {
  HISTORY_TYPE,
  ORDER_STATUS,
  PORTFOLIO_COLORS,
  POSITION_SIDE,
} from "../../portfolioConstants"

// ── Skeleton loader ───────────────────────────────────────────────────────────
const shimmer: React.CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "ob-shimmer 1.6s ease-in-out infinite",
  borderRadius: 6,
}

const OrderRowSkeleton = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 80px 80px 80px 80px 100px",
      gap: 8,
      padding: "16px",
      borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ ...shimmer, height: 14, width: "70%" }} />
      <div style={{ ...shimmer, height: 10, width: "30%" }} />
    </div>
    {[60, 50, 40, 50, 70].map((w, i) => (
      <div key={i} style={{ ...shimmer, height: 12, width: `${w}%`, marginLeft: "auto" }} />
    ))}
  </div>
)

export const OrdersTabSkeleton = () => (
  <>
    <style>{`@keyframes ob-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    {Array.from({ length: 5 }).map((_, i) => (
      <OrderRowSkeleton key={i} />
    ))}
  </>
)

// ── Shared components ─────────────────────────────────────────────────────────
const SidePill = ({ side }: { side: string }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      padding: "4px 10px",
      borderRadius: 20,
      background: side === POSITION_SIDE.YES ? "rgba(0,200,83,0.15)" : "rgba(229,57,53,0.15)",
      color: side === POSITION_SIDE.YES ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
    }}
  >
    {side}
  </span>
)

const CategoryTag = ({ label }: { label: string }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: "rgba(255,255,255,0.06)",
      color: PORTFOLIO_COLORS.TEXT_MUTED,
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    {label}
  </span>
)

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

const StatusBadge = ({ status }: { status: PortfolioOrder["status"] }) => {
  const map = {
    [ORDER_STATUS.PENDING]: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", label: "Pending" },
    [ORDER_STATUS.PARTIAL]: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Partial" },
    [ORDER_STATUS.FILLED]: { bg: "rgba(0,200,83,0.12)", color: "#00c853", label: "Filled" },
    [ORDER_STATUS.CANCELLED]: {
      bg: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.3)",
      label: "Cancelled",
    },
  }
  const s = map[status]
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}

// ── Cancel button with inline confirm ────────────────────────────────────────
const CancelButton = ({
  orderId,
  onCancelled,
}: {
  orderId: string
  onCancelled: (id: string) => void
}) => {
  const [confirm, setConfirm] = useState(false)
  const [cancelOrderApi, { isLoading }] = useCancelOrderMutation()

  const handleCancel = async () => {
    try {
      await cancelOrderApi(orderId).unwrap()
      onCancelled(orderId)
      toast.success("Order cancelled")
    } catch {
      toast.error("Failed to cancel order")
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        style={{
          padding: "5px 10px",
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 700,
          background: "rgba(229,57,53,0.10)",
          color: "#e53935",
          border: "1px solid rgba(229,57,53,0.2)",
          cursor: "pointer",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(229,57,53,0.2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(229,57,53,0.10)")}
      >
        Cancel
      </button>
    )
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10, color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>Sure?</span>
      <button
        onClick={handleCancel}
        disabled={isLoading}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: "#e53935",
          color: "#fff",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.6 : 1,
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isLoading && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "ob-spin 0.7s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        Yes
      </button>
      <button
        onClick={() => setConfirm(false)}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          border: "none",
        }}
      >
        No
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────────────────────────────────────────
const ORDERS_COL = "1fr 80px 80px 80px 80px 100px 110px"

interface OrdersTabProps {
  search: string
}

export const PortfolioOrdersTab = ({ search }: OrdersTabProps) => {
  const { data, isLoading, refetch } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.PENDING,
    limit: 50,
  })

  const orders: PortfolioOrder[] = (data?.data.data.map(mapApiOrderToPortfolioOrder) ?? []).filter(
    (o) => o.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  // after cancel — refetch to get fresh list
  const handleCancelled = () => refetch()

  if (isLoading) return <OrdersTabSkeleton />

  return (
    <>
      <style>{`
        @keyframes ob-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes ob-spin    { to { transform: rotate(360deg); } }
      `}</style>

      <div>
        {/* column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: ORDERS_COL,
            gap: 8,
            padding: "0 16px 12px",
            borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
          }}
        >
          {["Market", "Side", "Type", "Price", "Shares", "Status", "Action"].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: PORTFOLIO_COLORS.TEXT_MUTED_2,
                textAlign: i > 1 ? "right" : ("left" as React.CSSProperties["textAlign"]),
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {orders.length === 0 ? (
          <EmptyState label="No open orders." />
        ) : (
          orders.map((order) => (
            <OrderRow key={order.id} order={order} onCancelled={handleCancelled} />
          ))
        )}
      </div>
    </>
  )
}

const OrderRow = ({
  order,
  onCancelled,
}: {
  order: PortfolioOrder
  onCancelled: (id: string) => void
}) => {
  const fillPct = order.shares > 0 ? Math.round((order.filled / order.shares) * 100) : 0
  const isCancellable =
    order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.PARTIAL

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: ORDERS_COL,
        gap: 8,
        padding: "14px 16px",
        borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        alignItems: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* market */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: PORTFOLIO_COLORS.TEXT_PRIMARY,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
        >
          {order.marketTitle}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {order.category && <CategoryTag label={order.category} />}
          {order.status === ORDER_STATUS.PARTIAL && (
            <span style={{ fontSize: 10, color: PORTFOLIO_COLORS.TEXT_MUTED }}>
              {fillPct}% filled
            </span>
          )}
        </div>
      </div>

      {/* side */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <SidePill side={order.side} />
      </div>

      {/* type */}
      <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {order.orderType}
      </div>

      {/* price */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
          textAlign: "right",
        }}
      >
        {order.price}¢
      </div>

      {/* shares */}
      <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {order.shares.toLocaleString()}
      </div>

      {/* status */}
      <div style={{ textAlign: "right" }}>
        <StatusBadge status={order.status} />
      </div>

      {/* action — cancel button only for pending/partial */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {isCancellable ? (
          <CancelButton orderId={order.id} onCancelled={onCancelled} />
        ) : (
          <span style={{ fontSize: 11, color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>—</span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY_COL = "1fr 80px 80px 80px 90px 100px"

const HistoryTypeBadge = ({ type }: { type: HistoryItem["type"] }) => {
  const map = {
    [HISTORY_TYPE.BUY]: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa", label: "Buy" },
    [HISTORY_TYPE.SELL]: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Sell" },
    [HISTORY_TYPE.REDEEM]: { bg: "rgba(0,200,83,0.12)", color: "#00c853", label: "Redeem" },
  }
  const s = map[type]
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}

interface HistoryTabProps {
  search: string
  // TODO: const { data } = useGetHistoryQuery() when API ready
}

export const HistoryTab = ({ search }: HistoryTabProps) => {
  const items = MOCK_HISTORY.filter((h) =>
    h.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: HISTORY_COL,
          gap: 8,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        }}
      >
        {["Market", "Type", "Side", "Shares", "Total", "P/L"].map((h, i) => (
          <div
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: PORTFOLIO_COLORS.TEXT_MUTED_2,
              textAlign: i > 1 ? "right" : ("left" as React.CSSProperties["textAlign"]),
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState label="No trade history." />
      ) : (
        items.map((item) => <HistoryRow key={item.id} item={item} />)
      )}
    </div>
  )
}

const HistoryRow = ({ item }: { item: HistoryItem }) => {
  const hasPnl = item.pnl !== undefined
  const pnlPos = (item.pnl ?? 0) >= 0

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: HISTORY_COL,
        gap: 8,
        padding: "14px 16px",
        borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        alignItems: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: PORTFOLIO_COLORS.TEXT_PRIMARY,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 4,
          }}
        >
          {item.marketTitle}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <CategoryTag label={item.category} />
          <span style={{ fontSize: 10, color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>
            {formatMarketDate(item.settledAt)}
          </span>
        </div>
      </div>

      <div>
        <HistoryTypeBadge type={item.type} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SidePill side={item.side} />
      </div>

      <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {item.shares.toLocaleString()}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
          textAlign: "right",
        }}
      >
        ${item.total.toFixed(2)}
      </div>

      <div style={{ textAlign: "right" }}>
        {hasPnl ? (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: pnlPos ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
            }}
          >
            {pnlPos ? "+" : ""}${item.pnl!.toFixed(2)}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: PORTFOLIO_COLORS.TEXT_MUTED_2 }}>—</span>
        )}
      </div>
    </div>
  )
}
