importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyA7XLq1G25Zf7Oas-M5btqCwWCxnRqZ9yM",
  authDomain: "outcome-x.firebaseapp.com",
  projectId:"outcome-x",
  messagingSenderId: "516189639432",
  appId: "1:516189639432:web:2abb93828543bee347d2bd",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  })
})