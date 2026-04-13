// src/features/notifications/notificationSlice.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { RootState } from "@/app/store"
import { type Notification } from "@/mocks/mockNotifications"

import type { NotificationType } from "./notificationConstants"

// re-export for convenience so consumers import from one place
export type { Notification, NotificationType }

interface NotificationState {
  list: Notification[]
}

const initialState: NotificationState = {
  list: [],
  // TODO: replace MOCK_NOTIFICATIONS with [] and fetch from API on app load
  // dispatch(setNotifications(apiData)) after useGetNotificationsQuery resolves
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // mark one as read
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.list.find((x) => x.id === action.payload)
      if (n) n.read = true
    },

    // mark all as read
    markAllRead: (state) => {
      state.list.forEach((n) => {
        n.read = true
      })
    },

    // remove one notification
    removeNotification: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((x) => x.id !== action.payload)
    },

    // clear all notifications
    clearAll: (state) => {
      state.list = []
    },

    // add new notification — call from useTrade or socket
    addNotification: (state, action: PayloadAction<Omit<Notification, "id" | "read">>) => {
      state.list.unshift({
        ...action.payload,
        id: `n-${Date.now()}`,
        read: false,
      })
    },

    // replace entire list — call after API fetch
    // TODO: wire to useGetNotificationsQuery when ready
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.list = action.payload
    },
  },
})

export const {
  markRead,
  markAllRead,
  removeNotification,
  clearAll,
  addNotification,
  setNotifications,
} = notificationSlice.actions

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectNotifications = (s: RootState) => s.notifications.list
export const selectUnreadCount = (s: RootState) =>
  s.notifications.list.filter((n) => !n.read).length

export default notificationSlice.reducer
