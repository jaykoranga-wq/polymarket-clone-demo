import { lazy } from "react"
import type { RouteObject } from "react-router"

import { ROUTES } from "@/constants/routes"

import { withSuspense } from "./utils"

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })))

export const privateRoutes: RouteObject[] = [
  {
    path: ROUTES.DASHBOARD,
    element: withSuspense(<Dashboard />),
  },
]
