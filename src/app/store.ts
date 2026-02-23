import { configureStore } from "@reduxjs/toolkit"

import authReducer from "@/features/auth/authSlice"
import counterReducer from "@/features/counter/counterSlice"
import marketReducer from "@/features/markets/marketSlice"

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    markets: marketReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
