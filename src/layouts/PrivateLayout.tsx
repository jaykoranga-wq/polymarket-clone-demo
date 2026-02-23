import { Outlet } from "react-router"

import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { logout, selectUser } from "@/features/auth/authSlice"

export function PrivateLayout() {
  const user = useAppSelector(selectUser)
  const dispatch = useAppDispatch()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-xl">PolyMarket</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
