/**
 * loginHandlers.ts
 *
 * Pure async functions for user-initiated login actions.
 * Sibling to authChecks.ts (which handles session *restore* on refresh).
 * These handle active login attempts triggered by user button clicks.
 *
 * Each function receives its dependencies as parameters so it can be called
 * from any component without coupling to component internals.
 */

import { toast } from "sonner"

import type { AppDispatch } from "@/app/store"
import { loadingFalse, loadingTrue, login, setTempToken } from "@/features/auth/authSlice"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import type { Magic } from "@/features/auth/lib/magic"
import { clearMetaMaskLoggedOut } from "@/routes/utils"

import { switchToAmoy } from "./switchChain"

// ---------------------------------------------------------------------------
// Shared dependency types (minimal — only what we actually use)
// ---------------------------------------------------------------------------

type LoginFn = (args: {
  didToken: string
  deviceToken?: string | null
}) => Promise<{ data: { data: { token: string } } }>
type LoginWalletFn = (args: { publicAddress: string }) => Promise<{
  data: { data: { nonce: string; token: string } }
}>

//made device token an optional thing.
type VerifyWalletFn = (args: { signature: string; deviceToken?: string | null }) => Promise<{
  data: { data: { token: string } }
}>

// ---------------------------------------------------------------------------
// Email OTP login via Magic
// ---------------------------------------------------------------------------

export async function handleEmailLogin({
  email,
  magic,
  dispatch,
  loginToBackend,
  onSuccess,
  onError,
  deviceToken,
}: {
  email: string
  magic: Magic | null
  dispatch: AppDispatch
  loginToBackend: LoginFn
  onSuccess: () => void
  onError: () => void
  deviceToken: string | null | undefined
}): Promise<void> {
  if (!email || !magic) return

  dispatch(loadingTrue())
  try {
    await magic.auth.loginWithEmailOTP({ email })

    const userInfo = await magic.user.getInfo()
    const magicToken = await magic.user.getIdToken()

    const resultBackend = await loginToBackend({ didToken: magicToken, deviceToken }).then(
      (r) => r.data,
    )

    dispatch(
      login({
        email: userInfo.email ?? null,
        publicAddress: userInfo.wallets?.ethereum?.publicAddress ?? null,
        loading: false,
        loginMethod: LOGIN_METHODS.Email,
        token: resultBackend.data.token,
      }),
    )
    localStorage.setItem("isSignedIn", "true")
    localStorage.setItem("auth_token", resultBackend.data.token)
    localStorage.setItem("auth_method", LOGIN_METHODS.Email)

    onSuccess()
  } catch (err) {
    console.error("Email login failed:", err)
    toast.error("Email login failed", { description: `${err}` })
    onError()
  } finally {
    dispatch(loadingFalse())
  }
}

// ---------------------------------------------------------------------------
// Google OAuth via Magic (redirect-based — nothing runs after loginWithRedirect)
// ---------------------------------------------------------------------------

export async function handleGoogleLogin({
  magic,
  dispatch,
  onError,
}: {
  magic: Magic | null
  dispatch: AppDispatch
  onError: () => void
}): Promise<void> {
  if (!magic) return

  dispatch(loadingTrue())
  try {
    await magic.oauth2.loginWithRedirect({
      provider: "google",
      redirectURI: import.meta.env.VITE_REDIRECT_URL,
    })
    // Page navigates away — nothing past this line runs
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string }
    if (e?.code === -32603 || e?.message?.includes("User denied")) {
      onError()
      return
    }
    console.error("Google login failed:", err)
    toast.error("Google login failed", { description: `${err}` })
    onError()
  }
}

// ---------------------------------------------------------------------------
// MetaMask wallet login (challenge-response signature flow)
// ---------------------------------------------------------------------------

export async function handleMetaMaskLogin({
  dispatch,
  loginWallet,
  verifyWallet,
  onSuccess,
  onError,
  deviceToken,
}: {
  dispatch: AppDispatch
  loginWallet: LoginWalletFn
  verifyWallet: VerifyWalletFn
  onSuccess: () => void
  onError: () => void
  deviceToken: string | null | undefined
}): Promise<void> {
  if (!window.ethereum) {
    toast.error("MetaMask not installed!", {
      description: "Please install the MetaMask browser extension to continue.",
      action: {
        label: "Install",
        onClick: () => window.open("https://metamask.io/download/", "_blank"),
      },
    })
    return
  }

  dispatch(loadingTrue())

  try {
    // switching the chain to amoy
    await switchToAmoy()
    // Step 1: get wallet address
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as unknown as string[]
    const publicAddress = accounts[0]

    // Step 2: get nonce + temp token from backend
    dispatch(setTempToken({ token: null }))
    const {
      data: { nonce, token: tempToken },
    } = await loginWallet({ publicAddress: publicAddress as string }).then((r) => r.data)
    dispatch(setTempToken({ token: tempToken }))

    // Step 3: ask MetaMask to sign the nonce
    const signature = (await window.ethereum.request({
      method: "personal_sign",
      params: [nonce, publicAddress as string],
    })) as unknown as string

    // Step 4: verify signature with backend
    // Only include deviceToken in the payload when it is available
    const result = await verifyWallet({
      signature,
      ...(deviceToken ? { deviceToken } : {}),
    }).then((r) => r.data)

    // Step 5: store session
    clearMetaMaskLoggedOut()
    dispatch(
      login({
        email: null,
        publicAddress,
        loading: false,
        loginMethod: LOGIN_METHODS.MetaMask,
        token: result.data.token,
      }),
    )
    localStorage.setItem("auth_token", result.data.token)
    localStorage.setItem("auth_method", LOGIN_METHODS.MetaMask)
    localStorage.setItem("auth_address", publicAddress as string)
    localStorage.setItem("isSignedIn", "true")

    onSuccess()
  } catch (err: unknown) {
    const e = err as { code?: number }
    if (e?.code === 4001 || e?.code === -32603) {
      toast.info("Connection cancelled")
      onError()
      return
    }
    console.error("MetaMask login failed:", err)
    toast.error("MetaMask login failed", { description: `${err}` })
    onError()
  } finally {
    dispatch(loadingFalse())
  }
}
