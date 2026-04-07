import { getMessaging, getToken, onMessage } from "firebase/messaging"

import { app } from "./firebase"

const messaging = getMessaging(app)

// 🔔 Request permission + get token
export const requestFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission()

    if (permission !== "granted") {
      console.log("Permission denied")
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY, //
    })

    console.log("FCM Token:", token)
    return token
  } catch (error) {
    console.error("Error getting token:", error)
    return null
  }
}

// 📥 Foreground messages
export const listenToMessages = () => {
  onMessage(messaging, (payload) => {
    console.log("Message received:", payload)

    alert(payload.notification?.title)
  })
}
