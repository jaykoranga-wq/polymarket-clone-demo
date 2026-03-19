import type { LoginMethod } from "./loginMethodsTypes"

export interface AuthState {
  isAuthenticated: boolean
  email: string | null
  publicAddress: string | null // for wallet later
  loading: true | false
  portfolioAmount?: number
  cashAmount?: number
  reservedAmount: number // USDC locked in pending/partial orders
  availableAmount: number // cashAmount - reservedAmount (always derived)
  loginMethod: LoginMethod
  token: string | null
  cashLoading: boolean
  isAuthChecking: boolean
}
