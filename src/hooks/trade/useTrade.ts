import { ethers } from "ethers"
import { useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "sonner"

import { useAppDispatch } from "@/app/hooks"
import type { RootState } from "@/app/store"
import { useCreateOrderMutation } from "@/features/api/orders/orderApi"
import { reserveAmount } from "@/features/auth/authSlice"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"
import { addOrder } from "@/features/orders/orderSlice"
import { ADDRESSES, ERC20_ABI } from "@/libs/contracts"

import type { TradeOrder } from "./TradeTypes"

// ── Typed contract interfaces — eliminates "possibly undefined" errors ────────
interface USDCContract extends ethers.BaseContract {
  allowance(owner: string, spender: string): Promise<bigint>
  approve(spender: string, amount: bigint): Promise<ethers.ContractTransactionResponse>
}

interface CTFContract extends ethers.BaseContract {
  isApprovedForAll(owner: string, operator: string): Promise<boolean>
  setApprovalForAll(
    operator: string,
    approved: boolean,
  ): Promise<ethers.ContractTransactionResponse>
}

const CTF_ABI = [
  "function setApprovalForAll(address operator, bool approved) returns (bool)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]

// ─────────────────────────────────────────────────────────────────────────────

export const useTrade = () => {
  const { magic } = useMagic()
  const dispatch = useAppDispatch()
  const loginMethod = useSelector((s: RootState) => s.auth.loginMethod)
  const address = useSelector((s: RootState) => s.auth.publicAddress)
  const selectedMarket = useSelector((s: RootState) => s.markets.selectedMarket)
  const [isTrading, setIsTrading] = useState(false)
  const [tradeError, setTradeError] = useState<string | null>(null)
  const [approvalState, setApprovalState] = useState<
    "idle" | "approving-usdc" | "approving-ctf" | "signing" | "submitting"
  >("idle")

  //api calls
  const [createOrder] = useCreateOrderMutation()

  // ── Step 1: get signer ────────────────────────────────────────────────────
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

  // ── Switch MetaMask to Polygon Amoy ──────────────────────────────────────
  const switchToAmoy = async () => {
    try {
      await window?.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x13882" }] as unknown[],
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
          ] as unknown[],
        })
      }
    }
  }

  // ── Step 2: approve USDC spending (one-time per wallet) ──────────────────
  const approveUSDC = async (signer: ethers.JsonRpcSigner, amount: bigint) => {
    const usdc = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, signer) as unknown as USDCContract

    // check existing allowance — skip tx if already sufficient
    const allowance = await usdc.allowance(address!, ADDRESSES.CTFExchange)
    if (allowance >= amount) {
      console.log("USDC already approved ✅ skipping")
      return
    }

    // approve unlimited so user never needs to approve again
    const tx = await usdc.approve(ADDRESSES.CTFExchange, ethers.MaxUint256)
    await tx.wait()
    console.log("USDC approved ✅")
  }

  // ── Step 3: approve CTF share transfers (one-time per wallet) ────────────
  const approveCTF = async (signer: ethers.JsonRpcSigner) => {
    const ctf = new ethers.Contract(
      ADDRESSES.ConditionalTokens,
      CTF_ABI,
      signer,
    ) as unknown as CTFContract

    // check first — skip tx if already approved
    const approved = await ctf.isApprovedForAll(address!, ADDRESSES.CTFExchange)
    if (approved) {
      console.log("CTF already approved ✅ skipping")
      return
    }

    const tx = await ctf.setApprovalForAll(ADDRESSES.CTFExchange, true)
    await tx.wait()
    console.log("CTF approved ✅")
  }

  // ── Step 4: sign order (EIP-712 — free, no gas) ───────────────────────────
  const signOrder = async (signer: ethers.JsonRpcSigner, order: TradeOrder) => {
    const tokenId = order.outcome === "Yes" ? order.yesTokenOnChainId : order.noTokenOnChainId

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

    const priceInt = BigInt(order.limitCents ?? 0)
    console.log("priceincents", priceInt)

    // shares as integer
    const sharesInt = BigInt(Math.round(order.shares ?? 0))
    console.log("shares", sharesInt)

    // match backend scaling EXACTLY
    const usdcRequired = priceInt * sharesInt * 10000n
    const sharesRequired = sharesInt * 100n
    console.log("usdc:", usdcRequired)
    console.log("sharesRequired:", sharesRequired)

    const orderStruct = {
      salt: BigInt(Date.now()),
      maker: address!,
      signer: address!,
      taker: ethers.ZeroAddress,
      tokenId: BigInt(tokenId as string),
      makerAmount: order.action === "Buy" ? usdcRequired : sharesRequired,
      takerAmount: order.action === "Buy" ? sharesRequired : usdcRequired,
      expiration: order.expirationEnabled ? BigInt(Math.floor(Date.now() / 1000) + 3600) : 0n,
      nonce: BigInt(Math.floor(Math.random() * 1e9)),
      feeRateBps: 200n,
      side: order.action === "Buy" ? 0n : 1n,
      signatureType: 0n,
    }
    console.log("working fine till here ")

    // pops Magic / MetaMask "Sign" popup — free, no gas
    const signature = await signer.signTypedData(domain, types, orderStruct)
    return { orderStruct, signature }
  }

  // ── Main: executeTrade ────────────────────────────────────────────────────
  const executeTrade = async (order: TradeOrder) => {
    if (!address) return

    setIsTrading(true)

    setTradeError(null)

    try {
      // 1. get signer
      const signer = await getSigner()
      console.log("signer ready:", signer)

      // 2. approve USDC if buying (skips if already approved)
      setApprovalState("approving-usdc")
      if (order.action === "Buy") {
        const usdcAmount = BigInt(Math.round(order.amount ?? 0))
        await approveUSDC(signer, usdcAmount)
      }

      // 3. approve CTF share transfers (skips if already approved)

      setApprovalState("approving-ctf")
      await approveCTF(signer)

      // 4. sign the order — free, no gas
      setApprovalState("signing")
      const { orderStruct, signature } = await signOrder(signer, order)

      console.log("order ready to send:", { orderStruct, signature })

      // 5. TODO: POST to backend when endpoint is ready
      // await postOrder({ order: orderStruct, signature }).unwrap()
      console.log("limitCents: ", order.limitCents)
      console.log("shares: ", order.shares)

      const payload = {
        tokenId:
          order.outcome === "Yes" ? (order.yesTokenId as string) : (order.noTokenId as string),

        price: ((order.limitCents ?? 0) * 10000).toString(),

        type: order.action === "Buy" ? 1 : 2,

        shares: (Math.round(order.shares ?? 0) * 100).toString(),

        nonce: orderStruct.nonce.toString(),
        salt: orderStruct.salt.toString(),

        signature,
      }

      console.log("sending payload:", payload)
      setApprovalState("submitting")

      const res = await createOrder(payload).unwrap()

      console.log("order created:", res)
      toast.success("Order placed successfully", {
        duration: 3000,
        position: "top-right",
        style: { fontSize: "12px", padding: "8px 12px", maxWidth: "320px" },
      })

      // ── Derive price & shares for market orders ────────────────────────────
      // For Limit orders we already have limitCents + shares from the panel.
      // For Market orders: price = current market probability in cents;
      //   Buy  → shares are estimated from (amount / (price¢/100))
      //   Sell → shares come directly from what the user entered (order.shares)
      const marketPriceCents: number = (() => {
        if (order.orderType === "Limit") return order.limitCents ?? 0
        // Pick yes or no price from redux market state
        const isYes = order.outcome === "Yes" || order.outcome === "Up"
        return isYes
          ? ((selectedMarket as { yesProbability?: number })?.yesProbability ?? 0)
          : ((selectedMarket as { noProbability?: number })?.noProbability ?? 0)
      })()

      const computedShares: number = (() => {
        // Limit orders: shares already typed by user
        if (order.orderType === "Limit") return order.shares ?? 0
        // Market Sell: user typed shares directly
        if (order.action === "Sell") return order.shares ?? 0
        // Market Buy: estimate shares = amount / (marketPriceCents / 100)
        const pricePerShare = marketPriceCents / 100
        if (pricePerShare <= 0) return 0
        return Math.floor((order.amount ?? 0) / pricePerShare)
      })()

      dispatch(
        addOrder({
          id: `temp-${Date.now()}`, // replace with real ID from backend response
          marketId: order.marketId,
          marketTitle: selectedMarket?.title as string,
          outcome: order.outcome,
          side: order.action,
          orderType: order.orderType,
          price: marketPriceCents,
          originalShares: computedShares,
          filledShares: 0,
          remainingShares: computedShares,
          usdcAmount: order.amount ?? (computedShares * marketPriceCents) / 100,
          status: "pending",
          createdAt: new Date().toISOString(),
        }),
      )

      // Lock the USDC in the user's balance until this order is filled or cancelled
      const usdcToReserve = order.amount ?? (computedShares * marketPriceCents) / 100
      dispatch(reserveAmount(usdcToReserve))
      console.log("Trade submitted ✅")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Trade failed"
      console.error("Trade error:", err)
      setTradeError(message)
    } finally {
      setIsTrading(false)
      setApprovalState("idle")
    }
  }

  return { executeTrade, isTrading, tradeError, approvalState }
}
