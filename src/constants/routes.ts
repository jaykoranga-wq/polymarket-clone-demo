export const ROUTES = {
  HOME: "/",
  EVENT: "/event/:id",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
