import { ethers } from "ethers"
import { useState } from "react"
import { useSelector } from "react-redux"

import type { RootState } from "@/app/store"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"
import { ADDRESSES } from "@/libs/contracts"

import type { TradeOrder } from "./TradeTypes"

// ── minimal ABI for CTF and approvals ────────────────────────────────────────
// const CTF_ABI = [
//   "function setApprovalForAll(address operator, bool approved) returns (bool)",
//   "function isApprovedForAll(address owner, address operator) view returns (bool)",
// ]

export const useTrade = () => {
  const { magic } = useMagic()
  const loginMethod = useSelector((s: RootState) => s.auth.loginMethod)
  const address = useSelector((s: RootState) => s.auth.publicAddress)

  const [isTrading, setIsTrading] = useState(false)
  const [tradeError, setTradeError] = useState<string | null>(null)

  // ── Step 1: get signer (works for all login methods) ────────────────────
  const getSigner = async (): Promise<ethers.JsonRpcSigner> => {
    let provider: ethers.BrowserProvider

    if (loginMethod === LOGIN_METHODS.MetaMask) {
      if (!window.ethereum) throw new Error("MetaMask not found")
      await switchToAmoy()
      provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider)
    } else {
      if (!magic?.rpcProvider) throw new Error("Magic not ready")
      provider = new ethers.BrowserProvider(magic.rpcProvider as ethers.Eip1193Provider)
    }

    return provider.getSigner()
  }

  // later i have to change it to polygon when deploying.
  const switchToAmoy = async () => {
    try {
      await window?.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13882" }],
      })
    } catch (err: unknown) {
      if ((err as { code: number }).code === 4902) {
        await window?.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13882",
              chainName: "Polygon Amoy Testnet",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: ["https://rpc-amoy.polygon.technology"],
              blockExplorerUrls: ["https://amoy.polygonscan.com"],
            },
          ],
        })
      }
    }
  }

  // ── Step 2: approve USDC (one-time) ──────────────────────────────────────
  //   const approveUSDC = async (signer: ethers.JsonRpcSigner, amount: bigint) => {
  //     const usdc    = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, signer)
  //     const tx      = await usdc.getFunction("approve")(ADDRESSES.CTFExchange, amount)
  //     await tx.wait()
  //     console.log("USDC approved ✅")
  //   }

  // ── Step 3: approve CTF shares (one-time) ────────────────────────────────
  //   const approveCTF = async (signer: ethers.JsonRpcSigner) => {
  //     const ctf       = new ethers.Contract(ADDRESSES.ConditionalTokens, CTF_ABI, signer)
  //     const approved  = await ctf.getFunction("isApprovedForAll")(address, ADDRESSES.CTFExchange)
  //     if (!approved) {
  //       const tx = await ctf.getFunction("setApprovalForAll")(ADDRESSES.CTFExchange, true)
  //       await tx.wait()
  //       console.log("CTF approved ✅")
  //     }
  //   }

  // ── Step 4: sign the order (EIP-712 — free, no gas) ──────────────────────
  const signOrder = async (signer: ethers.JsonRpcSigner, order: TradeOrder) => {
    const tokenId = order.outcome === "Yes" ? order.yesTokenId : order.noTokenId

    const domain = {
      name: "PolymarketCTFExchange",
      version: "1",
      chainId: 80002n,
      verifyingContract: ADDRESSES.CTFExchange,
    }

    const types = {
      Order: [
        { name: "salt", type: "uint256" },
        { name: "maker", type: "address" },
        { name: "signer", type: "address" },
        { name: "taker", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "makerAmount", type: "uint256" },
        { name: "takerAmount", type: "uint256" },
        { name: "expiration", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "feeRateBps", type: "uint256" },
        { name: "side", type: "uint8" },
        { name: "signatureType", type: "uint8" },
      ],
    }

    const usdcAmount = BigInt(Math.round((order.amount ?? 0) * 1e6)) // USDC 6 decimals
    const sharesAmount = BigInt(Math.round((order.shares ?? 0) * 1e6))

    const orderStruct = {
      salt: BigInt(Date.now()),
      maker: address!,
      signer: address!,
      taker: "0x0000000000000000000000000000000000000000",
      tokenId: BigInt(tokenId),
      makerAmount: order.action === "Buy" ? usdcAmount : sharesAmount,
      takerAmount: order.action === "Buy" ? sharesAmount : usdcAmount,
      expiration: order.expirationEnabled ? BigInt(Math.floor(Date.now() / 1000) + 3600) : 0n,
      nonce: 0n,
      feeRateBps: 200n,
      side: order.action === "Buy" ? 0n : 1n,
      signatureType: 0n,
    }

    const signature = await signer.signTypedData(domain, types, orderStruct)
    return { orderStruct, signature }
  }

  // ── Main trade function ───────────────────────────────────────────────────
  const executeTrade = async (order: TradeOrder) => {
    if (!address) return
    setIsTrading(true)
    setTradeError(null)

    try {
      const signer = await getSigner()
      console.log("got the signer:", signer)

      // approvals (one-time — check before every trade, skips if already done)
      //   if (order.action === "Buy") {
      //     const usdcAmount = BigInt(Math.round((order.amount ?? 0) * 1e6))
      //     // await approveUSDC(signer, usdcAmount)
      //   }
      //   await approveCTF(signer)

      // sign the order
      const { orderStruct, signature } = await signOrder(signer, order)

      // send to your backend
      // TODO: replace with your real RTK Query mutation when ready
      console.log("order ready to send:", { orderStruct, signature })
      // await postOrder({ order: orderStruct, signature }).unwrap()

      console.log("Trade submitted ✅")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Trade failed"
      console.error("Trade error:", err)
      setTradeError(message)
    } finally {
      setIsTrading(false)
    }
  }

  return { executeTrade, isTrading, tradeError }
}
