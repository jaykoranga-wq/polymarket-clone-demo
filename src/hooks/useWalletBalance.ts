import { ethers } from "ethers"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { RootState } from "@/app/store"
import { setCashAmount, setCashLoading } from "@/features/auth/authSlice"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"

// ← paste your USDC contract address from Magic wallet here
const USDC_ADDRESS = "0xb157f0dD6859722AfE1A5b4D983b94db1468b15A"

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]

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

        // ← USDC is an ERC-20 contract, not native token
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)
        const [raw, decimals] = await Promise.all([
          usdc.getFunction("balanceOf")(address),
          usdc.getFunction("decimals")(),
        ])

        // USDC has 6 decimals (not 18 like POL)
        // formatUnits handles it automatically
        const balance = Number(ethers.formatUnits(raw, decimals))

        console.log("USDC balance:", balance)
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
