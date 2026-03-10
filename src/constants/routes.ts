export const ROUTES = {
  HOME: "/",
  EVENT: "/event/:id",
  PORTFOLIO: "/portfolio",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
