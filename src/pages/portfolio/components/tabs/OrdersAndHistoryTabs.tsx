// src/pages/portfolio/components/tabs/OrdersAndHistoryTabs.tsx

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { useGetOrdersQuery } from "@/features/api/orders/orderApi"
import { useCancelOrderMutation } from "@/features/api/orders/orderApi"
import {
  mapApiOrderToHistoryItem,
  mapApiOrderToPortfolioOrder,
  ORDER_STATUS_PARAM,
} from "@/features/api/orders/orderApiTypes"
import { formatMarketDate } from "@/libs/formatDate"
import { type HistoryItem, type PortfolioOrder } from "@/mocks/mockPortfolio"

import {
  HISTORY_TYPE,
  ORDER_STATUS,
  PORTFOLIO_COLORS,
  POSITION_SIDE,
} from "../../portfolioConstants"

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10

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
      gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 100px 110px",
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
    {[60, 50, 40, 50, 40, 70, 60].map((w, i) => (
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

// ── Pagination ────────────────────────────────────────────────────────────────
export const Pagination = ({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) => {
  if (totalPages <= 1) return null

  const btnBase: React.CSSProperties = {
    padding: "5px 12px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
    background: PORTFOLIO_COLORS.SURFACE,
    color: PORTFOLIO_COLORS.TEXT_MUTED,
    cursor: "pointer",
    transition: "all 0.15s",
  }
  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.35,
    cursor: "not-allowed",
  }
  const pageNumStyle = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    background: active ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.SURFACE,
    color: active ? "#000" : PORTFOLIO_COLORS.TEXT_MUTED,
    borderColor: active ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.CARD_BORDER,
    fontWeight: active ? 700 : 600,
  })

  // show at most 5 page numbers centered around current
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pageNums = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "16px",
        borderTop: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
      }}
    >
      <button
        style={page === 1 ? btnDisabled : btnBase}
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={14} strokeWidth={2.5} />
          <span>Prev</span>
        </div>
      </button>

      {start > 1 && (
        <>
          <button style={pageNumStyle(false)} onClick={() => onPage(1)}>
            1
          </button>
          {start > 2 && (
            <span style={{ color: PORTFOLIO_COLORS.TEXT_MUTED_2, fontSize: 12 }}>…</span>
          )}
        </>
      )}

      {pageNums.map((n) => (
        <button key={n} style={pageNumStyle(n === page)} onClick={() => onPage(n)}>
          {n}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span style={{ color: PORTFOLIO_COLORS.TEXT_MUTED_2, fontSize: 12 }}>…</span>
          )}
          <button style={pageNumStyle(false)} onClick={() => onPage(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        style={page === totalPages ? btnDisabled : btnBase}
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Next</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
      </button>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────
const SidePill = ({ side }: { side: string }) => {
  const isYes = side.toUpperCase() === POSITION_SIDE.YES
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 20,
        background: isYes ? "rgba(0,200,83,0.15)" : "rgba(229,57,53,0.15)",
        color: isYes ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
      }}
    >
      {side.toUpperCase()}
    </span>
  )
}

const DirectionPill = ({ direction }: { direction: "Buy" | "Sell" }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      padding: "4px 10px",
      borderRadius: 20,
      background: direction === "Buy" ? "rgba(0,200,83,0.15)" : "rgba(229,57,53,0.15)",
      color: direction === "Buy" ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
    }}
  >
    {direction}
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
// ORDERS TAB  (PENDING + PARTIALLY_FILLED, paginated)
// ─────────────────────────────────────────────────────────────────────────────
const ORDERS_COL = "1fr 80px 80px 80px 80px 80px 100px 110px"

interface OrdersTabProps {
  search: string
}

export const PortfolioOrdersTab = ({ search }: OrdersTabProps) => {
  const [page, setPage] = useState(1)
  const skip = (page - 1) * PAGE_SIZE

  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.PENDING,
    limit: PAGE_SIZE,
    skip,
  })
  const {
    data: partialData,
    isLoading: partialLoading,
    refetch: refetchPartial,
  } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.PARTIALLY_FILLED,
    limit: PAGE_SIZE,
    skip,
  })

  const isLoading = pendingLoading || partialLoading

  const handleCancelled = () => {
    refetchPending()
    refetchPartial()
  }

  const pendingOrders = pendingData?.data.data.map(mapApiOrderToPortfolioOrder) ?? []
  const partialOrders = partialData?.data.data.map(mapApiOrderToPortfolioOrder) ?? []

  const combined: PortfolioOrder[] = [...pendingOrders, ...partialOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((o) => o.marketTitle.toLowerCase().includes(search.toLowerCase()))

  const pendingCount = pendingData?.data.count ?? 0
  const partialCount = partialData?.data.count ?? 0
  const totalPages = Math.max(
    Math.ceil(pendingCount / PAGE_SIZE),
    Math.ceil(partialCount / PAGE_SIZE),
    1,
  )

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
          {["Market", "Outcome", "Order", "Type", "Price", "Shares", "Status", "Action"].map(
            (h, i) => (
              <div
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: PORTFOLIO_COLORS.TEXT_MUTED_2,
                  textAlign: i > 2 ? "right" : ("left" as React.CSSProperties["textAlign"]),
                }}
              >
                {h}
              </div>
            ),
          )}
        </div>

        {combined.length === 0 ? (
          <EmptyState label="No open orders." />
        ) : (
          combined.map((order) => (
            <OrderRow key={order.id} order={order} onCancelled={handleCancelled} />
          ))
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPage={(p) => {
            setPage(p)
          }}
        />
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

      {/* outcome (Yes / No) */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <SidePill side={order.token.title} />
      </div>

      {/* order direction (Buy / Sell) */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <DirectionPill direction={order.direction} />
      </div>

      {/* type (Limit / Market) */}
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

      {/* action */}
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
// HISTORY TAB  (FILLED + CANCELLED, paginated)
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY_COL = "1fr 80px 80px 80px 80px 90px 100px"

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
}

export const HistoryTab = ({ search }: HistoryTabProps) => {
  const [page, setPage] = useState(1)
  const skip = (page - 1) * PAGE_SIZE

  const { data: filledData, isLoading: filledLoading } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.FILLED,
    limit: PAGE_SIZE,
    skip,
  })
  const { data: cancelledData, isLoading: cancelledLoading } = useGetOrdersQuery({
    status: ORDER_STATUS_PARAM.CANCELLED,
    limit: PAGE_SIZE,
    skip,
  })

  const isLoading = filledLoading || cancelledLoading

  const filledItems = filledData?.data.data.map(mapApiOrderToHistoryItem) ?? []
  const cancelledItems = cancelledData?.data.data.map(mapApiOrderToHistoryItem) ?? []

  const combined: HistoryItem[] = [...filledItems, ...cancelledItems]
    .sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime())
    .filter((h) => h.marketTitle.toLowerCase().includes(search.toLowerCase()))

  const filledCount = filledData?.data.count ?? 0
  const cancelledCount = cancelledData?.data.count ?? 0
  const totalPages = Math.max(
    Math.ceil(filledCount / PAGE_SIZE),
    Math.ceil(cancelledCount / PAGE_SIZE),
    1,
  )

  if (isLoading) return <OrdersTabSkeleton />

  return (
    <div>
      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: HISTORY_COL,
          gap: 8,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
        }}
      >
        {["Market", "Type", "Outcome", "Order Type", "Shares", "Total", "Date"].map((h, i) => (
          <div
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: PORTFOLIO_COLORS.TEXT_MUTED_2,
              textAlign: i > 2 ? "right" : ("left" as React.CSSProperties["textAlign"]),
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {combined.length === 0 ? (
        <EmptyState label="No trade history." />
      ) : (
        combined.map((item) => <HistoryRow key={item.id} item={item} />)
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPage={(p) => {
          setPage(p)
        }}
      />
    </div>
  )
}

const HistoryRow = ({ item }: { item: HistoryItem }) => (
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
        {item.marketTitle}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {item.category && <CategoryTag label={item.category} />}
      </div>
    </div>

    {/* type (Buy / Sell / Redeem) */}
    <div>
      <HistoryTypeBadge type={item.type} />
    </div>

    {/* outcome (Yes / No) */}
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <SidePill side={item.side} />
    </div>

    {/* order type (Limit / Market) */}
    <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
      {item.orderType}
    </div>

    {/* shares */}
    <div style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
      {item.shares.toLocaleString()}
    </div>

    {/* total */}
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

    {/* date */}
    <div style={{ fontSize: 12, color: PORTFOLIO_COLORS.TEXT_MUTED_2, textAlign: "right" }}>
      {formatMarketDate(item.settledAt)}
    </div>
  </div>
)
