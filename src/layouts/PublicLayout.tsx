import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { Outlet } from "react-router"

import { Footer } from "@/components/layout/footer/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { useLoginMutation } from "@/features/api/auth/authApi"
import { useGetMarketsQuery } from "@/features/api/markets/marketApi"
import { checkAuth } from "@/features/auth/authChecks"
import { setDeviceToken } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { setMarkets } from "@/features/markets/marketSlice"
import { useWalletBalance } from "@/hooks/useWalletBalance"
import { MOCK_MARKETS } from "@/mocks/mockData"
import { listenToMessages, requestFCMToken } from "@/services/firebase/fcm"

export function PublicLayout() {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  useWalletBalance()
  const [loginToBackend] = useLoginMutation()
  const { data: markets } = useGetMarketsQuery()

  // Runs once when magic initialises (any page, any refresh).
  // Restores auth state: Google redirect → Magic session → MetaMask → unauthenticated.
  // dispatch and loginToBackend are stable refs — safe to omit from deps.
  useEffect(() => {
    if (magic) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void checkAuth(magic, dispatch, loginToBackend as any)
    }
    if (markets) {
      dispatch(setMarkets([...markets, ...MOCK_MARKETS]))
    } else dispatch(setMarkets(MOCK_MARKETS))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magic, dispatch, markets])

  //notification
  useEffect(() => {
    const setupFCM = async () => {
      const token = await requestFCMToken()

      if (token) {
        dispatch(setDeviceToken(token))
      }

      listenToMessages()
    }

    setupFCM()
  }, [])

  return (
    <div className=" bg-background">
      <main>
        <Navbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
