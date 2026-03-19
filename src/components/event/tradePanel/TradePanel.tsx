import "./TradePanel.css"

import { useEffect, useRef, useState } from "react"

import { useAppSelector } from "@/app/hooks"
import { useDebouncedCallback } from "@/hooks/custom/useDebounce"
import type { TradePanelOrder } from "@/hooks/trade/TradeTypes"
import { formatCash } from "@/libs/formatCurrency"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradePanelProps {
  yesProbability: number // 0–100 (cents)
  noProbability: number
  isCrypto?: boolean // "Up/Down" labels instead of "Yes/No"
  onTrade?: (o: TradePanelOrder) => void
  onLoginRequired?: () => void
  onDepositRequired?: () => void
  approvalState?: "idle" | "approving-usdc" | "approving-ctf" | "signing" | "submitting"
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
  approvalState = "idle",
}: TradePanelProps) => {
  const labelA = isCrypto ? "Up" : "Yes"
  const labelB = isCrypto ? "Down" : "No"
  const priceA = yesProbability
  const priceB = noProbability

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const availableAmount = useAppSelector((s) => s.auth.availableAmount)
  const balance = availableAmount ?? 0
  const buttonState = !isAuthenticated ? "login" : balance <= 0 ? "deposit" : "trade"

  // ── Core state ──────────────────────────────────────────────────────────────
  const [action, setAction] = useState<Action>("Buy")
  const [orderType, setOrderType] = useState<OrderType>("Limit")
  const [outcome, setOutcome] = useState(labelA)
  const [dropOpen, setDropOpen] = useState(false)

  // ── Market Buy ──────────────────────────────────────────────────────────────
  const [amount, setAmount] = useState(0)

  // ── Market Sell ─────────────────────────────────────────────────────────────
  const [sellShares, setSellShares] = useState(0)
  const [sellPct, setSellPct] = useState<string | null>(null)

  // ── Limit (Buy + Sell) ──────────────────────────────────────────────────────
  const [limitCents, setLimitCents] = useState(priceA)
  const [shares, setShares] = useState(0)
  const [expiry, setExpiry] = useState(false)

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

  // close dropdown on outside click
  const dropRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Pct shortcuts ────────────────────────────────────────────────────────────
  const PCT_MAP: Record<string, number> = {
    MIN: 0.05,
    "10%": 0.1,
    "20%": 0.2,
    "30%": 0.3,
    "40%": 0.4,
    "50%": 0.5,
    MAX: 1,
  }
  const SELL_MAP: Record<string, number> = { "25%": 0.25, "50%": 0.5, Max: 1 }

  const handleAmountPct = (key: string) => {
    setAmount(Math.floor(balance * (PCT_MAP[key] ?? 0)))
  }
  const handleSellPct = (p: string) => {
    setSellPct(p)
    const holdings = 200 // TODO: replace with Redux holdings
    setSellShares(parseFloat((holdings * (SELL_MAP[p] ?? 0)).toFixed(2)))
  }
  const handleSharesAdjust = (d: number) => setShares((p) => Math.max(0, p + d))
  const handleLimitSellPct = (p: string) => {
    const holdings = 200
    setShares(parseFloat((holdings * (SELL_MAP[p] ?? 0)).toFixed(2)))
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const total = shares > 0 ? ((shares * limitCents) / 100).toFixed(2) : "0"
  const toWin = shares > 0 ? shares.toFixed(2) : "0"
  const youReceive = shares > 0 ? ((shares * limitCents) / 100).toFixed(2) : "0"

  const tradeDisabled =
    (action === "Buy" && orderType === "Market" && amount <= 0) ||
    (action === "Sell" && orderType === "Market" && sellShares <= 0) ||
    (orderType === "Limit" && shares <= 0)

  const handleTrade = () => {
    if (tradeDisabled) return

    onTrade?.({
      action,
      orderType,
      outcome: outcome as TradePanelOrder["outcome"],
      amount: action === "Buy" && orderType === "Market" ? amount : undefined,
      shares: action === "Sell" && orderType === "Market" ? sellShares : shares,
      limitCents: orderType === "Limit" ? limitCents : undefined,
      expirationEnabled: expiry,
    })
    handleAction(action)
  }
  //debounced handle trade for one click only...
  const debouncedHandleTrade = useDebouncedCallback(handleTrade, 500)

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="tp">
      {/* ── "Place Bet" title ── */}
      <div className="tp-header-title">Place Bet</div>

      {/* ── BUY / SELL + Market dropdown ── */}
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

        <div className="tp-dropdown-wrap" ref={dropRef}>
          <div className="tp-order-type" onClick={() => setDropOpen((p) => !p)}>
            {orderType} <ChevronDown />
          </div>
          {dropOpen && (
            <div className="tp-dropdown-menu">
              {/* commenting market for now as it is not made currently , but if market is ready please add it below .... */}

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
        {/* ── Balance row ── */}
        {isAuthenticated && (
          <div className="tp-balance-row">
            Balance: <strong>{formatCash(balance)}</strong>
          </div>
        )}

        {/* ── YES / NO outcome buttons ── */}
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

        {/* ══════════════════════════════════════
            MODE 1 — MARKET + BUY
            Amount input + pct shortcuts
        ══════════════════════════════════════ */}
        {orderType === "Market" && action === "Buy" && (
          <>
            {/* Amount input with USD suffix */}
            <div className="tp-amount-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={amount || ""}
                placeholder="0.00"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "")
                  setAmount(val === "" ? 0 : parseFloat(val) || 0)
                }}
              />
              <span className="tp-amount-suffix">USD</span>
            </div>
            {/* MIN / 10% / 20% / 30% / 40% / 50% / MAX */}
            <div className="tp-pct-group">
              {["MIN", "10%", "20%", "30%", "40%", "50%", "MAX"].map((v) => (
                <button key={v} className="tp-pct-btn" onClick={() => handleAmountPct(v)}>
                  {v}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            MODE 2 — MARKET + SELL
            Shares input + 25%/50%/Max
        ══════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════
            MODE 3 — LIMIT + BUY
        ══════════════════════════════════════ */}
        {orderType === "Limit" && action === "Buy" && (
          <>
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
            <div className="tp-field-row">
              <span className="tp-field-label">Shares</span>
              <div className="tp-shares-input-wrap">
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
            <div className="tp-expiry">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>
            <div className="tp-summary-row">
              <span className="tp-summary-label dotted">Total</span>
              <span className="tp-summary-value">${total}</span>
            </div>
            <div className="tp-summary-row">
              <span className="tp-summary-label">
                To win <span className="tp-summary-info">i</span>
              </span>
              <span className="tp-summary-value green">💚 ${toWin}</span>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            MODE 4 — LIMIT + SELL
        ══════════════════════════════════════ */}
        {orderType === "Limit" && action === "Sell" && (
          <>
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
            <div className="tp-field-row">
              <span className="tp-field-label">Shares</span>
              <div className="tp-shares-input-wrap">
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
            <div className="tp-expiry">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>
            <div className="tp-summary-row">
              <span className="tp-summary-label">
                You'll receive <span className="tp-summary-info">i</span>
              </span>
              <span className="tp-summary-value green">💚 ${youReceive}</span>
            </div>
          </>
        )}

        {/* ── Place Order button ── */}
        <button
          className={`tp-trade-btn${action === "Sell" ? " sell" : ""}${buttonState === "deposit" ? " deposit" : ""}`}
          disabled={approvalState !== "idle" || (buttonState === "trade" && tradeDisabled)}
          onClick={() => {
            if (buttonState === "login") {
              onLoginRequired?.()
              return
            }
            if (buttonState === "deposit") {
              onDepositRequired?.()
              return
            }
            debouncedHandleTrade()
          }}
        >
          {/* spinner — only shown when processing */}
          {approvalState !== "idle" && <span className="tp-spinner" />}

          {/* label */}
          {buttonState === "login" && "Place Order"}
          {buttonState === "deposit" && "Deposit"}
          {buttonState === "trade" &&
            {
              idle: "Place Order",
              "approving-usdc": "Approving USDC...",
              "approving-ctf": "Approving shares...",
              signing: "Sign in wallet...",
              submitting: "Submitting...",
            }[approvalState]}
        </button>

        <div className="tp-terms">
          By trading, you agree to the <a>Terms of Use</a>.
        </div>
      </div>
    </div>
  )
}

export default TradePanel
