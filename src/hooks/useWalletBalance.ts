import { ethers } from "ethers"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import type { RootState } from "@/app/store"
import { useGetLockedBalanceQuery } from "@/features/api/auth/authApi"
import { reserveAmount, setCashAmount, setCashLoading } from "@/features/auth/authSlice"
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
  const { data: lockedData } = useGetLockedBalanceQuery()

  useEffect(() => {
    if (!address) return
    let lockedAmountBigint: bigint = 0n
    if (lockedData) {
      console.log(lockedData)
      // lockedAmount comes from backend in micro-USDC (same units as on-chain)
      lockedAmountBigint = BigInt(lockedData.data.lockedAmount)
    }
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
        // USDC has 6 decimals — hardcoded to avoid a second contract call
        const raw: bigint = await usdc.getFunction("balanceOf")(address)

        // raw is already a bigint from ethers (micro-USDC, 6 decimals)
        // store as string to keep Redux state serializable
        dispatch(setCashAmount({ cashAmount: raw.toString() }))

        // Lock the backend-reported reserved balance in redux
        console.log("locked balance (micro-USDC):", lockedAmountBigint)
        dispatch(reserveAmount(lockedAmountBigint.toString()))
      } catch (err) {
        console.error("Balance fetch failed:", err)
        dispatch(setCashAmount({ cashAmount: "0" }))
      } finally {
        dispatch(setCashLoading(false))
      }
    }

    fetchBalance()
  }, [address, lockedData])
}
