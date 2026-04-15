import { secondApi } from "@/features/api/secondApi"
import { NOTIFICATION_TYPES } from "@/features/notifications/notificationConstants"
import type { Notification } from "@/features/notifications/notificationSlice"

export interface ApiNotificationItem {
  id: string
  readAt: string | null
  createdAt: string
  notification: {
    id: string
    title: string
    description: string
    imageUrl: string
    redirectUrl: string
    type: number
    createdAt: string
  }
}

export interface ApiNotificationResponse {
  statusCode: number
  status: boolean
  message: string
  type: string
  data: {
    notifications: ApiNotificationItem[]
    totalCount: number
  }
}

const mapApiNotification = (apiItem: ApiNotificationItem): Notification => {
  // Map backend numeric types to frontend notification enum types
  // 3 -> Market Resolved -> SYSTEM
  // 2 -> Order Matched -> FILL
  let type: Notification["type"] = NOTIFICATION_TYPES.SYSTEM
  if (apiItem.notification.type === 2) type = NOTIFICATION_TYPES.FILL
  if (apiItem.notification.type === 3) type = NOTIFICATION_TYPES.SYSTEM

  return {
    id: apiItem.id, // Using global wrap ID
    type,
    title: apiItem.notification.title,
    message: apiItem.notification.description,
    timestamp: apiItem.createdAt,
    read: apiItem.readAt !== null,
  }
}
export const notificationApi = secondApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], { limit?: number } | void>({
      query: (params) => ({
        url: `/v1/notifications`,
        params: { limit: 10, ...(params ?? {}) },
      }),
      transformResponse: (response: ApiNotificationResponse) => {
        if (!response?.data?.notifications) {
          return []
        }
        const mapped = response.data.notifications.map(mapApiNotification)
        return mapped
      },
    }),
  }),
})

export const { useGetNotificationsQuery } = notificationApi
