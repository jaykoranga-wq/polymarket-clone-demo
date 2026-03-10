import type { RouteObject } from "react-router"

import { ROUTES } from "@/constants/routes"
import Event from "@/pages/Event"
import Home from "@/pages/Home"
import PortfolioPage from "@/pages/Portfolio"

export const publicRoutes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <Home />,
  },
  {
    path: ROUTES.EVENT,
    element: <Event />,
  },
  {
    path: ROUTES.PORTFOLIO,
    element: <PortfolioPage />,
  },
]
