// src/pages/profile/ProfilePage.tsx
// TODO: replace MOCK_PROFILE / MOCK_PROFILE_STATS with useGetProfileQuery()

import {
  Award,
  ChevronRight,
  Diamond,
  Flame,
  Heart,
  Landmark,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react"
import { useSelector } from "react-redux"

import { selectUserData } from "@/features/auth/authSlice"
import { formatMarketDate } from "@/libs/formatDate"
import type { Badge } from "@/mocks/mockPages"
import { MOCK_PROFILE, MOCK_PROFILE_STATS } from "@/mocks/mockPages"

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0f13",
  surface: "#111418", // Darker card background
  border: "rgba(255,255,255,0.08)",
  green: "#10d260", // Brand primary green
  red: "#ea3943",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.45)",
  muted2: "rgba(255,255,255,0.25)",
} as const

// ── Emoji Mapping ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  "🏆": Trophy,
  "💚": Heart,
  "🔥": Flame,
  "🎯": Target,
  "💎": Diamond,
  "⚡": Zap,
  "🏅": Award,
}

const EmojiIcon = ({
  emoji,
  size = 16,
  color,
}: {
  emoji: string
  size?: number
  color?: string
}) => {
  const Icon = ICON_MAP[emoji]
  if (!Icon) return null

  const iconProps = {
    size,
    className: `transition-colors ${color ? "" : "text-primary group-hover:text-white"} ${emoji === "💚" ? "fill-current" : ""}`,
    style: color ? { color } : undefined,
  }

  return <Icon {...iconProps} />
}

// ── Avatar initials ───────────────────────────────────────────────────────────
const BigAvatar = ({ name }: { name: string }) => {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div className="w-40 h-40 rounded-md bg-primary/10 flex items-center justify-center text-8xl  font-extrabold text-white  shrink-0 ">
      {initials}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  green,
  trend,
  accentColor,
}: {
  label: string
  value: string
  sub: string
  green?: boolean
  trend?: string
  accentColor?: string
}) => (
  <div
    className="bg-white/4  py-4 px-5 flex rounded-sm flex-col gap-1 justify-center min-h-24"
    style={{
      border: `1px solid ${C.border}`,
      borderLeft: accentColor ? `2px solid ${accentColor}` : `1px solid ${C.border}`,
    }}
  >
    <span className="font-base font-bold text-white/45 uppercase tracking-widest">{label}</span>
    <span
      className="font-lg font-extrabold tracking-tight my-1 "
      style={{
        color: green ? C.green : C.text,
      }}
    >
      {value}
    </span>
    <div className="flex items-center gap-1.5 mt-1">
      {trend === "up" && <TrendingUp size={12} className="text-primary" />}
      {trend === "realized" && <Landmark size={12} className="text-primary" />}
      <span
        className="font-base font-semibold "
        style={{
          color: trend ? C.green : C.muted2,
          textTransform: trend ? "none" : "uppercase",
          letterSpacing: trend ? "0" : "0.05em",
        }}
      >
        {sub}
      </span>
    </div>
  </div>
)

// ── Badge chip ────────────────────────────────────────────────────────────────
const BadgeChip = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
  <div className="group transition-all hover:bg-white/5 flex items-center gap-2.5 py-2.5 px-4 rounded-lg bg-white/4 border border-white/6 font-sm  font-semibold text-white cursor-pointer">
    <EmojiIcon emoji={icon} size={18} color={color.includes("0.15") ? undefined : color} />
    {label}
  </div>
)

const AccuracySection = ({ winRate, trades }: { winRate: number; trades: number }) => (
  <div className="bg-white/4  border border-white/6 rounded-md py-8 px-10 ">
    <div className="flex flex-col gap-4 md:flex-row justify-between items-start mb-8">
      <div>
        <h2 className="text-xl font-bold mb-1.5">Trading Accuracy</h2>
        <p className="text-sm text-white/40 max-w-[320px]">
          Statistical success rate across all {trades} executed predictions
        </p>
      </div>
      <div className="text-4xl font-black text-primary tracking-tighter">{winRate}%</div>
    </div>

    <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-10 w-full flex-1">
      <div
        className="h-full bg-primary transition-all duration-75 ease  shadow-[0_0_20px_#10D26044]"
        style={{
          width: `${winRate}%`,
        }}
      />
    </div>

    <div className="grid grid-cols-2 gap-20">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Correct Predictions
        </span>
        <span className="text-lg font-bold">118 Positions</span>
      </div>
      <div className="flex flex-col gap-1 text-right">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Losses
        </span>
        <span className="text-lg font-bold">69 Positions</span>
      </div>
    </div>
  </div>
)

const BadgesSection = ({ badges }: { badges: Badge[] }) => (
  <div className="bg-white/4 border border-white/10 rounded-md py-8 px-10 min-w-80">
    <div className="flex justify-between items-center mb-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Badges Earned</h2>
      <button className="text-[11px] font-bold text-primary flex items-center gap-0.5 hover:opacity-80 transition-opacity">
        VIEW ALL <ChevronRight size={14} className="mt-0.5" />
      </button>
    </div>

    <div className="flex flex-wrap gap-3">
      {badges.map((b) => (
        <BadgeChip key={b.id} icon={b.icon} label={b.label} color={b.color} />
      ))}
    </div>
  </div>
)

interface ProfileStat {
  label: string
  value: string
  sub: string
  green?: boolean
  trend?: string
  accentColor?: string
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  // TODO: const { data: profile } = useGetProfileQuery()
  const profile = MOCK_PROFILE
  const stats = MOCK_PROFILE_STATS
  const { email } = useSelector(selectUserData)

  const shortAddr = profile.address.slice(0, 6) + "..." + profile.address.slice(-4)

  return (
    <div className="container font-inter">
      <div className="mt-7.5 mb-18">
        {/* ── Header card ── */}
        <div className="flex items-center justify-between gap-5 flex-wrap mb-14">
          <BigAvatar name={profile.displayName} />
          {/* <img className="w-40 h-40 rounded-sm object-cover" src="/user1.jpg" alt="logo" /> */}

          <div className="flex-1 min-w-50">
            <h1 className="font-2xl font-extrabold mb-1">{profile.displayName}</h1>
            <div className="font-sm text-white/60 mb-2">{shortAddr}</div>
            {email && <div className="font-sm text-white/60  mb-1">{email}</div>}
            <div className="font-sm text-white/60">
              Member since {formatMarketDate(profile.joinedAt)}
            </div>
          </div>

          {/* rank badge */}
          <div className="bg-linear-to-b from-primary/10 to-primary/5 flex flex-col gap-1 py-4 px-6 rounded-md border border-primary">
            <span className="font-base text-primary uppercase font-bold">Global Rank</span>
            <span className="font-xl  text-primary font-black  ">#{profile.rank}</span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
          {stats.map((s: ProfileStat) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              green={s.green}
              trend={s.trend}
              accentColor={s.accentColor}
            />
          ))}
        </div>

        {/* ── Middle Row: Accuracy & Badges ── */}
        <div className="flex flex-col xl:flex-row gap-5">
          <AccuracySection winRate={profile.winRate} trades={profile.totalTrades} />
          <BadgesSection badges={profile.badges} />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
