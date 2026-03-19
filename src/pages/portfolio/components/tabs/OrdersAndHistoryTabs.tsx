// src/pages/portfolio/components/tabs/OrdersAndHistoryTabs.tsx
// TODO: replace mock data with API calls when ready

import { formatMarketDate } from "@/libs/formatDate"
import {
  type HistoryItem,
  MOCK_HISTORY,
  MOCK_PORTFOLIO_ORDERS,
  type PortfolioOrder,
} from "@/mocks/mockPortfolio"

import {
  HISTORY_TYPE,
  ORDER_STATUS,
  PORTFOLIO_COLORS,
  POSITION_SIDE,
} from "../../portfolioConstants"

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

// ── Status badge ──────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────────────────────────────────────────────────
const ORDERS_COL = "1fr 80px 80px 80px 80px 100px"

interface OrdersTabProps {
  search: string
  // TODO: orders: PortfolioOrder[] ← from useGetOrdersQuery()
}

export const PortfolioOrdersTab = ({ search }: OrdersTabProps) => {
  const orders = MOCK_PORTFOLIO_ORDERS.filter((o) =>
    o.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: ORDERS_COL,
          gap: 8,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        }}
      >
        {["Market", "Side", "Type", "Price", "Shares", "Status"].map((h, i) => (
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
        orders.map((order) => <OrderRow key={order.id} order={order} />)
      )}
    </div>
  )
}

const OrderRow = ({ order }: { order: PortfolioOrder }) => {
  const fillPct = order.shares > 0 ? Math.round((order.filled / order.shares) * 100) : 0

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
          <CategoryTag label={order.category} />
          {order.status === ORDER_STATUS.PARTIAL && (
            <span style={{ fontSize: 10, color: PORTFOLIO_COLORS.TEXT_MUTED }}>
              {fillPct}% filled
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <SidePill side={order.side} />
      </div>

      <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {order.orderType}
      </div>

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

      <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
        {order.shares.toLocaleString()}
      </div>

      <div style={{ textAlign: "right" }}>
        <StatusBadge status={order.status} />
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
  // TODO: history: HistoryItem[] ← from useGetHistoryQuery()
}

export const HistoryTab = ({ search }: HistoryTabProps) => {
  const items = MOCK_HISTORY.filter((h) =>
    h.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* headers */}
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
