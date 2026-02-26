import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  publicAddress: string | null // for wallet later
  loading: true | false
}

const initialState: AuthState = {
  isAuthenticated: false,
  email: null,
  publicAddress: null,
  loading: false,
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
    },
    logout(state) {
      state.isAuthenticated = false
      state.email = null
      state.publicAddress = null
      state.loading = false
    },
    loadingTrue(state) {
      state.loading = true
    },
  },
})

export const { login, logout, loadingTrue } = authSlice.actions
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectUserData = (state: { auth: AuthState }) => state.auth
export const selectUserLoading = (state: { auth: AuthState }) => state.auth.loading
export default authSlice.reducer
