import { initializeApp } from "firebase/app"
import { getMessaging } from "firebase/messaging"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.authDomain,
  projectId: import.meta.env.VITE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_API_ID,
}

export const app = initializeApp(firebaseConfig)

export const messaging = getMessaging(app)
