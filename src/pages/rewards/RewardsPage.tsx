// src/pages/rewards/RewardsPage.tsx
// TODO: replace mock data with useGetRewardsQuery() when API ready

import { useState } from "react"

import { MOCK_REWARDS, MOCK_REWARDS_SUMMARY, type RewardItem } from "@/mocks/mockPages"

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f13",
  surface: "#161a22",
  border: "rgba(255,255,255,0.07)",
  green: "#00c853",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  muted2: "rgba(255,255,255,0.25)",
} as const

const CATEGORY_FILTERS = ["all", "trading", "accuracy", "social", "milestone"] as const
type Filter = (typeof CATEGORY_FILTERS)[number]

// ── XP Progress bar ───────────────────────────────────────────────────────────
const XPCard = () => {
  const { level, nextLevelXp, currentXp, completed, total } = MOCK_REWARDS_SUMMARY
  const pct = Math.round((currentXp / nextLevelXp) * 100)

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(0,200,83,0.12) 0%, rgba(0,200,83,0.04) 100%)`,
        border: `1px solid rgba(0,200,83,0.2)`,
        borderRadius: 16,
        padding: 28,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 32,
        flexWrap: "wrap",
      }}
    >
      {/* level badge */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "rgba(0,200,83,0.15)",
          border: "3px solid rgba(0,200,83,0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: "0.1em" }}>
          LVL
        </span>
        <span style={{ fontSize: 26, fontWeight: 900, color: C.green, lineHeight: 1 }}>
          {level}
        </span>
      </div>

      {/* xp progress */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
            {currentXp.toLocaleString()} XP
          </span>
          <span style={{ fontSize: 13, color: C.muted }}>
            {nextLevelXp.toLocaleString()} XP to Level {level + 1}
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: `linear-gradient(90deg, ${C.green}, rgba(0,200,83,0.6))`,
              transition: "width 0.8s ease",
              boxShadow: `0 0 12px rgba(0,200,83,0.4)`,
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{pct}% to next level</div>
      </div>

      {/* completed count */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>
          {completed}/{total}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>challenges done</div>
      </div>
    </div>
  )
}

// ── Reward card ───────────────────────────────────────────────────────────────
const RewardCard = ({ item }: { item: RewardItem }) => (
  <div
    style={{
      background: item.completed ? "rgba(0,200,83,0.04)" : C.surface,
      border: `1px solid ${item.completed ? "rgba(0,200,83,0.2)" : C.border}`,
      borderRadius: 14,
      padding: 20,
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      opacity: item.completed ? 0.85 : 1,
    }}
  >
    {/* icon */}
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: item.completed ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {item.icon}
    </div>

    {/* content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.title}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: item.completed ? C.green : "rgba(255,255,255,0.5)",
            background: item.completed ? "rgba(0,200,83,0.12)" : "rgba(255,255,255,0.06)",
            padding: "3px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {item.reward}
        </span>
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px", lineHeight: 1.5 }}>
        {item.description}
      </p>

      {/* progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "rgba(255,255,255,0.07)",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${item.progress}%`,
            borderRadius: 99,
            background: item.completed ? C.green : "rgba(99,179,237,0.7)",
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted2 }}
      >
        <span>{item.target}</span>
        <span>{item.progress}%</span>
      </div>
    </div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
const RewardsPage = () => {
  const [filter, setFilter] = useState<Filter>("all")

  // TODO: const { data: rewards = [] } = useGetRewardsQuery()
  const rewards = MOCK_REWARDS

  const filtered = filter === "all" ? rewards : rewards.filter((r) => r.category === filter)

  const active = filtered.filter((r) => !r.completed)
  const completed = filtered.filter((r) => r.completed)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{ fontSize: 32, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}
          >
            Rewards
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
            Complete challenges to earn XP and climb the leaderboard
          </p>
        </div>

        {/* XP card */}
        <XPCard />

        {/* filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 4,
            width: "fit-content",
          }}
        >
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 16px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                background: filter === f ? C.green : "transparent",
                color: filter === f ? "#000" : C.muted,
                cursor: "pointer",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* active challenges */}
        {active.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 12px",
              }}
            >
              In Progress ({active.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {active.map((r) => (
                <RewardCard key={r.id} item={r} />
              ))}
            </div>
          </div>
        )}

        {/* completed */}
        {completed.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 12px",
              }}
            >
              Completed ({completed.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {completed.map((r) => (
                <RewardCard key={r.id} item={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardsPage
