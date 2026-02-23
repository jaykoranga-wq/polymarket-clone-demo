import { lazy } from "react"
import { createBrowserRouter } from "react-router"

import { AuthGuard } from "@/guards/AuthGuard"
import { PrivateLayout } from "@/layouts/PrivateLayout"
import { PublicLayout } from "@/layouts/PublicLayout"

import { privateRoutes } from "./private"
import { publicRoutes } from "./public"
import { withSuspense } from "./utils"

// Lazy-loaded common components
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })))

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: publicRoutes,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <PrivateLayout />,
        children: privateRoutes,
      },
    ],
  },
  {
    path: "*",
    element: withSuspense(<NotFound />),
  },
])
