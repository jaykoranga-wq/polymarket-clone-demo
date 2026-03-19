// src/pages/portfolio/components/tabs/PositionsTab.tsx
// TODO: replace MOCK_POSITIONS with useGetPositionsQuery() when API ready

import { MOCK_POSITIONS, type Position } from "@/mocks/mockPortfolio"

import { PORTFOLIO_COLORS, POSITION_SIDE } from "../../portfolioConstants"

const COL = "1fr 80px 80px 80px 80px 110px 130px"

const ColHeader = ({ children, align = "left" }: { children: React.ReactNode; align?: string }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: PORTFOLIO_COLORS.TEXT_MUTED_2,
      textAlign: align as React.CSSProperties["textAlign"],
    }}
  >
    {children}
  </div>
)

const CategoryTag = ({ label, highlight }: { label: string; highlight?: boolean }) => (
  <span
    style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: highlight ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
      color: highlight ? "#f87171" : PORTFOLIO_COLORS.TEXT_MUTED,
      border: highlight ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.06)",
    }}
  >
    {label}
  </span>
)

const SidePill = ({ side }: { side: string }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      padding: "4px 10px",
      borderRadius: 20,
      background: side === POSITION_SIDE.YES ? "rgba(0,200,83,0.15)" : "rgba(229,57,53,0.15)",
      color: side === POSITION_SIDE.YES ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
      letterSpacing: "0.02em",
    }}
  >
    {side}
  </span>
)

const PnlDisplay = ({ position }: { position: Position }) => {
  const pnl = position.value - position.invested
  const pct = (pnl / position.invested) * 100
  const positive = pnl >= 0

  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: PORTFOLIO_COLORS.TEXT_PRIMARY,
        }}
      >
        ${position.value.toFixed(2)}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 3,
          fontSize: 11,
          fontWeight: 600,
          color: positive ? PORTFOLIO_COLORS.GREEN : PORTFOLIO_COLORS.RED,
          marginTop: 2,
        }}
      >
        <span>{positive ? "↗" : "↘"}</span>
        <span>
          {positive ? "+" : ""}
          {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toFixed(2)} ({positive ? "+" : ""}
          {pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

interface PositionsTabProps {
  search: string
  // TODO: positions: Position[]  ← from useGetPositionsQuery()
}

export const PositionsTab = ({ search }: PositionsTabProps) => {
  // TODO: replace with API data
  const positions = MOCK_POSITIONS.filter((p) =>
    p.marketTitle.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COL,
          gap: 8,
          padding: "0 16px 12px",
          borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
          alignItems: "center",
        }}
      >
        <ColHeader>Market</ColHeader>
        <ColHeader align="center">Side</ColHeader>
        <ColHeader align="right">Shares</ColHeader>
        <ColHeader align="right">Avg</ColHeader>
        <ColHeader align="right">Now</ColHeader>
        <ColHeader align="right">Invested</ColHeader>
        <ColHeader align="right">Value</ColHeader>
      </div>

      {/* rows */}
      {positions.length === 0 ? (
        <EmptyState label="No positions found." />
      ) : (
        positions.map((pos) => <PositionRow key={pos.id} position={pos} />)
      )}
    </div>
  )
}

const PositionRow = ({ position }: { position: Position }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: COL,
      gap: 8,
      padding: "16px",
      borderBottom: `1px solid ${PORTFOLIO_COLORS.CARD_BORDER}`,
      alignItems: "center",
      transition: "background 0.15s",
      cursor: "pointer",
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
          marginBottom: 6,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {position.marketTitle}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <CategoryTag label={position.category} />
        {position.tags?.map((tag) => (
          <CategoryTag key={tag} label={tag} highlight />
        ))}
      </div>
    </div>

    {/* side */}
    <div style={{ display: "flex", justifyContent: "center" }}>
      <SidePill side={position.side} />
    </div>

    {/* shares */}
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: PORTFOLIO_COLORS.TEXT_PRIMARY,
        textAlign: "right",
      }}
    >
      {position.shares.toLocaleString()}
    </div>

    {/* avg price */}
    <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
      {position.avgPrice.toFixed(2)}¢
    </div>

    {/* now price */}
    <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
      {position.nowPrice.toFixed(2)}¢
    </div>

    {/* invested */}
    <div style={{ fontSize: 14, color: PORTFOLIO_COLORS.TEXT_MUTED, textAlign: "right" }}>
      ${position.invested.toFixed(2)}
    </div>

    {/* value + pnl */}
    <PnlDisplay position={position} />
  </div>
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
