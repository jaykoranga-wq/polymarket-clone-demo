import { ethers } from "ethers"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { RootState } from "@/app/store"
import { setCashAmount, setCashLoading } from "@/features/auth/authSlice"
// import { ADDRESSES, ERC20_ABI } from "@/libs/contracts"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"

export const useWalletBalance = () => {
  const { magic } = useMagic()
  const dispatch = useDispatch()
  const loginMethod = useSelector((s: RootState) => s.auth.loginMethod)
  const address = useSelector((s: RootState) => s.auth.publicAddress)

  useEffect(() => {
    if (!address) return

    const fetchBalance = async () => {
      dispatch(setCashLoading(true))
      try {
        let provider: ethers.BrowserProvider

        if (loginMethod === LOGIN_METHODS.MetaMask) {
          if (!window.ethereum) throw new Error("MetaMask not found")
          provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider)
        } else {
          if (!magic?.rpcProvider) throw new Error("Magic provider not ready")
          provider = new ethers.BrowserProvider(magic.rpcProvider as ethers.Eip1193Provider)
        }

        const raw = await provider.getBalance(address) // ← one line, no contract
        const balance = Number(ethers.formatEther(raw)) // converts wei → MATIC

        console.log("MATIC balance:", balance)
        dispatch(setCashAmount({ cashAmount: balance }))
      } catch (err) {
        console.error("Balance fetch failed:", err)
        dispatch(setCashAmount({ cashAmount: 0 }))
      } finally {
        dispatch(setCashLoading(false))
      }
    }

    fetchBalance()
  }, [address])
}
