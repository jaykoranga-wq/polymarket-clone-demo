import "./tradePanel.css"

import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradePanelProps {
  yesProbability: number // 0–100
  noProbability: number
  isCrypto?: boolean // shows "Up/Down" instead of "Yes/No"
  onTrade?: (o: TradeOrder) => void
}

export interface TradeOrder {
  action: "Buy" | "Sell"
  outcome: "Yes" | "No" | "Up" | "Down"
  limitCents: number
  shares: number
  expirationEnabled: boolean
}

type Action = "Buy" | "Sell"
type PctShortcut = "25%" | "50%" | "Max"
type Interval = "5 Min" | "15 Min" | "1 Hour" | "1 Day"

// ─── Icon ─────────────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
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
}: TradePanelProps) => {
  const labelA = isCrypto ? "Up" : "Yes"
  const labelB = isCrypto ? "Down" : "No"
  const priceA = yesProbability
  const priceB = noProbability

  const [action, setAction] = useState<Action>("Buy")
  const [outcome, setOutcome] = useState(labelA)
  const [limitCents, setLimit] = useState(priceA)
  const [shares, setShares] = useState(0)
  const [pctActive, setPctActive] = useState<PctShortcut | null>(null)
  const [expiry, setExpiry] = useState(false)
  const [interval, setInterval] = useState<Interval>("1 Hour")

  const handleOutcome = (o: string) => {
    setOutcome(o)
    setLimit(o === labelA ? priceA : priceB)
    setPctActive(null)
    setShares(0)
  }

  const handlePct = (pct: PctShortcut) => {
    setPctActive(pct)
    const mockBalance = 500 // replace with real balance from Redux
    const price = limitCents / 100
    const map = { "25%": 0.25, "50%": 0.5, Max: 1 }
    setShares(parseFloat(((mockBalance * map[pct]) / price).toFixed(2)))
  }

  const handleTrade = () => {
    if (shares <= 0) return
    onTrade?.({
      action,
      outcome: outcome as TradeOrder["outcome"],
      limitCents,
      shares,
      expirationEnabled: expiry,
    })
  }

  const receive = shares > 0 ? `$${shares.toFixed(2)}` : "$0"

  return (
    <div className="tp ep">
      {" "}
      {/* ep gives access to CSS vars */}
      {/* ── Buy / Sell  +  Limit dropdown ── */}
      <div className="tp-top">
        <div className="tp-action-tabs">
          {(["Buy", "Sell"] as Action[]).map((a) => (
            <button
              key={a}
              className={`tp-action-tab${action === a ? " active" : ""}`}
              onClick={() => setAction(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="tp-order-type">
          Limit <ChevronDown />
        </div>
      </div>
      <div className="tp-divider" />
      <div className="tp-body">
        {/* ── YES / NO or Up / Down ── */}
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

        {/* ── Limit price stepper ── */}
        <div className="tp-label">Limit Price</div>
        <div className="tp-stepper">
          <button className="tp-stepper-btn" onClick={() => setLimit((p) => Math.max(1, p - 1))}>
            −
          </button>
          <div className="tp-stepper-val">{limitCents}¢</div>
          <button className="tp-stepper-btn" onClick={() => setLimit((p) => Math.min(99, p + 1))}>
            +
          </button>
        </div>

        {/* ── Shares ── */}
        <div className="tp-shares-row">
          <div className="tp-label" style={{ marginBottom: 0 }}>
            Shares
          </div>
          <div className="tp-shares-val">{shares > 0 ? shares : 0}</div>
        </div>
        <div className="tp-pct-group">
          {(["25%", "50%", "Max"] as PctShortcut[]).map((p) => (
            <button
              key={p}
              className={`tp-pct-btn${pctActive === p ? " active" : ""}`}
              onClick={() => handlePct(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Set Expiration ── */}
        <div className="tp-expiry">
          <span>Set Expiration</span>
          <div className={`tp-switch${expiry ? " on" : ""}`} onClick={() => setExpiry((p) => !p)}>
            <div className="tp-switch-knob" />
          </div>
        </div>

        {/* ── You'll receive ── */}
        <div className="tp-receive">
          <div className="tp-receive-label">
            You'll receive
            <span className="tp-receive-info">i</span>
          </div>
          <div className="tp-receive-value">💵 {receive}</div>
        </div>

        {/* ── Trade button ── */}
        <button className="tp-trade-btn" onClick={handleTrade} disabled={shares <= 0}>
          Trade
        </button>

        <div className="tp-terms">
          By trading, you agree to the <a>Terms of Use</a>.
        </div>
      </div>
      {/* ── Interval tabs — crypto only ── */}
      {isCrypto && (
        <div className="tp-intervals">
          {(["5 Min", "15 Min", "1 Hour", "1 Day"] as Interval[]).map((t) => (
            <button
              key={t}
              className={`tp-interval-tab${interval === t ? " active" : ""}`}
              onClick={() => setInterval(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TradePanel
