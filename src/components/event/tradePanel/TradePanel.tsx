import "./TradePanel.css"

import { TrendingUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

import { useAppSelector } from "@/app/hooks"
import { selectAvailableAmount, selectIsAuthenticated } from "@/features/auth/authSlice"
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

  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const availableAmount = useAppSelector(selectAvailableAmount)
  const balance = availableAmount ?? "0"
  const buttonState = !isAuthenticated ? "login" : BigInt(balance) <= 0n ? "deposit" : "trade"

  // ── Core state ──────────────────────────────────────────────────────────────
  const [action, setAction] = useState<Action>("Buy")
  const [orderType, setOrderType] = useState<OrderType>("Limit")
  const [outcome, setOutcome] = useState(labelA)
  const [dropOpen, setDropOpen] = useState(false)
  const [activePct, setActivePct] = useState<string | null>(null)
  const navigate = useNavigate()

  // ── Market Buy ──────────────────────────────────────────────────────────────
  const [amount, setAmount] = useState(0)

  // ── Market Sell ─────────────────────────────────────────────────────────────
  const [sellShares, setSellShares] = useState(0)
  const [sellPct, setSellPct] = useState<string | null>(null)

  // ── Limit state ──
  const [limitCents, setLimitCents] = useState(priceA)
  const [shares, setShares] = useState(0)
  const [expiry, setExpiry] = useState(false)
  const [expiryDuration, setExpiryDuration] = useState("7 Days")
  const [expiryDropOpen, setExpiryDropOpen] = useState(false)

  const handleAction = (a: Action) => {
    setAction(a)
    setAmount(0)
    setSellShares(0)
    setSellPct(null)
    setShares(0)
    setExpiry(false)
    setExpiryDropOpen(false)
    setActivePct(null)
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
    setExpiryDropOpen(false)
    setActivePct(null)
  }
  const handleOutcome = (o: string) => {
    setOutcome(o)
    setLimitCents(o === labelA ? priceA : priceB)
    setAmount(0)
    setSellShares(0)
    setShares(0)
    setActivePct(null)
  }

  // close dropdown on outside click
  const dropRef = useRef<HTMLDivElement>(null)
  const expiryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (expiryRef.current && !expiryRef.current.contains(e.target as Node))
        setExpiryDropOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Market Buy: percentage presets ──
  const handlePctPreset = (pct: string) => {
    setActivePct(pct)
    const map: Record<string, number> = {
      MIN: 0.01,
      "10%": 0.1,
      "20%": 0.2,
      "30%": 0.3,
      "40%": 0.4,
      "50%": 0.5,
      MAX: 1.0,
    }
    // Convert micro-USDC string to dollar number for the UI input
    const balanceDollars = Number(BigInt(balance)) / 1_000_000
    setAmount(Math.floor(balanceDollars * (map[pct] ?? 0)))
  }

  // ── Market Sell: pct of holdings ──
  const handleSellPct = (pct: string) => {
    setSellPct(pct)
    const mockHoldings = 200 // TODO: replace with Redux holdings
    const map: Record<string, number> = {
      MIN: 0.01,
      "25%": 0.25,
      "50%": 0.5,
      MAX: 1,
      Max: 1,
    }
    setSellShares(parseFloat((mockHoldings * (map[pct] ?? 0)).toFixed(2)))
  }

  // ── Limit: shares adjust ──
  const handleSharesAdjust = (delta: number) => {
    setShares((p) => Math.max(0, p + delta))
  }

  // ── Limit: pct shortcuts (Sell) ──
  const handleLimitSellPct = (pct: string) => {
    const mockHoldings = 200
    const map: Record<string, number> = { "25%": 0.25, "50%": 0.5, Max: 1 }
    setShares(parseFloat((mockHoldings * (map[pct] ?? 0)).toFixed(2)))
  }

  // ── Computed values ──
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
    <div className="border border-white/10  bg-linear-to-b from-white/5 to-white/2  font-inter rounded-2xl max-w-[436px] min-w-[313px] overflow-hidden ">
      {/* ── Top: Place Bet + Buy/Sell + Order Type ── */}
      <div className="flex items-end justify-between p-6 pt-4.5 gap-2">
        <div className="flex flex-col gap-2.5">
          <h2 className="tp-title">Place Bet</h2>
          <div className="tp-action-tabs">
            {(["Buy", "Sell"] as Action[]).map((a) => (
              <button
                key={a}
                className={`tp-action-tab${a === "Sell" ? " sell" : ""}${action === a ? " active" : ""}`}
                onClick={() => handleAction(a)}
              >
                {a.toUpperCase()}
              </button>
            ))}
          </div>
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
        {/* {isAuthenticated && (
          <div className="tp-balance-row">
            Balance: <strong>{formatCash(balance)}</strong>
          </div>
        )} */}

        {/* ── YES / NO outcome buttons ── */}

        <div className="flex justify-between gap-2 items-center mb-3">
          <button
            className={`flex-1 h-12.5 border rounded-sm font-bold transition-all active:scale-95 ${
              outcome === labelA
                ? "bg-primary text-background border-primary"
                : "bg-option-yes border-yes/20 text-primary hover:bg-primary hover:text-background"
            }`}
            onClick={() => handleOutcome(labelA)}
          >
            {labelA} {priceA}¢
          </button>
          <button
            className={`flex-1 h-12.5 border rounded-sm font-bold transition-all active:scale-95 ${
              outcome === labelB
                ? "bg-no text-background border-no"
                : "bg-option-no border-no/20 text-no hover:bg-no hover:text-background"
            }`}
            onClick={() => handleOutcome(labelB)}
          >
            {labelB} {priceB}¢
          </button>
        </div>

        {/* ══════════════════════════════════════
            MODE 1 — MARKET + BUY
            Amount input + pct shortcuts
        ══════════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════
            MARKET + BUY
        ════════════════════════════════════════════════════ */}
        {orderType === "Market" && action === "Buy" && (
          <>
            {/* Amount header */}
            <div className="tp-amount-header">
              <span className="font-base font-bold uppercase text-white">Amount</span>
              <span className=" font-sm text-white text-nowrap">
                Balance: {formatCash(balance)}
              </span>
            </div>

            {/* YES / NO */}
            {/* <div className="flex justify-between gap-2 items-center mb-3">
              <button
                className={`flex-1 bg-option-yes h-12.5 border rounded-sm border-yes/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95${outcome === labelA ? " active" : ""}`}
                onClick={() => handleOutcome(labelA)}
              >
                {labelA}
              </button>
              <button
                className={`flex-1 bg-option-no h-12.5 border rounded-sm border-no/20 text-no font-bold hover:bg-no hover:text-background transition-all active:scale-95${outcome === labelB ? " active" : ""}`}
                onClick={() => handleOutcome(labelB)}
              >
                {labelB}
              </button>
            </div> */}

            {/* Amount input box */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-md py-3 px-4 mb-3 ">
              <input
                type="text"
                inputMode="decimal"
                className="text-xl focus:outline-none font-semibold text-white w-full placeholder:text-white "
                value={amount || ""}
                placeholder="0.00"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "")
                  setAmount(val === "" ? 0 : parseFloat(val))
                  setActivePct(null)
                }}
              />
              <span className="font-sm font-medium text-muted-foreground shrink-0 ml-3">USD</span>
            </div>

            {/* Percentage presets */}
            <div className="flex gap-1 mb-5 overflow-hidden">
              {["MIN", "10%", "20%", "30%", "40%", "50%", "MAX"].map((p) => (
                <button
                  key={p}
                  className={`flex-1 p-1.5 font-xxs xl:font-xs bg-slate font-semibold text-white border rounded-md cursor-pointer transition-all duration-200  hover:bg-white/5 hover-text-white active:text-white active:bg-green-500/15
                     ;${activePct === p ? " active" : ""}`}
                  onClick={() => handlePctPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            MARKET + SELL
        ════════════════════════════════════════════════════ */}
        {orderType === "Market" && action === "Sell" && (
          <>
            {/* <div className=" flex justify-between gap-2 items-center mb-3">
              <button
                className={`w-full flex-1 bg-option-yes h-12.5 border rounded-sm border-yes/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95${outcome === labelA ? " active" : ""}`}
                onClick={() => handleOutcome(labelA)}
              >
                {labelA}
              </button>
              <button
                className={`w-full flex-1 bg-option-no h-12.5 border rounded-sm border-no/20 text-no font-bold hover:bg-no hover:text-background transition-all active:scale-95${outcome === labelB ? " active" : ""}`}
                onClick={() => handleOutcome(labelB)}
              >
                {labelB}
              </button>
            </div> */}
            <div className="tp-field-row">
              <span className=" font-sm font-semibold text-white  ">Shares</span>
              <input
                type="text"
                inputMode="numeric"
                className=" bg-white/5 w-45/100  border border-white/10 rounded-md py-2 px-3 font-semibold text-white outline-none transition-all duration-300 placeholder:text-white"
                value={sellShares || ""}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  setSellShares(val === "" ? 0 : parseInt(val, 10))
                }}
              />
            </div>
            <div className="flex gap-1 mb-5 overflow-hidden">
              {["MIN", "25%", "50%", "MAX"].map((p) => (
                <button
                  key={p}
                  className={`flex-1 py-1.5 font-xs bg-slate font-semibold text-white border rounded-md cursor-pointer transition-all duration-200  hover:bg-white/5 hover-text-white active:text-white active:bg-green-500/15
                    ${sellPct === p ? " active" : ""}`}
                  onClick={() => handleSellPct(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            LIMIT + BUY
        ════════════════════════════════════════════════════ */}
        {orderType === "Limit" && action === "Buy" && (
          <>
            {/* <div className="flex justify-between gap-2 items-center mb-3">
              <button
                className={`w-full flex-1 bg-option-yes h-12.5 border rounded-sm border-yes/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95${outcome === labelA ? " active" : ""}`}
                onClick={() => handleOutcome(labelA)}
              >
                {labelA}
              </button>
              <button
                className={`w-full flex-1 bg-option-no h-12.5 border rounded-sm border-no/20 text-no font-bold hover:bg-no hover:text-background transition-all active:scale-95${outcome === labelB ? " active" : ""}`}
                onClick={() => handleOutcome(labelB)}
              >
                {labelB}
              </button>
            </div> */}

            <div className="tp-field-row">
              <span className="  font-semibold text-white">Limit Price</span>
              <div className="flex items-center gap-2.5 py-3 px-2 rounded-md w-45/100 justify-between bg-white/5 border border-white/10">
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
              <span className="  font-semibold text-white">Shares</span>
              <div
                className="flex w-45/100 items-center bg-white/5 border border-white/10 rounded-md py-3 px-4 mb-3"
                style={{ marginBottom: 0 }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  className="text-xl focus:outline-none font-semibold text-white w-full placeholder:text-white"
                  value={shares || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "")
                    setShares(val === "" ? 0 : parseInt(val, 10))
                  }}
                />
              </div>
            </div>
            <div className="flex gap-1 mb-5 overflow-hidden">
              {[-100, -10, 10, 100, 200].map((d) => (
                <button
                  key={d}
                  className="flex-1 p-1.5 font-xs bg-slate font-semibold text-white border rounded-md cursor-pointer transition-all duration-200  hover:bg-white/5 hover-text-white active:text-white active:bg-green-500/15"
                  onClick={() => handleSharesAdjust(d)}
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between font-base font-bold uppercase mb-2">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>

            {expiry && (
              <div className="tp-expiry-box" ref={expiryRef}>
                <div
                  className="tp-expiry-select-custom"
                  onClick={() => setExpiryDropOpen((p) => !p)}
                >
                  <span>In {expiryDuration}</span>
                  <div className="tp-expiry-chevron">
                    <ChevronDown />
                  </div>
                </div>
                {expiryDropOpen && (
                  <div className="tp-expiry-menu">
                    {["1 Day", "7 Days", "30 Days", "Custom"].map((d) => (
                      <button
                        key={d}
                        className={`tp-expiry-item${expiryDuration === d ? " active" : ""}`}
                        onClick={() => {
                          setExpiryDuration(d)
                          setExpiryDropOpen(false)
                        }}
                      >
                        In {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 bg-black border border-border rounded-md p-4 mb-4 ">
              <div className="tp-summary-row">
                <span className="tp-summary-label ">Total</span>
                <span className="font-sm font-bold text-white">${total}</span>
              </div>

              <div className="tp-summary-row">
                <span className="tp-summary-label">To win</span>
                <span className="font-sm font-semibold text-primary">${toWin}</span>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            LIMIT + SELL
        ════════════════════════════════════════════════════ */}
        {orderType === "Limit" && action === "Sell" && (
          <>
            {/* <div className="flex justify-between gap-2 items-center mb-3">
              <button
                className={`w-full flex-1 bg-option-yes h-12.5 border rounded-sm border-yes/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95${outcome === labelA ? " active" : ""}`}
                onClick={() => handleOutcome(labelA)}
              >
                {labelA}
              </button>
              <button
                className={`w-full flex-1 bg-option-no h-12.5 border rounded-sm border-no/20 text-no font-bold hover:bg-no hover:text-background transition-all active:scale-95${outcome === labelB ? " active" : ""}`}
                onClick={() => handleOutcome(labelB)}
              >
                {labelB}
              </button>
            </div> */}

            <div className="tp-field-row">
              <span className=" font-semibold text-white">Limit Price</span>
              <div className="flex items-center gap-2.5 py-3 px-2 rounded-md justify-between w-45/100 bg-white/5 border border-white/10">
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
              <span className="font-semibold text-white">Shares</span>
              <div
                className="flex w-45/100 items-center bg-white/5 border border-white/10 rounded-md py-3 px-4 mb-3"
                style={{ marginBottom: 0 }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  className="text-xl focus:outline-none font-semibold text-white w-full placeholder:text-white"
                  value={shares || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "")
                    setShares(val === "" ? 0 : parseInt(val, 10))
                  }}
                />
              </div>
            </div>
            <div className="flex gap-1 mb-5 overflow-hidden">
              {["25%", "50%", "Max"].map((p) => (
                <button
                  key={p}
                  className="flex-1 p-1.5 font-xs bg-slate font-semibold text-white border rounded-md cursor-pointer transition-all duration-200  hover:bg-white/5 hover-text-white active:text-white active:bg-green-500/15"
                  onClick={() => handleLimitSellPct(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between font-base font-bold uppercase mb-2">
              <span>Set Expiration</span>
              <div
                className={`tp-switch${expiry ? " on" : ""}`}
                onClick={() => setExpiry((p) => !p)}
              >
                <div className="tp-switch-knob" />
              </div>
            </div>

            {expiry && (
              <div className="tp-expiry-box" ref={expiryRef}>
                <div
                  className="tp-expiry-select-custom"
                  onClick={() => setExpiryDropOpen((p) => !p)}
                >
                  <span>In {expiryDuration}</span>
                  <div className="tp-expiry-chevron">
                    <ChevronDown />
                  </div>
                </div>
                {expiryDropOpen && (
                  <div className="tp-expiry-menu">
                    {["1 Day", "7 Days", "30 Days", "Custom"].map((d) => (
                      <button
                        key={d}
                        className={`tp-expiry-item${expiryDuration === d ? " active" : ""}`}
                        onClick={() => {
                          setExpiryDuration(d)
                          setExpiryDropOpen(false)
                        }}
                      >
                        In {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="tp-summary-row" style={{ marginBottom: 16 }}>
              <span className="tp-summary-label">You'll receive</span>
              <span className="font-sm font-semibold text-primary"> ${youReceive}</span>
            </div>
          </>
        )}

        {/* ── Place Order button ── */}
        <button
          className={`w-full p-3.5 rounded-2md font-deafult font-black cursor-pointer bg-primary text-black transition-all duration-300 shadow-[0px_4px_6px_-4px_#10D26033,0px_10px_15px_-3px_#10D26033] mb-3 flex items-center justify-center gap-2 ${action === "Sell" ? " sell" : ""}`}
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
          <TrendingUp />
        </button>

        <div
          className="text-center font-sm text-white "
          onClick={() => {
            navigate("/terms")
          }}
        >
          By trading, you agree to the <a className="underline">Terms of Use</a>.
        </div>
      </div>
    </div>
  )
}

export default TradePanel
