import { configureStore } from "@reduxjs/toolkit"

import { api } from "@/features/api/api"
import authReducer from "@/features/auth/authSlice"
import marketReducer from "@/features/markets/marketSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    markets: marketReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
