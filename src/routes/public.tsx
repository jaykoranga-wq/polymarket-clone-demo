import { lazy } from "react"
import type { RouteObject } from "react-router"

import { ROUTES } from "@/constants/routes"
import { Home } from "@/pages/Home"

import { withSuspense } from "./utils"

const Login = lazy(() => import("@/pages/Login").then((m) => ({ default: m.Login })))

export const publicRoutes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <Home />,
  },
  {
    path: ROUTES.LOGIN,
    element: withSuspense(<Login />),
  },
]
