import "./TradePanel.css"

import { useEffect, useRef, useState } from "react"

import { useAppSelector } from "@/app/hooks"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradePanelProps {
  yesProbability: number // 0–100 (cents)
  noProbability: number
  isCrypto?: boolean // "Up/Down" labels instead of "Yes/No"
  onTrade?: (o: TradeOrder) => void
  onLoginRequired?: () => void // ← called when not authenticated
  onDepositRequired?: () => void // ← called when no balance
}

export interface TradeOrder {
  action: "Buy" | "Sell"
  orderType: "Market" | "Limit"
  outcome: "Yes" | "No" | "Up" | "Down"
  amount?: number // Market Buy  — dollar amount
  shares?: number // all other modes
  limitCents?: number // Limit only
  expirationEnabled: boolean
}

type Action = "Buy" | "Sell"
type OrderType = "Market" | "Limit"

// ─── Chevron icon ─────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: 13, height: 13 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────

const TradePanel = ({
  yesProbability,
  noProbability,
  isCrypto = false,
  onTrade,
  onLoginRequired,
  onDepositRequired,
}: TradePanelProps) => {
  // Outcome labels depend on market type
  const labelA = isCrypto ? "Up" : "Yes"
  const labelB = isCrypto ? "Down" : "No"
  const priceA = yesProbability
  const priceB = noProbability

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  let balance = useAppSelector((state) => state.auth.cashAmount)
  if (!balance) balance = 0
  const buttonState = !isAuthenticated ? "login" : balance <= 0 ? "deposit" : "trade"

  // ── Core state ──
  const [action, setAction] = useState<Action>("Buy")
  const [orderType, setOrderType] = useState<OrderType>("Market")
  const [outcome, setOutcome] = useState(labelA)
  const [dropOpen, setDropOpen] = useState(false)

  // ── Market Buy state ──
  const [amount, setAmount] = useState(0) // dollar amount

  // ── Market Sell state ──
  const [sellShares, setSellShares] = useState(0)
  const [sellPct, setSellPct] = useState<string | null>(null)

  // ── Limit state (shared Buy + Sell) ──
  const [limitCents, setLimitCents] = useState(priceA)
  const [shares, setShares] = useState(0)
  const [expiry, setExpiry] = useState(false)

  // Reset everything when switching action or order type
  const handleAction = (a: Action) => {
    setAction(a)
    setAmount(0)
    setSellShares(0)
    setSellPct(null)
    setShares(0)
    setExpiry(false)
    setLimitCents(outcome === labelA ? priceA : priceB)
  }

  const handleOrderType = (t: OrderType) => {
    setOrderType(t)
    setDropOpen(false)
    setAmount(0)
    setSellShares(0)
    setSellPct(null)
    setShares(0)
    setExpiry(false)
  }

  const handleOutcome = (o: string) => {
    setOutcome(o)
    setLimitCents(o === labelA ? priceA : priceB)
    setAmount(0)
    setSellShares(0)
    setShares(0)
  }

  // Close dropdown when clicking outside
  const dropRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Market Buy: quick dollar add ──
  const handleAmountAdd = (val: number | "Max") => {
    if (val === "Max") {
      setAmount(500)
      return
    } // 500 = mock balance
    setAmount((p) => p + val)
  }

  // ── Market Sell: pct of holdings ──
  const handleSellPct = (pct: string) => {
    setSellPct(pct)
    const mockHoldings = 200 // replace with real holdings from Redux
    const map: Record<string, number> = { "25%": 0.25, "50%": 0.5, Max: 1 }
    setSellShares(parseFloat((mockHoldings * (map[pct] ?? 0)).toFixed(2)))
  }

  // ── Limit: shares adjust buttons (Buy) ──
  const handleSharesAdjust = (delta: number) => {
    setShares((p) => Math.max(0, p + delta))
  }

  // ── Limit: pct shortcuts (Sell) ──
  const handleLimitSellPct = (pct: string) => {
    const mockHoldings = 200
    const map: Record<string, number> = { "25%": 0.25, "50%": 0.5, Max: 1 }
    setShares(parseFloat((mockHoldings * (map[pct] ?? 0)).toFixed(2)))
  }

  // ── Computed summary values ──
  // Total cost (Limit Buy) = shares × limitCents / 100
  const total = shares > 0 ? ((shares * limitCents) / 100).toFixed(2) : "0"
  // To win (Limit Buy)  = shares × $1 (each share pays $1 if correct)
  const toWin = shares > 0 ? shares.toFixed(2) : "0"
  // You'll receive (Limit Sell) = shares × limitCents / 100
  const youReceive = shares > 0 ? ((shares * limitCents) / 100).toFixed(2) : "0"

  // ── Is trade button disabled? ──
  const tradeDisabled =
    (action === "Buy" && orderType === "Market" && amount <= 0) ||
    (action === "Sell" && orderType === "Market" && sellShares <= 0) ||
    (orderType === "Limit" && shares <= 0)

  const handleTrade = () => {
    if (tradeDisabled) return
    onTrade?.({
      action,
      orderType,
      outcome: outcome as TradeOrder["outcome"],
      amount: action === "Buy" && orderType === "Market" ? amount : undefined,
      shares: action === "Sell" && orderType === "Market" ? sellShares : shares,
      limitCents: orderType === "Limit" ? limitCents : undefined,
      expirationEnabled: expiry,
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="tp ep">
      {/* ── Buy / Sell tabs  +  Market/Limit dropdown ── */}
      <div className="tp-top">
        <div className="tp-action-tabs">
          {(["Buy", "Sell"] as Action[]).map((a) => (
            <button
              key={a}
              className={`tp-action-tab${a === "Sell" ? " sell" : ""}${action === a ? " active" : ""}`}
              onClick={() => handleAction(a)}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Order type dropdown */}
        <div className="tp-dropdown-wrap" ref={dropRef}>
          <div className="tp-order-type" onClick={() => setDropOpen((p) => !p)}>
            {orderType} <ChevronDown />
          </div>
          {dropOpen && (
            <div className="tp-dropdown-menu">
              {(["Market", "Limit"] as OrderType[]).map((t) => (
                <button
                  key={t}
                  className={`tp-dropdown-item${orderType === t ? " active" : ""}`}
                  onClick={() => handleOrderType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tp-divider" />

      <div className="tp-body">
        {/* ── YES / NO (or Up / Down) outcome toggle ── */}
        {/* Same in all 4 modes */}
        <div className="tp-outcome">
          <button
            className={`tp-outcome-btn yes${outcome === labelA ? " active" : ""}`}
            onClick={() => handleOutcome(labelA)}
          >
            {labelA} {priceA}¢
          </button>
          <button
            className={`tp-outcome-btn no${outcome === labelB ? " active" : ""}`}
            onClick={() => handleOutcome(labelB)}
          >
            {labelB} {priceB}¢
          </button>
        </div>

        {/* ════════════════════════════════════════════════════
            MODE 1 — MARKET + BUY
            Shows: Amount ($0) + quick add buttons
        ════════════════════════════════════════════════════ */}
        {orderType === "Market" && action === "Buy" && (
          <>
            <div className="tp-field-row">
              <span className="tp-field-label">Amount</span>
              <input
                type="text"
                inputMode="numeric"
                className="tp-shares-input"
                value={amount || ""}
                placeholder="$0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  setAmount(val === "" ? 0 : parseInt(val, 10))
                }}
              />
            </div>
            <div className="tp-quick-group">
              {[1, 5, 10, 100].map((v) => (
                <button key={v} className="tp-quick-btn" onClick={() => handleAmountAdd(v)}>
                  +${v}
                </button>
              ))}
              <button className="tp-quick-btn" onClick={() => handleAmountAdd("Max")}>
                Max
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MODE 2 — MARKET + SELL
            Shows: Shares (0) + 25%/50%/Max buttons
        ════════════════════════════════════════════════════ */}
        {orderType === "Market" && action === "Sell" && (
          <>
            <div className="tp-field-row">
              <span className="tp-field-label">Shares</span>
              <input
                type="text"
                inputMode="numeric"
                className="tp-shares-input"
                value={sellShares || ""}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  setSellShares(val === "" ? 0 : parseInt(val, 10))
                }}
              />
            </div>
            <div className="tp-pct-group">
              {["25%", "50%", "Max"].map((p) => (
                <button
                  key={p}
                  className={`tp-pct-btn${sellPct === p ? " active" : ""}`}
                  onClick={() => handleSellPct(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MODE 3 — LIMIT + BUY
            Shows: Limit price stepper + Shares input
                   + -100/-10/+10/+100/+200 buttons
                   + Set Expiration + Total + To win
        ════════════════════════════════════════════════════ */}
        {orderType === "Limit" && action === "Buy" && (
          <>
            {/* Limit price row */}
            <div className="tp-field-row">
              <span className="tp-field-label">Limit Price</span>
              <div className="tp-stepper-inline">
                <button
                  className="tp-stepper-btn"
                  onClick={() => setLimitCents((p) => Math.max(1, p - 1))}
                >
                  −
                </button>
                <span className="tp-stepper-val">{limitCents}¢</span>
                <button
                  className="tp-stepper-btn"
                  onClick={() => setLimitCents((p) => Math.min(99, p + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Shares input + adjust buttons */}
            <div className="tp-field-row">
              <span className="tp-field-label">Shares</span>
              <div className="tp-shares-input-wrap" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  className="tp-shares-input"
                  value={shares || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "")
                    setShares(val === "" ? 0 : parseInt(val, 10))
                  }}
                />
              </div>
            </div>
            <div className="tp-adjust-group">
              {[-100, -10, 10, 100, 200].map((d) => (
                <button key={d} className="tp-adjust-btn" onClick={() => handleSharesAdjust(d)}>
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>

            {/* Set Expiration */}
            <div className="tp-expiry">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>

            {/* Total */}
            <div className="tp-summary-row">
              <span className="tp-summary-label dotted">Total</span>
              <span className="tp-summary-value">${total}</span>
            </div>

            {/* To win */}
            <div className="tp-summary-row" style={{ marginBottom: 16 }}>
              <span className="tp-summary-label">
                To win <span className="tp-summary-info">i</span>
              </span>
              <span className="tp-summary-value green">💚 ${toWin}</span>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MODE 4 — LIMIT + SELL
            Shows: Limit price stepper + Shares input
                   + 25%/50%/Max buttons
                   + Set Expiration + You'll receive
        ════════════════════════════════════════════════════ */}
        {orderType === "Limit" && action === "Sell" && (
          <>
            {/* Limit price row */}
            <div className="tp-field-row">
              <span className="tp-field-label">Limit Price</span>
              <div className="tp-stepper-inline">
                <button
                  className="tp-stepper-btn"
                  onClick={() => setLimitCents((p) => Math.max(1, p - 1))}
                >
                  −
                </button>
                <span className="tp-stepper-val">{limitCents}¢</span>
                <button
                  className="tp-stepper-btn"
                  onClick={() => setLimitCents((p) => Math.min(99, p + 1))}
                >
                  +
                </button>
              </div>
            </div>

            {/* Shares input + pct shortcuts */}
            <div className="tp-field-row">
              <span className="tp-field-label">Shares</span>
              <div className="tp-shares-input-wrap" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  className="tp-shares-input"
                  value={shares || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "")
                    setShares(val === "" ? 0 : parseInt(val, 10))
                  }}
                />
              </div>
            </div>
            <div className="tp-pct-group">
              {["25%", "50%", "Max"].map((p) => (
                <button key={p} className="tp-pct-btn" onClick={() => handleLimitSellPct(p)}>
                  {p}
                </button>
              ))}
            </div>

            {/* Set Expiration */}
            <div className="tp-expiry">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>

            {/* You'll receive */}
            <div className="tp-summary-row" style={{ marginBottom: 16 }}>
              <span className="tp-summary-label">
                You'll receive <span className="tp-summary-info">i</span>
              </span>
              <span className="tp-summary-value green">💚 ${youReceive}</span>
            </div>
          </>
        )}

        {/* ── Trade button ── */}
        {/* Red when Sell, blue when Buy */}
        <button
          className={`tp-trade-btn${action === "Sell" ? " sell" : ""}`}
          onClick={() => {
            if (buttonState === "login") {
              onLoginRequired?.()
              return
            }
            if (buttonState === "deposit") {
              onDepositRequired?.()
              return
            }
            handleTrade()
          }}
        >
          {buttonState === "login" && "Trade"}
          {buttonState === "deposit" && "Deposit"}
          {buttonState === "trade" && "Trade"}
        </button>

        <div className="tp-terms">
          By trading, you agree to the <a>Terms of Use</a>.
        </div>
      </div>
    </div>
  )
}

export default TradePanel
