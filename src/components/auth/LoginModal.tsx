import { useState } from "react"
import { useDispatch } from "react-redux"

import { useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import {
  useLoginMutation,
  useLoginWalletMutation,
  useVerifyWalletMutation,
} from "@/features/api/auth/authApi"
import { selectDeviceToken } from "@/features/auth/authSlice"
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
  const deviceToken = useAppSelector(selectDeviceToken)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/93"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-black border border-white/10 rounded-2xl p-6 shadow-[0px_4px_100px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl leading-none"
        >
          ✕
        </button>

        <h2 className="font-md sm:font-lg font-bold text-white mb-6 text-center">
          Welcome to OutcomeX
        </h2>

        {/* Google Login */}
        <Button
          className="w-full mb-5 bg-primary hover:bg-primary/80 text-black font-semibold py-3 rounded-2sm flex items-center justify-center gap-2"
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
              <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 font-xs sm:font-sm text-white/40">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email input */}
        <div className="flex flex-col sm:flex-row gap-4">
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
                deviceToken: deviceToken as string,
                onSuccess: () => {
                  setLoading(null)
                  onClose()
                },
                onError: () => setLoading(null),
              })
            }
            className="flex-1 bg-white/5 border font-medium border-white/10 rounded-2md px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 font-sm"
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
                deviceToken: deviceToken as string,
                onSuccess: () => {
                  setLoading(null)
                  onClose()
                },
                onError: () => setLoading(null),
              })
            }}
            disabled={!email || !!loading}
            className="bg-primary hover:bg-primary/80 rounded-sm text-black px-4"
          >
            {loading === "email" ? "..." : "Continue"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 font-xs sm:font-sm text-white/40">WALLETS</span>
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
              deviceToken: deviceToken as string,
              onSuccess: () => {
                setLoading(null)
                onClose()
              },
              onError: () => setLoading(null),
            })
          }}
          disabled={!!loading}
          className="w-full bg-slate hover:bg-primary hover:text-black border border-progress-bar text-white font-semibold py-3 rounded-2sm flex items-center justify-center gap-3"
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

        <p className="font-xs sm:font-sm text-white/30 text-center mt-5">Terms • Privacy</p>
      </div>
    </div>
  )
}
