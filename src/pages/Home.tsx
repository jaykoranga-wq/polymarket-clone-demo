import { Link } from "react-router"

import { useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { selectIsAuthenticated } from "@/features/auth/authSlice"
import { Counter } from "@/features/counter"
import { APP_NAME } from "@/lib/constants"

export function Home() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background text-foreground">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Enterprise-level React scaffold with Redux Toolkit, shadcn/ui and Scalable Routing.
        </p>
      </div>

      <div className="flex gap-4">
        {isAuthenticated ? (
          <Button asChild size="lg">
            <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link to={ROUTES.LOGIN}>Get Started / Login</Link>
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <Counter />
      </div>

      <p className="text-sm text-muted-foreground">
        Built with React 19 • Vite 7 • TypeScript • RTK • shadcn/ui
      </p>
    </div>
  )
}
