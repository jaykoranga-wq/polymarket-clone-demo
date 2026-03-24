import type { RouteObject } from "react-router"

import { ROUTES } from "@/constants/routes"
import Event from "@/pages/event/Event"
import Home from "@/pages/Home"
import LeaderboardPage from "@/pages/leaderboard/LeaderboardPage"
import MarketPage from "@/pages/market/MarketPage"
import PortfolioPage from "@/pages/portfolio/Portfolio"
import ProfilePage from "@/pages/profile/ProfilePage"
import RewardsPage from "@/pages/rewards/RewardsPage"
import TermsPage from "@/pages/terms/TermsPage"

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
  {
    path: ROUTES.Markets,
    element: <MarketPage />,
  },
  {
    path: ROUTES.PROFILE,
    element: <ProfilePage />,
  },
  {
    path: ROUTES.LEADERBOARD,
    element: <LeaderboardPage />,
  },
  {
    path: ROUTES.REWARDS,
    element: <RewardsPage />,
  },
  {
    path: ROUTES.TERMS,
    element: <TermsPage />,
  },
]
