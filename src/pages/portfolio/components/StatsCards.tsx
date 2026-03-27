// src/pages/portfolio/components/StatsCards.tsx

import { formatCash } from "@/libs/formatCurrency"

import { PORTFOLIO_COLORS } from "../portfolioConstants"

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  subColor?: string
  icon: React.ReactNode
  iconBg: string
  cardBg?: string
}

const StatCard = ({ label, value, subValue, subColor, icon, iconBg, cardBg }: StatCardProps) => (
  <div
    style={{
      flex: 1,
      background: cardBg ?? PORTFOLIO_COLORS.CARD_BG,
      border: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0,
    }}
  >
    {/* label + icon row */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: PORTFOLIO_COLORS.TEXT_MUTED, fontWeight: 500 }}>
        {label}
      </span>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>

    {/* value */}
    <div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {subValue && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: subColor ?? PORTFOLIO_COLORS.TEXT_MUTED,
            marginTop: 6,
          }}
        >
          {subValue}
        </div>
      )}
    </div>
  </div>
)

interface StatsCardsProps {
  totalValue: number
  available: number
  pastMonthPnl: number
  pastMonthPct: number
  activePositions: number
  potentialValue: number
  onDeposit: () => void
  onWithdraw: () => void
}

export const StatsCards = ({
  totalValue,
  available,
  pastMonthPnl,
  pastMonthPct,
  activePositions,
  potentialValue,
}: StatsCardsProps) => {
  const pnlPositive = pastMonthPnl >= 0

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <StatCard
        label="Total Value"
        value={formatCash(totalValue)}
        icon="$"
        iconBg="rgba(59,130,246,0.2)"
      />
      <StatCard
        label="Available"
        value={formatCash(available)}
        icon="⚡"
        iconBg="rgba(139,92,246,0.2)"
      />
      <StatCard
        label="Past Month P/L"
        value={`${pnlPositive ? "+" : ""}${formatCash(pastMonthPnl)}`}
        subValue={`${pnlPositive ? "+" : ""}${pastMonthPct.toFixed(2)}%`}
        subColor={pnlPositive ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED}
        icon="↗"
        iconBg={pnlPositive ? "rgba(0,200,83,0.2)" : "rgba(229,57,53,0.2)"}
        cardBg={pnlPositive ? PORTFOLIO_COLORS.GREEN_CARD_BG : "rgba(229,57,53,0.04)"}
      />
      <StatCard
        label="Active Positions"
        value={String(activePositions)}
        subValue={`${formatCash(potentialValue)} potential`}
        subColor={PORTFOLIO_COLORS.TEXT_MUTED}
        icon="◈"
        iconBg="rgba(59,130,246,0.2)"
      />
    </div>
  )
}
