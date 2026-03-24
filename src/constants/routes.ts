export const ROUTES = {
  HOME: "/",
  EVENT: "/event/:id",
  PORTFOLIO: "/portfolio",
  Markets: "/markets/:group",
  PROFILE: "/profile/:id",
  REWARDS: "/rewards/:id",
  LEADERBOARD: "/leaderboard/:id",
  TERMS: "/terms",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
