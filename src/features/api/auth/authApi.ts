import { api } from "@/features/api/api"

type LoginResponse = {
  status: boolean
  statusCode: number
  message: string
  type: string
  data: {
    token: string
  }
}

type LogoutResponse = {
  status: boolean
  statusCode: number
  message: string
  type: string
}

type LoginWalletResponse = {
  statusCode: number
  status: boolean
  message: string
  type: string
  data: {
    nonce: string // the challenge message MetaMask will sign
    token: string // temp JWT — send in Authorization header for verify-wallet
  }
}

type VerifyWalletResponse = {
  statusCode: number
  status: boolean
  message: string
  type: string
  data: {
    token: string
  }
}

type ProfileResponse = {
  statusCode: number
  status: boolean
  message: string
  type: string
  data: {
    id: string
    name: string
  }
}

const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { didToken: string }>({
      query: ({ didToken }) => ({
        url: "/v1/user/login",
        method: "POST",
        body: { didToken },
      }),
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/v1/user/logout",
        method: "POST",
      }),
    }),
    //login walllet
    loginWallet: builder.mutation<LoginWalletResponse, { publicAddress: string }>({
      query: (body) => ({
        url: "/v1/user/login-wallet",
        method: "POST",
        body,
      }),
    }),

    //verify wallet re

    verifyWallet: builder.mutation<VerifyWalletResponse, { signature: string }>({
      query: (body) => ({
        url: "/v1/user/verify-wallet",
        method: "POST",
        body,
      }),
    }),
    Profile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: "/v1/user/profile",
        method: "GET",
      }),
    }),
  }),
})
export const {
  useLoginMutation,
  useLogoutMutation,
  useLoginWalletMutation,
  useVerifyWalletMutation,
  useProfileQuery,
} = authApi
