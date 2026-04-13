import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet } from "react-router"

import type { RootState } from "@/app/store"
import { Footer } from "@/components/layout/footer/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { useLoginMutation } from "@/features/api/auth/authApi"
import { useGetMarketsQuery } from "@/features/api/markets/marketApi"
import { useGetNotificationsQuery } from "@/features/api/notifications/notificationApi"
import { checkAuth } from "@/features/auth/authChecks"
// import { setDeviceToken } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { setMarkets } from "@/features/markets/marketSlice"
import { setNotifications } from "@/features/notifications/notificationSlice"
import { useWalletBalance } from "@/hooks/useWalletBalance"
import { MOCK_MARKETS } from "@/mocks/mockData"
import { MOCK_NOTIFICATIONS } from "@/mocks/mockNotifications"
// import { listenToMessages, requestFCMToken } from "@/services/firebase/fcm"

export function PublicLayout() {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  useWalletBalance()
  const [loginToBackend] = useLoginMutation()
  const { data: markets } = useGetMarketsQuery()

  // Get token explicitly to prevent premature API execution before authentication completes
  const token = useSelector((state: RootState) => state.auth.token)
  const { data: apiNotifications } = useGetNotificationsQuery(undefined, { skip: !token })

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
    } else {
      dispatch(setMarkets(MOCK_MARKETS))
    }

    if (apiNotifications && apiNotifications.length != 0) {
      console.log("apiNotifications", apiNotifications)
      dispatch(setNotifications(apiNotifications))
    } else {
      dispatch(setNotifications(MOCK_NOTIFICATIONS))
    }

    return () => {
      //empty the notification
      dispatch(setNotifications([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magic, dispatch, markets, apiNotifications])

  //notification
  useEffect(() => {
    // const setupFCM = async () => {
    //   const token = await requestFCMToken()
    //   if (token) {
    //     dispatch(setDeviceToken(token))
    //   }
    //   listenToMessages()
    // }
    // setupFCM()
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
