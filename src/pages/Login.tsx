import { useLocation,useNavigate } from "react-router"

import { useAppDispatch } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { login } from "@/features/auth/authSlice"

export function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = () => {
    dispatch(login())
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="p-8 bg-card border rounded-xl shadow-sm text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Please log in to access your dashboard.
        </p>
        <Button className="w-full" onClick={handleLogin}>
          Log In (Demo)
        </Button>
      </div>
    </div>
  )
}
