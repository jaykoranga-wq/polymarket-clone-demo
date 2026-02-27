export const ROUTES = {
  HOME: "/",
  EVENT: "/event",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
