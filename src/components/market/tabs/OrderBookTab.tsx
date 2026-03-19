// src/components/market/tabs/OrderBookTab.tsx
// TODO: replace MOCK_ORDER_BOOK with useGetOrderBookQuery(marketId) when API ready

import { MOCK_ORDER_BOOK, type OrderBookRow } from "@/mocks/mockOrderBook"

interface OrderBookTabProps {
  marketId: string // ready for API call later
}

// max shares across all rows — used for depth bar width calculation
const MAX_SHARES = Math.max(
  ...MOCK_ORDER_BOOK.yes.bids.map((r) => r.shares),
  ...MOCK_ORDER_BOOK.yes.asks.map((r) => r.shares),
  ...MOCK_ORDER_BOOK.no.bids.map((r) => r.shares),
  ...MOCK_ORDER_BOOK.no.asks.map((r) => r.shares),
)

// ── Single order row ──────────────────────────────────────────────────────────
const OBRow = ({
  row,
  side,
  dim = false,
}: {
  row: OrderBookRow
  side: "yes" | "no"
  dim?: boolean
}) => (
  <div className="ep-ob-row" style={{ opacity: dim ? 0.45 : 1 }}>
    <div
      className="ep-ob-depth"
      style={{
        width: `${(row.shares / MAX_SHARES) * 100}%`,
        background: side === "yes" ? "#00c853" : "#e53935",
      }}
    />
    <span className={`ep-ob-price ${side}`}>{row.price}¢</span>
    <span className="ep-ob-shares">{row.shares.toLocaleString()}</span>
  </div>
)

// ── Spread divider ────────────────────────────────────────────────────────────
const SpreadLine = ({ spread }: { spread: number }) => (
  <div
    className="text-[10px] text-center py-1 my-0.5"
    style={{
      color: "rgba(255,255,255,0.2)",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}
  >
    spread {spread}¢
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
export const OrderBookTab = ({ marketId: _ }: OrderBookTabProps) => {
  // TODO: const { data: book = MOCK_ORDER_BOOK } = useGetOrderBookQuery(marketId)
  const book = MOCK_ORDER_BOOK

  const yesSpread = book?.yes.asks[0].price - book.yes.bids[0].price
  const noSpread = book.no.asks[0].price - book.no.bids[0].price

  return (
    <div className="ep-section">
      <div className="ep-section-header">
        <span className="ep-section-title">
          Order Book <span className="ep-section-title-info">i</span>
        </span>
        <span style={{ fontFamily: "var(--ep-mono)", fontSize: 11, color: "var(--ep-muted)" }}>
          PRICE · SHARES
        </span>
      </div>

      <div className="ep-ob-grid">
        {/* ── YES side ── */}
        <div>
          <div className="ep-ob-col-label yes">▲ YES</div>
          <div className="ep-ob-col-head">
            <span>Price</span>
            <span style={{ textAlign: "right" }}>Shares</span>
          </div>

          {/* asks — people selling YES (dimmed, above spread) */}
          {[...book.yes.asks].reverse().map((row, i) => (
            <OBRow key={`yes-ask-${i}`} row={row} side="yes" dim />
          ))}

          <SpreadLine spread={yesSpread} />

          {/* bids — people buying YES */}
          {book.yes.bids.map((row, i) => (
            <OBRow key={`yes-bid-${i}`} row={row} side="yes" />
          ))}
        </div>

        {/* ── NO side ── */}
        <div>
          <div className="ep-ob-col-label no">▼ NO</div>
          <div className="ep-ob-col-head">
            <span>Price</span>
            <span style={{ textAlign: "right" }}>Shares</span>
          </div>

          {/* asks — people selling NO (dimmed) */}
          {[...book.no.asks].reverse().map((row, i) => (
            <OBRow key={`no-ask-${i}`} row={row} side="no" dim />
          ))}

          <SpreadLine spread={noSpread} />

          {/* bids — people buying NO */}
          {book.no.bids.map((row, i) => (
            <OBRow key={`no-bid-${i}`} row={row} side="no" />
          ))}
        </div>
      </div>
    </div>
  )
}
