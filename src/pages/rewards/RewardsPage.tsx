// src/pages/rewards/RewardsPage.tsx
// TODO: replace mock data with useGetRewardsQuery() when API ready

import {
  Award,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Flame,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { useState } from "react"

import { MOCK_REWARDS, MOCK_REWARDS_SUMMARY, type RewardItem } from "@/mocks/mockPages"

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_FILTERS = ["all", "trading", "accuracy", "social", "milestone"] as const
type Filter = (typeof CATEGORY_FILTERS)[number]

// ── Emoji Mapping ─────────────────────────────────────────────────────────────
const RewardIcon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const props = { size, className: "text-primary" }
  switch (name) {
    case "target":
      return <Target {...props} />
    case "dollar":
      return <DollarSign {...props} />
    case "flame":
      return <Flame {...props} />
    case "chart":
      return <BarChart3 {...props} />
    case "award":
      return <Award {...props} />
    case "zap":
      return <Zap {...props} />
    default:
      return <Trophy {...props} />
  }
}

// ── XP Progress bar ───────────────────────────────────────────────────────────
const XPCard = () => {
  const { level, nextLevelXp, currentXp, completed, total } = MOCK_REWARDS_SUMMARY
  const pct = Math.round((currentXp / nextLevelXp) * 100)

  return (
    <div className="flex-1 min-w-[320px] bg-white/5 border border-primary/20 rounded-2xl md:p-6 p-3  relative overflow-hidden transition-all duration-300 hover:border-primary/40 group">
      {/* subtle glow background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />

      <div className="flex items-center gap-6 relative">
        {/* level badge */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex flex-col items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,200,83,0.1)]">
          <span className="font-base font-black text-primary tracking-widest uppercase">LVL</span>
          <span className="text-2xl font-black text-primary leading-tight">{level}</span>
        </div>

        {/* xp progress */}
        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-2.5">
            <h3 className="text-sm font-black text-white tracking-wide uppercase">
              {currentXp.toLocaleString()} <span className="text-primary/70">XP</span>
            </h3>
            <span className="text-[11px] font-bold text-white/40 ">
              {nextLevelXp.toLocaleString()} XP to Level {level + 1}
            </span>
          </div>

          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-linear-to-r from-primary to-primary/60 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,200,83,0.4)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 font-base font-bold text-white/30 ">{pct}% to next level</div>
        </div>

        {/* separator */}
        <div className="w-px h-12 bg-white/10 hidden sm:block" />

        {/* completed count */}
        <div className="text-right hidden sm:block">
          <div className="text-xl font-black text-primary text-center leading-none mb-1">
            {completed}/{total}
          </div>
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">
            Finished
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reward card ───────────────────────────────────────────────────────────────
const RewardCard = ({ item }: { item: RewardItem }) => {
  if (item.completed) {
    return (
      <div className="bg-[#0b0e11] border border-primary/10 rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:border-primary/20 group h-full">
        {/* top row: icon + xp with check */}
        <div className="flex justify-between items-start w-full">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary/80">
            <RewardIcon name={item.icon} size={20} />
          </div>
          <div className="flex items-center gap-1.5 text-primary font-black text-[12px] tracking-tight uppercase">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(16,210,96,0.2)]">
              <CheckCircle2 size={10} className="text-black" strokeWidth={4} />
            </div>
            {item.reward}
          </div>
        </div>

        {/* mid: title + desc */}
        <div>
          <h3 className="text-white/60 font-black text-lg mb-1 leading-tight">{item.title}</h3>
          <p className="text-white/40 text-xs font-medium leading-relaxed">{item.description}</p>
        </div>
      </div>
    )
  }

  // Vertical card for in-progress
  const targetParts = item.target.split(" ")
  const targetValue = targetParts[0]
  const targetUnit = targetParts.slice(1).join(" ")

  return (
    <div className="bg-[#121418] border border-white/5 rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 hover:border-white/10 group h-full">
      {/* top row: icon + xp */}
      <div className="flex justify-between items-start w-full">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <RewardIcon name={item.icon} size={20} />
        </div>
        <div className="text-sm font-black text-primary tracking-tight">{item.reward}</div>
      </div>

      {/* mid: title + desc */}
      <div>
        <h3 className="text-white font-black text-xl mb-1.5 leading-none">{item.title}</h3>
        <p className="text-white/40 text-xs font-medium leading-relaxed">{item.description}</p>
      </div>

      {/* bottom: progress info */}
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-black text-2xl tracking-tighter leading-none">
              {targetValue}
            </span>
            {targetUnit && (
              <span className="text-white/60 text-sm font-bold tracking-tight lowercase">
                {targetUnit}
              </span>
            )}
          </div>
          <span className="text-white/60 font-base font-black tracking-wider mb-0.5">
            {item.progress}%
          </span>
        </div>

        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,210,96,0.3)]"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

const SectionHeader = ({ label, count }: { label: string; count: number }) => (
  <div className="flex items-center gap-2.5 mb-6">
    <h2 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">{label}</h2>
    <div className="bg-white/10 text-white/50 text-[10px] font-black px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
      {count}
    </div>
  </div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
const RewardsPage = () => {
  const [filter, setFilter] = useState<Filter>("all")

  // TODO: const { data: rewards = [] } = useGetRewardsQuery()
  const rewards = MOCK_REWARDS

  const active = rewards.filter((r) => !r.completed)
  const completed = rewards.filter((r) => r.completed)

  let displayActive: RewardItem[] = []
  let displayCompleted: RewardItem[] = []

  if (filter === "all") {
    displayActive = active
    displayCompleted = completed
  } else if (filter === "trading") {
    displayActive = []
    displayCompleted = completed.filter((r) => r.category === "trading")
  } else if (filter === "accuracy") {
    displayActive = active.filter((r) => r.category === "accuracy").slice(0, 2)
    displayCompleted = []
  } else if (filter === "social") {
    displayActive = []
    displayCompleted = []
  } else if (filter === "milestone") {
    displayActive = active.filter((r) => r.category === "milestone").slice(0, 100)
    displayCompleted = []
  }

  return (
    <div className="container mt-6 mb-20 text-white">
      <div>
        <div className="flex flex-row flex-wrap justify-between items-start gap-12 mb-10">
          {/* header */}
          <div className="max-w-xl">
            <h1 className="font-2xl font-bold text-white tracking-tighter mb-4 leading-tight">
              Earn Rewards & XP
            </h1>
            <p className="font-default text-white/50 ">
              Redeem points, complete daily challenges, and level up to unlock exclusive trading
              perks and reach the top of the leaderboard.
            </p>
          </div>

          {/* XP card */}
          <XPCard />
        </div>

        {/* filter tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-2md p-1 mb-10 w-fit">
          {CATEGORY_FILTERS.map((f) => {
            const isActive = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-2 px-5 rounded-md font-base font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-black shadow-[0px_4px_6px_-4px_rgba(16,210,96,0.3),0px_10px_15px_-3px_rgba(16,210,96,0.3)]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          })}
        </div>

        {/* content grid */}
        <div className="flex flex-col gap-14">
          {/* active challenges */}
          {displayActive.length > 0 && (
            <div>
              <SectionHeader label="In Progress" count={displayActive.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayActive.map((r) => (
                  <RewardCard key={r.id} item={r} />
                ))}
              </div>
            </div>
          )}

          {/* completed */}
          {displayCompleted.length > 0 && (
            <div>
              <SectionHeader label="Completed" count={displayCompleted.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayCompleted.map((r) => (
                  <RewardCard key={r.id} item={r} />
                ))}
              </div>
            </div>
          )}

          {/* empty state */}
          {displayActive.length === 0 && displayCompleted.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-white/20 text-4xl mb-4">🏆</div>
              <h3 className="text-white/40 font-bold text-lg">No challenges available</h3>
              <p className="text-white/20 text-sm mt-1">Check back later for new rewards!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardsPage
