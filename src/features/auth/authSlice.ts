import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { AuthState } from "./authTypes/authStateTypes"
import type { LoginMethod } from "./authTypes/loginMethodsTypes"

const initialState: AuthState = {
  isAuthenticated: false,
  email: null,
  publicAddress: null,
  loading: false,
  cashAmount: 0,
  portfolioAmount: 0,
  loginMethod: null,
  token: null,
  cashLoading: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(
      state,
      action: PayloadAction<{
        email: string | null
        publicAddress?: string | null
        loading: boolean
        isAuthenticated?: boolean
        loginMethod: LoginMethod
        token: string | null
      }>,
    ) {
      if (action.payload.isAuthenticated === false) {
        state.isAuthenticated = action.payload.isAuthenticated
      } else {
        state.isAuthenticated = true
      }
      state.email = action.payload.email
      state.publicAddress = action.payload.publicAddress ?? null
      state.loading = action.payload.loading
      state.loginMethod = action.payload.loginMethod ?? null
      state.token = action.payload.token
    },

    logout(state) {
      state.isAuthenticated = false
      state.email = null
      state.publicAddress = null
      state.loading = false
      state.loginMethod = null
      state.token = null
    },

    loadingTrue(state) {
      state.loading = true
    },

    loadingFalse(state) {
      state.loading = false
    },
    setTempToken(state, action: PayloadAction<{ token: string | null }>) {
      state.token = action.payload.token
    },
    setCashAmount(state, action: PayloadAction<{ cashAmount: number }>) {
      state.cashAmount = action.payload.cashAmount
    },
    setCashLoading: (state, action: PayloadAction<boolean>) => {
      state.cashLoading = action.payload
    },
    clearWalletBalance: (state) => {
      state.cashAmount = 0
      state.cashLoading = false
    },
  },
})

export const {
  login,
  logout,
  loadingTrue,
  loadingFalse,
  setTempToken,
  setCashAmount,
  setCashLoading,
  clearWalletBalance,
} = authSlice.actions

export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectUserData = (state: { auth: AuthState }) => state.auth
export const selectUserLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectCashAmount = (state: { auth: AuthState }) => state.auth.cashAmount
export const selectPortfolioAmount = (state: { auth: AuthState }) => state.auth.portfolioAmount
export const selectLoginMethod = (state: { auth: AuthState }) => state.auth.loginMethod

export default authSlice.reducer
