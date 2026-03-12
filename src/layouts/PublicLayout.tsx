import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { Outlet } from "react-router"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { useLoginMutation } from "@/features/api/auth/authApi"
import { checkAuth } from "@/features/auth/authChecks"
import { useMagic } from "@/features/auth/lib/magic"
import { setMarkets } from "@/features/markets/marketSlice"
import { MOCK_MARKETS } from "@/mocks/mockData"

export function PublicLayout() {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  const [loginToBackend] = useLoginMutation()

  // Runs once when magic initialises (any page, any refresh).
  // Restores auth state: Google redirect → Magic session → MetaMask → unauthenticated.
  // dispatch and loginToBackend are stable refs — safe to omit from deps.
  useEffect(() => {
    if (magic) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void checkAuth(magic, dispatch, loginToBackend as any)
      dispatch(setMarkets(MOCK_MARKETS))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magic])

  return (
    <div className="min-h-screen bg-background">
      <main>
        <Navbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
