// src/pages/leaderboard/LeaderboardPage.tsx
// TODO: replace mock data with useGetLeaderboardQuery() when API ready

import { useState } from "react"

import { type LeaderboardEntry, MOCK_LEADERBOARD } from "@/mocks/mockPages"

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f13",
  surface: "#161a22",
  border: "rgba(255,255,255,0.07)",
  green: "#00c853",
  red: "#e53935",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  muted2: "rgba(255,255,255,0.25)",
  gold: "#fbbf24",
  silver: "#94a3b8",
  bronze: "#cd7c54",
} as const

const TIME_FILTERS = ["All Time", "This Month", "This Week"] as const
type TimeFilter = (typeof TIME_FILTERS)[number]

// ── Rank medal ────────────────────────────────────────────────────────────────
const RankDisplay = ({ rank }: { rank: number }) => {
  const medals: Record<number, { color: string; icon: string }> = {
    1: { color: C.gold, icon: "🥇" },
    2: { color: C.silver, icon: "🥈" },
    3: { color: C.bronze, icon: "🥉" },
  }
  const medal = medals[rank]

  if (medal) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 20 }}>{medal.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: medal.color }}>#{rank}</span>
      </div>
    )
  }

  return <span style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>#{rank}</span>
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed, #db2777)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.35,
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0,
    }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
)

// ── Top 3 podium ──────────────────────────────────────────────────────────────
const PodiumCard = ({ entry, height }: { entry: LeaderboardEntry; height: number }) => {
  const medals = ["🥇", "🥈", "🥉"]
  const colors = [C.gold, C.silver, C.bronze]
  const idx = entry.rank - 1

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 28 }}>{medals[idx]}</span>
      <Avatar name={entry.displayName} size={48} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{entry.displayName}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{entry.address}</div>
      </div>
      <div
        style={{
          width: "100%",
          height: height,
          background: `${colors[idx]}22`,
          border: `1px solid ${colors[idx]}44`,
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: colors[idx] }}>
          ${(entry.profitLoss / 1000).toFixed(1)}k
        </span>
        <span style={{ fontSize: 10, color: C.muted2 }}>P/L</span>
      </div>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────
const LeaderRow = ({ entry }: { entry: LeaderboardEntry }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr 100px 100px 100px 110px",
      gap: 8,
      padding: "14px 20px",
      alignItems: "center",
      borderBottom: `1px solid ${C.border}`,
      background: entry.isCurrentUser ? "rgba(0,200,83,0.05)" : "transparent",
      border: entry.isCurrentUser ? `1px solid rgba(0,200,83,0.2)` : `none`,
      borderRadius: entry.isCurrentUser ? 10 : 0,
      transition: "background 0.15s",
      position: "relative",
    }}
    onMouseEnter={(e) => {
      if (!entry.isCurrentUser) e.currentTarget.style.background = "rgba(255,255,255,0.02)"
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = entry.isCurrentUser ? "rgba(0,200,83,0.05)" : "transparent"
    }}
  >
    {entry.isCurrentUser && (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: "60%",
          background: C.green,
          borderRadius: "0 2px 2px 0",
        }}
      />
    )}

    {/* rank */}
    <RankDisplay rank={entry.rank} />

    {/* user */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Avatar name={entry.displayName} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: entry.isCurrentUser ? 800 : 600,
            color: entry.isCurrentUser ? C.green : C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.displayName}
          {entry.isCurrentUser && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
                background: "rgba(0,200,83,0.15)",
                color: C.green,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              You
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{entry.address}</div>
      </div>
    </div>

    {/* volume */}
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>
      ${(entry.volume / 1000).toFixed(1)}k
    </div>

    {/* p/l */}
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: entry.profitLoss >= 0 ? C.green : C.red,
        textAlign: "right",
      }}
    >
      {entry.profitLoss >= 0 ? "+" : ""}${(entry.profitLoss / 1000).toFixed(1)}k
    </div>

    {/* win rate */}
    <div style={{ fontSize: 13, color: C.muted, textAlign: "right" }}>{entry.winRate}%</div>

    {/* trades */}
    <div style={{ fontSize: 13, color: C.muted, textAlign: "right" }}>{entry.trades}</div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
const LeaderboardPage = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All Time")

  // TODO: const { data: entries = [] } = useGetLeaderboardQuery({ period: timeFilter })
  const entries = MOCK_LEADERBOARD
  const top3 = entries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank)
  const rest = entries.filter((e) => e.rank > 3)
  const currentUser = entries.find((e) => e.isCurrentUser)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{ fontSize: 32, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}
            >
              Leaderboard
            </h1>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
              Top predictors ranked by profit
            </p>
          </div>

          {/* time filter */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 4,
            }}
          >
            {TIME_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  background: timeFilter === f ? C.green : "transparent",
                  color: timeFilter === f ? "#000" : C.muted,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* your rank banner */}
        {currentUser && (
          <div
            style={{
              background: "rgba(0,200,83,0.06)",
              border: "1px solid rgba(0,200,83,0.2)",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.green,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Your Rank
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.green }}>
              #{currentUser.rank}
            </span>
            <span style={{ fontSize: 13, color: C.muted }}>
              {currentUser.winRate}% win rate · ${(currentUser.volume / 1000).toFixed(1)}k volume ·
              +${(currentUser.profitLoss / 1000).toFixed(1)}k profit
            </span>
          </div>
        )}

        {/* podium top 3 */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "28px 24px 0",
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center" }}
          >
            {/* 2nd → 1st → 3rd podium order */}
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => (
              <PodiumCard
                key={entry?.rank}
                entry={entry as LeaderboardEntry}
                height={i === 1 ? 90 : i === 0 ? 70 : 55}
              />
            ))}
          </div>
        </div>

        {/* main table */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 100px 100px 100px 110px",
              gap: 8,
              padding: "12px 20px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {["Rank", "Trader", "Volume", "P/L", "Win Rate", "Trades"].map((h, i) => (
              <div
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: C.muted2,
                  textAlign: i > 1 ? "right" : ("left" as React.CSSProperties["textAlign"]),
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* rows */}
          {rest.map((entry) => (
            <LeaderRow key={entry.rank} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
