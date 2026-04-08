import { getToken, onMessage } from "firebase/messaging"

import { getMessagingInstance } from "./firebase"

export const requestFCMToken = async (): Promise<string | null> => {
  const messaging = await getMessagingInstance()
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()

    if (permission !== "granted") return null

    // ✅ register service worker manually
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")

    await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    console.log("FCM Token:", token)
    return token
  } catch (err) {
    console.error(err)
    return null
  }
}

export const listenToMessages = async () => {
  const messaging = await getMessagingInstance()
  if (!messaging) {
    console.warn("Firebase Messaging is not supported in this browser.")
    return
  }

  onMessage(messaging, (payload) => {
    console.log("Message received:", payload)
    alert(payload.notification?.title)
  })
}
