import { configureStore } from "@reduxjs/toolkit"

import { api } from "@/features/api/api"
import { secondApi } from "@/features/api/secondApi"
import authReducer from "@/features/auth/authSlice"
import marketReducer from "@/features/markets/marketSlice"
import notificationReducer from "@/features/notifications/notificationSlice"
import orderReducer from "@/features/orders/orderSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    markets: marketReducer,
    orders: orderReducer,
    notifications: notificationReducer,
    [api.reducerPath]: api.reducer,
    [secondApi.reducerPath]: secondApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, secondApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
