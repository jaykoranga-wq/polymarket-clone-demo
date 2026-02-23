import { Navigate, Outlet, useLocation } from "react-router"

import { useAppSelector } from "@/app/hooks"
import { ROUTES } from "@/constants/routes"
import { selectIsAuthenticated } from "@/features/auth/authSlice"

export function AuthGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login while saving the current location
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
