// src/pages/leaderboard/LeaderboardPage.tsx
// TODO: replace mock data with useGetLeaderboardQuery() when API ready

import { BadgeCheck, ChevronDown, Clock } from "lucide-react"
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
      <div className="flex items-center gap-1.5">
        <span className="font-lg ">{medal.icon}</span>
        <span className="font-sm font-extrabold" style={{ color: medal.color }}>
          #{rank}
        </span>
      </div>
    )
  }

  return <span className="font-sm font-bold text-white">#{rank}</span>
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({
  name,
  size = 32,
  square = false,
}: {
  name: string
  size?: number
  square?: boolean
}) => (
  <div
    className="flex items-center justify-center font-extrabold text-white shrink-0 bg-primary/10"
    style={{
      width: size,
      height: size,
      borderRadius: square ? 12 : "50%",
      fontSize: size * 0.35,
    }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
)

// ── Top 3 podium ──────────────────────────────────────────────────────────────
const PodiumCard = ({ entry }: { entry: LeaderboardEntry }) => {
  const rank = entry.rank

  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] bg-white/6 border border-white/10 rounded-3xl py-8 px-6 relative  items-center transition-all duration-200 hover:border-primary cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.borderColor = "#10D260"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.borderColor = "#ffffff10"
      }}
    >
      {/* large background rank */}
      <div className="absolute top-5 right-6 text-[64px] font-black text-white/4 hover/text-primary pointer-events-none select-none">
        #{rank}
      </div>

      {/* avatar container */}
      <div className="relative mb-3 w-fit mx-auto">
        <div className="w-16 h-16 rounded-xxl p-1 bg-primary/10">
          <div className="w-full h-full rounded-xl overflow-hidden bg-primary/10">
            <Avatar name={entry.displayName} size={64} square />
          </div>
        </div>
        {/* rank bubble */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center font-sm font-black text-black border-2 border-black">
          {rank}
        </div>
      </div>

      {/* user info */}
      <div className="text-center mb-4 w-full">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="font-lg font-extrabold text-white truncate whitespace-nowrap">
            {entry.displayName}
          </span>
          <BadgeCheck size={18} className="text-market-blue fill-market-blue/20 shrink-0" />
        </div>
        <div
          style={{
            fontSize: 14,
            color: C.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            opacity: 0.8,
          }}
        >
          {entry.address}
        </div>
      </div>

      {/* stats divider */}
      {/* <div
        style={{
          width: "100%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          marginBottom: 20,
        }}
      /> */}

      {/* stats grid */}
      <div className="flex w-full justify-between gap-2">
        <div className="flex-1 text-center">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2">
            Profit
          </div>
          <div className="text-lg font-black text-primary tracking-tight">
            +${(entry.profitLoss / 1000).toFixed(1)}k
          </div>
        </div>

        <div className="w-px h-8 bg-white/10 mt-4 self-start" />

        <div className="flex-1 text-center">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2">
            Volume
          </div>
          <div className="text-lg font-black text-white tracking-tight">
            ${(entry.volume / 1000).toFixed(1)}k
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────────────────────
const LeaderRow = ({ entry }: { entry: LeaderboardEntry }) => (
  <div
    className="grid grid-cols-[repeat(6,1fr)] gap-2 py-3.5 px-6 items-center  relative transition-all duration-150"
    style={{
      background: entry.isCurrentUser ? "rgba(0,200,83,0.05)" : "transparent",
      border: entry.isCurrentUser ? `1px solid rgba(0,200,83,0.2)` : `none`,
      borderRadius: entry.isCurrentUser ? 10 : 0,
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
        className="absolute left-0 top-1/2  bg-primary/50 rounded-r-sm"
        style={{
          transform: "translateY(-50%)",
          width: 3,
          height: "60%",
        }}
      />
    )}

    {/* rank */}
    <RankDisplay rank={entry.rank} />

    {/* user */}
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={entry.displayName} />
      <div style={{ minWidth: 0 }}>
        <div
          className="font-sm truncate whitespace-nowrap"
          style={{
            fontWeight: entry.isCurrentUser ? 800 : 600,
            color: entry.isCurrentUser ? C.green : C.text,
          }}
        >
          {entry.displayName}
          {entry.isCurrentUser && (
            <span className="ml-1.5 font-base font-semibold bg-primary/15 text-primary py-0.5 px-1.5 rounded-sm  ">
              You
            </span>
          )}
        </div>
        <div className="font-base  text-white/30 font-mono">{entry.address}</div>
      </div>
    </div>

    {/* volume */}
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>
      ${(entry.volume / 1000).toFixed(1)}k
    </div>

    {/* p/l */}
    <div
      className="font-sm font-bold text-right"
      style={{
        color: entry.profitLoss >= 0 ? C.green : C.red,
      }}
    >
      {entry.profitLoss >= 0 ? "+" : ""}${(entry.profitLoss / 1000).toFixed(1)}k
    </div>

    {/* win rate */}
    <div className="font-sm text-white/60 text-right">{entry.winRate}%</div>

    {/* trades */}
    <div className="font-sm text-white/60 text-right">{entry.trades}</div>
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
    <div className="text-white">
      <div className="container py-6 pb-20">
        {/* header */}
        <div className="flex justify-between items-end flex-wrap mb-8 gap-5">
          <div>
            <div className="font-base font-semibold text-white/80 mb-2.5 ">Leaderboard</div>
            <h1 className="font-xxl font-black mb-2.5 text-white ">Global Leaderboard</h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: C.muted,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Clock size={14} strokeWidth={2.5} />
              <span>Last update 10min ago</span>
            </div>
          </div>

          {/* filters */}
          <div className="flex items-center  gap-3.5">
            {/* category dropdown placeholder */}
            <div className="flex items-center gap-3 py-2.5 px-4 bg-white/5 border border-white/10 rounded-2md text-white/80 font-sm font-semibold justify-between cursor-pointer min-w-30 ">
              <span>Category</span>
              <ChevronDown size={14} strokeWidth={2.5} className="opacity-50" />
            </div>

            {/* separator */}
            <div className="w-0.5 h-7 bg-white/10" />

            {/* time filter */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2md p-1">
              {TIME_FILTERS.map((f) => {
                const isActive = timeFilter === f
                return (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className="py-2 px-4 rounded-md font-base font-bold cursor-pointer transition-all duration-200 whitespace-nowrap "
                    style={{
                      background: isActive ? C.green : "transparent",
                      color: isActive ? "#000" : "#ffffff60",
                      boxShadow: isActive ? `0 4px 20px ${C.green}44` : "none",
                    }}
                  >
                    {f === "All Time"
                      ? "ALL"
                      : f === "This Month"
                        ? "1M"
                        : f === "This Week"
                          ? "1W"
                          : f}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* your rank banner */}
        {currentUser && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg py-3.5 px-5 mb-5 flex items-center gap-4 flex-wrap ">
            <span className="font-base font-bold text-primary uppercase tracking-wider">
              Your Rank
            </span>
            <span className="font-lg fot-black text-primary">#{currentUser.rank}</span>
            <span className="font-sm text-white/60">
              {currentUser.winRate}% win rate · ${(currentUser.volume / 1000).toFixed(1)}k volume ·
              +${(currentUser.profitLoss / 1000).toFixed(1)}k profit
            </span>
          </div>
        )}

        {/* podium top 3 */}
        <div className="flex flex-wrap items-stretch justify-center gap-12 mb-8">
          {top3.slice(0, 3).map((entry) => (
            <PodiumCard key={entry.rank} entry={entry} />
          ))}
        </div>

        {/* main table */}
        <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar ">
          <div className="min-w-[900px]">
            {/* column headers */}
            <div className="grid grid-cols-[repeat(6,1fr)] gap-2 py-4 px-6 pt-8 border-b border-white/10 ">
              {["Rank", "Trader", "Volume", "P/L", "Win Rate", "Trades"].map((h, i) => (
                <div
                  key={h}
                  className="text-white/60 font-base font-medium uppercase tracking-wide"
                  style={{
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
    </div>
  )
}

export default LeaderboardPage
