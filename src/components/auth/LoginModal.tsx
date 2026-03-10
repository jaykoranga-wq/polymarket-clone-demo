import { useState } from "react"
import { useDispatch } from "react-redux"

import { Button } from "@/components/ui/button"
import {
  useLoginMutation,
  useLoginWalletMutation,
  useVerifyWalletMutation,
} from "@/features/api/auth/authApi"
import { useMagic } from "@/features/auth/lib/magic"
import {
  handleEmailLogin,
  handleGoogleLogin,
  handleMetaMaskLogin,
} from "@/features/auth/loginHandlers"

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

const States = {
  Email: "email",
  Google: "google",
  MetaMask: "metamask",
} as const

type States = (typeof States)[keyof typeof States]

export const LoginModal = ({ open, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState<States | null>(null)
  const { magic } = useMagic()
  const dispatch = useDispatch()
  const [loginToBackend] = useLoginMutation()
  const [loginWallet] = useLoginWalletMutation()
  const [verifyWallet] = useVerifyWalletMutation()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#11161C] border border-white/10 rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-white mb-6 text-center">Welcome to Polymarket</h2>

        {/* Google Login */}
        <Button
          className="w-full mb-5 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          onClick={() => {
            setLoading(States.Google)
            handleGoogleLogin({
              magic,
              dispatch,
              onError: () => setLoading(null),
            })
          }}
          disabled={!!loading}
        >
          {loading === "google" ? (
            "Redirecting..."
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#fff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#fff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#fff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 text-xs text-white/40">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email input */}
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              handleEmailLogin({
                email,
                magic,
                dispatch,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                loginToBackend: loginToBackend as any,
                onSuccess: () => {
                  setLoading(null)
                  onClose()
                },
                onError: () => setLoading(null),
              })
            }
            className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <Button
            onClick={() => {
              setLoading(States.Email)
              handleEmailLogin({
                email,
                magic,
                dispatch,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                loginToBackend: loginToBackend as any,
                onSuccess: () => {
                  setLoading(null)
                  onClose()
                },
                onError: () => setLoading(null),
              })
            }}
            disabled={!email || !!loading}
            className="bg-blue-500 hover:bg-blue-600 rounded-xl px-4"
          >
            {loading === "email" ? "..." : "Continue"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 text-xs text-white/40">WALLETS</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* MetaMask */}
        <Button
          onClick={() => {
            setLoading(States.MetaMask)
            handleMetaMaskLogin({
              dispatch,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              loginWallet: loginWallet as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              verifyWallet: verifyWallet as any,
              onSuccess: () => {
                setLoading(null)
                onClose()
              },
              onError: () => setLoading(null),
            })
          }}
          disabled={!!loading}
          className="w-full bg-[#1C2330] hover:bg-[#252D3A] border border-white/10 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-3"
        >
          {loading === "metamask" ? (
            "Connecting..."
          ) : (
            <>
              <span className="text-xl">🦊</span>
              Connect MetaMask
            </>
          )}
        </Button>

        <p className="text-xs text-white/30 text-center mt-5">Terms • Privacy</p>
      </div>
    </div>
  )
}
