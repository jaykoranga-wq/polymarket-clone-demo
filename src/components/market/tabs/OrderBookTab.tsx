// src/components/market/tabs/OrderBookTab.tsx
// Polymarket-style order book:
//   - YES / NO toggle at top
//   - Single column: asks (dimmed) above spread, bids below
//   - Two API calls per token (bids + asks)

import { useState } from "react"

import {
  mapApiEntryToRow,
  type OrderBookRow,
  useGetOrderBookQuery,
} from "@/features/api/orderBook/orderBookApi"

// ── Constants ─────────────────────────────────────────────────────────────────
const ORDER_BOOK_TYPE = {
  BUY: 1,
  SELL: 2,
} as const

type TokenSide = "YES" | "NO"

// ── Props ─────────────────────────────────────────────────────────────────────
interface OrderBookTabProps {
  marketId: string
  yesTokenId: string // backend UUID for YES token
  noTokenId: string // backend UUID for NO token
}

// ── Sub-components ────────────────────────────────────────────────────────────

// calculates max shares across all rows for depth bar width
const getMaxShares = (rows: OrderBookRow[]) => rows.reduce((max, r) => Math.max(max, r.shares), 1)

const OBRow = ({
  row,
  maxShares,
  isBid,
}: {
  row: OrderBookRow
  maxShares: number
  isBid: boolean // bid = green, ask = red+dimmed
}) => (
  <div className="ep-ob-row" style={{ opacity: isBid ? 1 : 0.5, position: "relative" }}>
    {/* depth bar */}
    <div
      className="ep-ob-depth"
      style={{
        width: `${(row.shares / maxShares) * 100}%`,
        background: isBid ? "#00c853" : "#e53935",
      }}
    />
    <span className={`ep-ob-price ${isBid ? "yes" : "no"}`}>{row.price}¢</span>
    <span className="ep-ob-shares">{row.shares.toLocaleString()}</span>
  </div>
)

const SpreadLine = ({ spread }: { spread: number }) => (
  <div
    className="text-[10px] text-center py-1 my-0.5"
    style={{
      color: "rgba(255,255,255,0.2)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}
  >
    spread {spread > 0 ? `${spread}¢` : "—"}
  </div>
)

const EmptyRows = ({ label }: { label: string }) => (
  <div className="text-[11px] text-center py-3" style={{ color: "rgba(255,255,255,0.2)" }}>
    {label}
  </div>
)

const SkeletonRows = () => (
  <div className="flex flex-col gap-1 py-2">
    {[80, 60, 40, 60, 80].map((w, i) => (
      <div
        key={i}
        style={{
          height: 12,
          width: `${w}%`,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
          margin: "2px auto",
        }}
      />
    ))}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
export const OrderBookTab = ({ marketId: _, yesTokenId, noTokenId }: OrderBookTabProps) => {
  const [activeSide, setActiveSide] = useState<TokenSide>("YES")

  const tokenId = activeSide === "YES" ? yesTokenId : noTokenId

  // fetch bids (BUY orders) for active token
  const { data: bidsData, isLoading: bidsLoading } = useGetOrderBookQuery({
    tokenId,
    type: ORDER_BOOK_TYPE.BUY,
    limit: 10,
  })

  // fetch asks (SELL orders) for active token
  const { data: asksData, isLoading: asksLoading } = useGetOrderBookQuery({
    tokenId,
    type: ORDER_BOOK_TYPE.SELL,
    limit: 10,
  })

  const isLoading = bidsLoading || asksLoading

  // transform and sort
  const bids = (bidsData?.data.data ?? []).map(mapApiEntryToRow).sort((a, b) => b.price - a.price) // highest bid first

  const asks = (asksData?.data.data ?? []).map(mapApiEntryToRow).sort((a, b) => a.price - b.price) // lowest ask first

  // spread = lowest ask - highest bid
  const spread = asks[0] && bids[0] ? asks[0].price - bids[0].price : 0

  const maxShares = getMaxShares([...bids, ...asks])

  return (
    <div className="ep-section">
      {/* ── Header ── */}
      <div className="ep-section-header">
        <span className="ep-section-title">
          Order Book <span className="ep-section-title-info">i</span>
        </span>
        <span style={{ fontFamily: "var(--ep-mono)", fontSize: 11, color: "var(--ep-muted)" }}>
          PRICE · SHARES
        </span>
      </div>

      {/* ── YES / NO token toggle ── */}
      <div
        className="flex gap-1 mb-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
        }}
      >
        {(["YES", "NO"] as TokenSide[]).map((side) => (
          <button
            key={side}
            onClick={() => setActiveSide(side)}
            style={{
              padding: "5px 20px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              background:
                activeSide === side ? (side === "YES" ? "#00c853" : "#e53935") : "transparent",
              color: activeSide === side ? "#000" : "rgba(255,255,255,0.4)",
            }}
          >
            {side}
          </button>
        ))}
      </div>

      {/* ── Column headers ── */}
      <div className="ep-ob-col-head" style={{ marginBottom: 4 }}>
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Shares</span>
      </div>

      {/* ── Order rows ── */}
      {isLoading ? (
        <SkeletonRows />
      ) : (
        <>
          {/* asks — people SELLING (dimmed, shown above spread) */}
          {asks.length === 0 ? (
            <EmptyRows label="No sell orders" />
          ) : (
            [...asks]
              .reverse()
              .map((row, i) => (
                <OBRow key={`ask-${i}`} row={row} maxShares={maxShares} isBid={false} />
              ))
          )}

          <SpreadLine spread={spread} />

          {/* bids — people BUYING (green, shown below spread) */}
          {bids.length === 0 ? (
            <EmptyRows label="No buy orders" />
          ) : (
            bids.map((row, i) => (
              <OBRow key={`bid-${i}`} row={row} maxShares={maxShares} isBid={true} />
            ))
          )}
        </>
      )}
    </div>
  )
}
