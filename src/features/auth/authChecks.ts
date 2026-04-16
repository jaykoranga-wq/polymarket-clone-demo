/**
 * authChecks.ts
 *
 * Pure async functions for restoring user sessions on page load / refresh.
 * Each function accepts the dependencies it needs (magic, dispatch, loginToBackend)
 * so it can be called from any component — currently Home.tsx, eventually PublicLayout.tsx.
 *
 * Order of priority (run by checkAuth):
 *   1. Google OAuth redirect result  (highest priority)
 *   2. Existing Magic session        (email OTP or previous Google)
 *   3. MetaMask silent check         (localStorage token + no logout flag)
 */

import { toast } from "sonner"

import type { AppDispatch } from "@/app/store"
import { loadingFalse, loadingTrue, login } from "@/features/auth/authSlice"
import { LOGIN_METHODS, type LoginMethod } from "@/features/auth/authTypes/loginMethodsTypes"
import type { Magic } from "@/features/auth/lib/magic"
import { wasMetaMaskLoggedOut } from "@/routes/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Matches the shape returned by useLoginMutation / loginToBackend */
type LoginResult = {
  data: { token: string }
}

/** Minimal signature of the RTK mutation trigger we need */
type LoginFn = (args: {
  didToken: string
  deviceToken?: string | null
}) => Promise<{ data: LoginResult }>

// ---------------------------------------------------------------------------
// 1. Google OAuth redirect result
// ---------------------------------------------------------------------------

/**
 * Must run first on every page load.
 * Returns true if the current navigation is a return from a Google OAuth redirect.
 * When true, all other checks should be skipped.
 */
export async function checkGoogleRedirect(
  magic: Magic | null,
  dispatch: AppDispatch,
  loginToBackend: LoginFn,
  deviceToken?: string | null,
): Promise<boolean> {
  let resultFromBackend!: LoginResult
  let result: Awaited<ReturnType<NonNullable<Magic["oauth2"]["getRedirectResult"]>>> | undefined

  try {
    result = await magic?.oauth2.getRedirectResult()
    if (!result) return false

    const magicToken = result.magic.idToken
    resultFromBackend = await loginToBackend({
      didToken: magicToken,
      ...(deviceToken ? { deviceToken } : {}),
    }).then((r) => r.data)

    const meta = result.magic.userMetadata
    const publicAddress =
      meta.wallets?.ethereum?.publicAddress ??
      (meta as unknown as { publicAddress?: string })?.publicAddress ??
      null
    dispatch(
      login({
        email: meta.email ?? null,
        publicAddress,
        loading: false,
        loginMethod: LOGIN_METHODS.Google,
        token: resultFromBackend.data.token,
      }),
    )
    localStorage.setItem("isSignedIn", "true")
    localStorage.setItem("auth_token", resultFromBackend.data.token)
    localStorage.setItem("auth_method", LOGIN_METHODS.Google)
    localStorage.setItem("auth_address", publicAddress as string)
    return true
  } catch {
    // getRedirectResult throws when page load is NOT from a Google OAuth redirect — expected.
    if (result && !resultFromBackend) {
      toast.error("Google login failed")
    }
    dispatch(loadingFalse())
    return false
  }
}

// ---------------------------------------------------------------------------
// 2. Magic existing session (email OTP or previous Google)
// ---------------------------------------------------------------------------

/**
 * Checks whether the user has an active Magic session.
 * If yes, re-authenticates with the backend and restores Redux state.
 * Returns true if a session was found.
 */
export async function checkMagicSession(
  magic: Magic | null,
  dispatch: AppDispatch,
  loginToBackend: LoginFn,
  deviceToken?: string | null,
): Promise<boolean> {
  dispatch(loadingTrue())
  try {
    const isLoggedIn = await magic?.user.isLoggedIn()
    if (!isLoggedIn) return false

    const userInfo = await magic?.user.getInfo()
    const magicToken = await magic?.user.getIdToken()
    const resultFromBackend = await loginToBackend({
      didToken: (magicToken as string) ?? null,
      ...(deviceToken ? { deviceToken } : {}),
    }).then((r) => r.data)

    dispatch(
      login({
        email: userInfo?.email ?? null,
        publicAddress: userInfo?.wallets?.ethereum?.publicAddress ?? null,
        loading: false,
        loginMethod: LOGIN_METHODS.Email,
        token: resultFromBackend.data.token,
      }),
    )
    localStorage.setItem("isSignedIn", "true")
    return true
  } catch (err) {
    console.error("Magic session check failed:", err)
    return false
  } finally {
    dispatch(loadingFalse())
  }
}

// ---------------------------------------------------------------------------
// 3. MetaMask silent check (no popup)
// ---------------------------------------------------------------------------

/**
 * Reads the token/address from localStorage, validates it against the backend,
 * and restores Redux state silently only if the token is still valid.
 * Uses NO popup — eth_accounts is not needed since we already have the token.
 * Returns true if a valid stored session was found.
 */
export async function checkMetaMask(dispatch: AppDispatch): Promise<boolean> {
  try {
    const token = localStorage.getItem("auth_token")
    const method = localStorage.getItem("auth_method")
    const publicAddress = localStorage.getItem("auth_address")

    if (!window.ethereum || wasMetaMaskLoggedOut() || !token) return false

    // Validate the stored token with the backend before trusting it.
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL_SECOND}/v1/user/profile`, {
      headers: {
        Authorization: token,
        "ngrok-skip-browser-warning": "true",
      },
    })

    if (!res.ok) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_method")
      localStorage.removeItem("auth_address")
      localStorage.removeItem("isSignedIn")
      return false
    }

    dispatch(
      login({
        email: null,
        publicAddress,
        loading: false,
        loginMethod: method as LoginMethod,
        token,
      }),
    )
    localStorage.setItem("isSignedIn", "true")
    return true
  } catch (err) {
    console.error("MetaMask session check failed:", err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs auth checks in priority order, stopping at the first success.
 * deviceToken is optional — included in API calls only when present.
 */
export async function checkAuth(
  magic: Magic | null,
  dispatch: AppDispatch,
  loginToBackend: LoginFn,
  deviceToken?: string | null,
): Promise<void> {
  dispatch(loadingTrue())

  const isGoogleRedirect = await checkGoogleRedirect(magic, dispatch, loginToBackend, deviceToken)
  if (isGoogleRedirect) return

  const hasMagicSession = await checkMagicSession(magic, dispatch, loginToBackend, deviceToken)
  if (hasMagicSession) return

  const hasMetaMask = await checkMetaMask(dispatch)
  if (hasMetaMask) return

  // Nothing found — clear loading and mark as unauthenticated
  dispatch(
    login({
      email: null,
      publicAddress: null,
      loading: false,
      isAuthenticated: false,
      loginMethod: null,
      token: null,
    }),
  )
}
