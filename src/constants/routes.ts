export const ROUTES = {
  HOME: "/",
  EVENT: "/event/:id",
  PORTFOLIO: "/portfolio",
  Markets: "/markets/:group",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
