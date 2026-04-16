import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet, useNavigate } from "react-router"
import { toast } from "sonner"

import type { RootState } from "@/app/store"
import { UsernameModal } from "@/components/auth/UsernameModal"
import { Footer } from "@/components/layout/footer/Footer"
import { Navbar } from "@/components/layout/Navbar"
import {
  useLoginMutation,
  useProfileQuery,
  useSubmitNameMutation,
} from "@/features/api/auth/authApi"
import { useGetMarketsQuery } from "@/features/api/markets/marketApi"
import { useGetNotificationsQuery } from "@/features/api/notifications/notificationApi"
import { checkAuth } from "@/features/auth/authChecks"
import { selectDeviceToken, setDeviceToken } from "@/features/auth/authSlice"
import { useMagic } from "@/features/auth/lib/magic"
import { setMarkets } from "@/features/markets/marketSlice"
import { NOTIFICATION_TYPES } from "@/features/notifications/notificationConstants"
import { addNotification, setNotifications } from "@/features/notifications/notificationSlice"
import { useWalletBalance } from "@/hooks/useWalletBalance"
import { MOCK_MARKETS } from "@/mocks/mockData"
import { listenToMessages, requestFCMToken } from "@/services/firebase/fcm"

export function PublicLayout() {
  const [usernameOpen, setUsernameOpen] = useState(true)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { magic } = useMagic()
  useWalletBalance()
  const [loginToBackend] = useLoginMutation()
  const [submitName] = useSubmitNameMutation()
  const { data: markets } = useGetMarketsQuery()

  // Get token explicitly to prevent premature API execution before authentication completes
  const token = useSelector((state: RootState) => state.auth.token)
  const email = useSelector((state: RootState) => state.auth.email)
  const deviceToken = useSelector(selectDeviceToken)

  const { data: profile } = useProfileQuery(undefined, { skip: !token })

  const { data: apiNotifications } = useGetNotificationsQuery(undefined, { skip: !token })

  // Runs once when magic initialises (any page, any refresh).
  // Restores auth state: Google redirect → Magic session → MetaMask → unauthenticated.
  // dispatch and loginToBackend are stable refs — safe to omit from deps.
  useEffect(() => {
    if (magic) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void checkAuth(magic, dispatch, loginToBackend as any, deviceToken)
    }
    if (markets) {
      dispatch(setMarkets([...markets, ...MOCK_MARKETS]))
    } else {
      dispatch(setMarkets(MOCK_MARKETS))
    }

    if (apiNotifications && apiNotifications.length != 0) {
      dispatch(setNotifications(apiNotifications))
    }

    return () => {
      dispatch(setNotifications([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magic, dispatch, markets, apiNotifications])

  // FCM: request token + listen for foreground messages
  useEffect(() => {
    const setupFCM = async () => {
      const token = await requestFCMToken()
      if (token) {
        dispatch(setDeviceToken(token))
        console.log("token from fcm :", token)
      }
    }

    listenToMessages((payload) => {
      const title = payload.notification?.title ?? "New notification"
      const body = payload.notification?.body ?? ""
      const redirectUrl = payload.data?.redirectUrl
      // Backend sends numeric type as a string in FCM data; 2 = fill, default = system
      const typeNum = Number(payload.data?.type ?? 3)
      const type = typeNum === 2 ? NOTIFICATION_TYPES.FILL : NOTIFICATION_TYPES.SYSTEM

      // 1. Push into the bell / notification list immediately
      dispatch(addNotification({ type, title, message: body, timestamp: new Date().toISOString() }))

      // 2. Show a foreground toast — clicking "View →" navigates to the redirect URL
      toast(title, {
        description: body,
        duration: 3000,
        ...(redirectUrl
          ? {
              action: {
                label: "View →",
                onClick: () => {
                  if (redirectUrl.startsWith("/")) navigate(redirectUrl)
                  else window.open(redirectUrl, "_blank")
                },
              },
            }
          : {}),
      })
    })

    setupFCM()
  }, [dispatch, navigate])

  return (
    <div className=" bg-background">
      <main>
        {
          <UsernameModal
            open={usernameOpen && profile?.data.onboardingStatus === 1 && token != null}
            defaultUsername={email?.split("@")[0]}
            onConfirm={async (username: string) => {
              await submitName({ name: username }).unwrap()
              setTimeout(() => setUsernameOpen(false), 1500)
            }}
            onSkip={() => setUsernameOpen(false)}
          ></UsernameModal>
        }
        <Navbar />
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
