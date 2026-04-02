// src/pages/profile/ProfilePage.tsx
// TODO: replace MOCK_PROFILE / MOCK_PROFILE_STATS with useGetProfileQuery()

import { useSelector } from "react-redux"

import { selectUserData } from "@/features/auth/authSlice"
import { formatMarketDate } from "@/libs/formatDate"
import { MOCK_PROFILE, MOCK_PROFILE_STATS } from "@/mocks/mockPages"

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
} as const

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
}: {
  label: string
  value: string
  sub: string
  green?: boolean
}) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 24,
        fontWeight: 800,
        color: green ? C.green : C.text,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </span>
    <span style={{ fontSize: 11, color: C.muted2 }}>{sub}</span>
  </div>
)

// ── Badge chip ────────────────────────────────────────────────────────────────
const BadgeChip = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 10,
      background: color,
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: 12,
      fontWeight: 600,
      color: C.text,
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </div>
)

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 13,
        fontWeight: 700,
        color: C.text,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {title}
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
)

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

          <div style={{ flex: 1, minWidth: 200 }}>
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
            <span
              style={{ fontSize: 32, fontWeight: 900, color: "#fbbf24", letterSpacing: "-0.02em" }}
            >
              #{profile.rank}
            </span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} green={s.green} />
          ))}
        </div>

        {/* ── Badges ── */}
        <Section title="Badges Earned">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {profile.badges.map((b) => (
              <BadgeChip key={b.id} icon={b.icon} label={b.label} color={b.color} />
            ))}
          </div>
        </Section>

        {/* ── Win rate bar ── */}
        <div style={{ marginTop: 16 }}>
          <Section title="Accuracy">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Win rate</span>
                <span style={{ fontWeight: 700, color: C.green }}>{profile.winRate}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${profile.winRate}%`,
                    borderRadius: 99,
                    background: C.green,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: C.muted2,
                }}
              >
                <span>0%</span>
                <span>{profile.totalTrades} trades total</span>
                <span>100%</span>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
