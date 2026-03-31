// src/pages/portfolio/PortfolioPage.tsx
// Main portfolio page — clean orchestration only, all UI in sub-components

import { useState } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router"

import { LoginModal } from "@/components/auth/LoginModal"
import { selectIsAuthenticated } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { MOCK_PORTFOLIO_CHART, MOCK_PORTFOLIO_STATS } from "@/mocks/mockPortfolio"

import { PortfolioChart } from "./components/PortfolioChart"
import { StatsCards } from "./components/StatsCards"
import { HistoryTab, PortfolioOrdersTab } from "./components/tabs/OrdersAndHistoryTabs"
import { PositionsTab } from "./components/tabs/PositionsTab"
import { PORTFOLIO_COLORS, PORTFOLIO_TABS, type PortfolioTab } from "./portfolioConstants"

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { key: PortfolioTab; label: string }[] = [
  { key: PORTFOLIO_TABS.POSITIONS, label: "Positions" },
  { key: PORTFOLIO_TABS.ORDERS, label: "Orders" },
  { key: PORTFOLIO_TABS.HISTORY, label: "History" },
]

// ─── PortfolioPage ────────────────────────────────────────────────────────────
const PortfolioPage = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { magic } = useMagic()
  const navigate = useNavigate()

  const [loginOpen, setLoginOpen] = useState(() => localStorage.getItem("isSignedIn") !== "true")
  const [activeTab, setActiveTab] = useState<PortfolioTab>(PORTFOLIO_TABS.POSITIONS)
  const [search, setSearch] = useState("")

  const handleLoginClose = () => {
    setLoginOpen(false)
    if (!isAuthenticated) navigate(-1)
  }

  const handleDeposit = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    await magic?.wallet.showUI()
  }

  // TODO: replace MOCK_PORTFOLIO_STATS with useGetPortfolioStatsQuery()
  const stats = MOCK_PORTFOLIO_STATS

  return (
    <>
      <LoginModal
        open={loginOpen}
        onClose={isAuthenticated ? () => setLoginOpen(false) : handleLoginClose}
      />

      <div
        style={{
          minHeight: "100vh",
          background: PORTFOLIO_COLORS.PAGE_BG,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
          {/* ── Page header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: PORTFOLIO_COLORS.TEXT_PRIMARY,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Portfolio
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: PORTFOLIO_COLORS.TEXT_MUTED,
                  margin: "6px 0 0",
                  fontWeight: 400,
                }}
              >
                Track your positions and performance
              </p>
            </div>

            {/* action buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ActionBtn onClick={handleDeposit} icon={<IconDeposit />} label="Deposit" />
              <ActionBtn onClick={() => {}} icon={<IconWithdraw />} label="Withdraw" />
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
                  background: PORTFOLIO_COLORS.CARD_BG,
                  color: PORTFOLIO_COLORS.TEXT_PRIMARY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IconMore />
              </button>
            </div>
          </div>

          {/* ── Stats cards ── */}
          <div style={{ marginBottom: 16 }}>
            <StatsCards
              totalValue={stats.totalValue}
              available={stats.available}
              pastMonthPnl={stats.pastMonthPnl}
              pastMonthPct={stats.pastMonthPct}
              activePositions={stats.activePositions}
              potentialValue={stats.potentialValue}
              onDeposit={handleDeposit}
              onWithdraw={() => {}}
            />
          </div>

          {/* ── Portfolio value chart ── */}
          <div style={{ marginBottom: 16 }}>
            <PortfolioChart
              data={MOCK_PORTFOLIO_CHART}
              portfolioValue={stats.portfolioValue}
              delta={stats.portfolioDelta}
              deltaPct={stats.portfolioDeltaPct}
            />
          </div>

          {/* ── Tabs + table ── */}
          <div
            style={{
              background: PORTFOLIO_COLORS.CARD_BG,
              border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* tab bar + search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 16px 0",
                borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {/* tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setActiveTab(t.key)
                      setSearch("")
                    }}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      background: activeTab === t.key ? PORTFOLIO_COLORS.GREEN : "transparent",
                      color: activeTab === t.key ? "#000" : PORTFOLIO_COLORS.TEXT_MUTED,
                      transition: "all 0.15s",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* filter + search */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
                    background: PORTFOLIO_COLORS.SURFACE,
                    color: PORTFOLIO_COLORS.TEXT_MUTED,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ⚙ Filter
                </button>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: PORTFOLIO_COLORS.TEXT_MUTED_2,
                      fontSize: 14,
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      background: PORTFOLIO_COLORS.SURFACE,
                      border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
                      borderRadius: 8,
                      padding: "7px 14px 7px 32px",
                      fontSize: 13,
                      color: PORTFOLIO_COLORS.TEXT_PRIMARY,
                      outline: "none",
                      width: 200,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* tab content */}
            <div style={{ padding: "16px 0 0" }}>
              {activeTab === PORTFOLIO_TABS.POSITIONS && <PositionsTab search={search} />}
              {activeTab === PORTFOLIO_TABS.ORDERS && <PortfolioOrdersTab search={search} />}
              {activeTab === PORTFOLIO_TABS.HISTORY && <HistoryTab search={search} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PortfolioPage

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({
  onClick,
  icon,
  label,
  variant = "solid",
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  variant?: "solid" | "outline"
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 18px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      border: `1px solid ${variant === "solid" ? PORTFOLIO_COLORS.CARD_BORDER : PORTFOLIO_COLORS.CARD_BORDER}`,
      background: variant === "solid" ? PORTFOLIO_COLORS.CARD_BG : "transparent",
      color: PORTFOLIO_COLORS.TEXT_PRIMARY,
      cursor: "pointer",
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
    onMouseLeave={(e) =>
      (e.currentTarget.style.background =
        variant === "solid" ? PORTFOLIO_COLORS.CARD_BG : "transparent")
    }
  >
    <span style={{ display: "flex", alignItems: "center" }}>{icon}</span> {label}
  </button>
)

// ── Icons ───────────────────────────────────────────────────────────────────
const IconDeposit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12 3V15M12 15L8 11M12 15L16 11"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const IconWithdraw = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12 15V3M12 3L8 7M12 3L16 7"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const IconMore = () => (
  <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="2" cy="8" r="1.5" fill="currentColor" />
    <circle cx="2" cy="14" r="1.5" fill="currentColor" />
  </svg>
)
