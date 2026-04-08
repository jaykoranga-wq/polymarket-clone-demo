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

// ── Typed contract interfaces ─────────────────────────────────────────────────
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

interface ExchangeContract extends ethers.BaseContract {
  nonces(addr: string): Promise<bigint>
}

const CTF_ABI = [
  "function setApprovalForAll(address operator, bool approved) returns (bool)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]

const EXCHANGE_ABI = ["function nonces(address) external view returns (uint256)"]

// ── Unit conversion reference ─────────────────────────────────────────────────
//
//  UI layer          Backend payload          On-chain (contract)
//  ─────────────     ───────────────          ───────────────────
//  limitCents  50    price  = 500_000         same (1e6 USDC units)
//  shares       1    shares = 100             sharesOnChain = 100 × 10_000 = 1_000_000
//
//  Backend reconstructs:
//    usdcRequired   = (price × shares) / 100   → (500_000 × 100) / 100 = 500_000
//    sharesOnChain  = shares × 10_000           → 100 × 10_000 = 1_000_000
//
//  So the struct must be signed with EXACTLY those values, and the payload
//  must carry the pre-scaled price/shares so the backend can reproduce them.

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

  // ── Step 1b: read on-chain nonce ──────────────────────────────────────────
  const getNonce = async (signer: ethers.JsonRpcSigner): Promise<bigint> => {
    const exchange = new ethers.Contract(
      ADDRESSES.CTFExchange,
      EXCHANGE_ABI,
      signer,
    ) as unknown as ExchangeContract
    return exchange.nonces(address!)
  }

  // ── Switch MetaMask to Polygon Amoy ───────────────────────────────────────
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

  // ── Step 2: approve USDC spending ────────────────────────────────────────
  const approveUSDC = async (signer: ethers.JsonRpcSigner, amount: bigint) => {
    const usdc = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, signer) as unknown as USDCContract
    const allowance = await usdc.allowance(address!, ADDRESSES.CTFExchange)
    if (allowance >= amount) return
    const tx = await usdc.approve(ADDRESSES.CTFExchange, ethers.MaxUint256)
    await tx.wait()
  }

  // ── Step 3: approve CTF token transfers ──────────────────────────────────
  const approveCTF = async (signer: ethers.JsonRpcSigner) => {
    const ctf = new ethers.Contract(
      ADDRESSES.ConditionalTokens,
      CTF_ABI,
      signer,
    ) as unknown as CTFContract
    const approved = await ctf.isApprovedForAll(address!, ADDRESSES.CTFExchange)
    if (approved) return
    const tx = await ctf.setApprovalForAll(ADDRESSES.CTFExchange, true)
    await tx.wait()
  }

  // ── Step 4: sign order (EIP-712) ──────────────────────────────────────────
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
        { name: "collateralToken", type: "address" },
        { name: "ctf", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "makerAmount", type: "uint256" },
        { name: "takerAmount", type: "uint256" },
        { name: "side", type: "uint256" },
        { name: "expiry", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "feeRateBps", type: "uint256" },
        { name: "signatureType", type: "uint8" },
      ],
    }

    // ── Derive the two values the backend will independently reconstruct ─────
    //
    //  payloadShares = userShares × 100          (e.g. 1 share → 100)
    //  payloadPrice  = limitCents × 10_000        (e.g. $0.50  → 500_000)
    //
    //  Backend formula:
    //    usdcRequired  = (payloadPrice × payloadShares) / 100
    //                  = (500_000 × 100) / 100 = 500_000          ✓
    //    sharesOnChain = payloadShares × 10_000
    //                  = 100 × 10_000 = 1_000_000                 ✓
    //
    //  The struct must be signed with EXACTLY usdcRequired / sharesOnChain
    //  so the backend's signature verification reproduces the same hash.

    const payloadPrice = BigInt((order.limitCents ?? 0) * 10_000) // 1e6 USDC units
    const payloadShares = BigInt(Math.round(order.shares ?? 0) * 100) // backend shares unit

    // FIX: was `(payloadPrice * payloadShares) / 100n` which introduced a
    // spurious extra /100 making usdcRequired 100× too small.
    const usdcRequired = payloadPrice * (payloadShares / 100n) // = price × userShares
    const sharesOnChain = payloadShares * 10_000n // = userShares × 1_000_000
    console.log("sending sharesonchain: ", sharesOnChain)
    const isBuy = order.action === "Buy"
    const nonce = await getNonce(signer)

    const orderStruct = {
      // FIX: was Date.now() — two orders placed within the same millisecond
      // would produce identical hashes → second one reverts as OrderFilledOrCancelled.
      salt: BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + BigInt(Date.now()),
      maker: address!,
      signer: address!,
      taker: ethers.ZeroAddress,
      collateralToken: ADDRESSES.USDC,
      ctf: ADDRESSES.ConditionalTokens,
      tokenId: BigInt(tokenId as string),
      // BUY  → maker spends USDC,   taker delivers outcome tokens
      // SELL → maker delivers tokens, taker pays USDC
      makerAmount: isBuy ? usdcRequired : sharesOnChain,
      takerAmount: isBuy ? sharesOnChain : usdcRequired,
      side: isBuy ? 0n : 1n,
      expiry: 0n,
      nonce: BigInt(nonce),
      feeRateBps: isBuy ? 200n : 0n,
      signatureType: 0n,
    }

    const signature = await signer.signTypedData(domain, types, orderStruct)
    return { orderStruct, signature }
  }

  // ── Main: executeTrade ────────────────────────────────────────────────────
  const executeTrade = async (order: TradeOrder) => {
    if (!address) return

    setIsTrading(true)
    setTradeError(null)

    try {
      const signer = await getSigner()

      setApprovalState("approving-usdc")
      if (order.action === "Buy") {
        const usdcAmount = BigInt(Math.round(order.amount ?? 0))
        await approveUSDC(signer, usdcAmount)
      }

      setApprovalState("approving-ctf")
      await approveCTF(signer)

      setApprovalState("signing")
      const { orderStruct, signature } = await signOrder(signer, order)

      const payload = {
        tokenId:
          order.outcome === "Yes" ? (order.yesTokenId as string) : (order.noTokenId as string),
        // Backend expects price in 1e6 units and shares in userShares×100 units.
        // These must match what was used to build the signed struct above.
        price: ((order.limitCents ?? 0) * 10_000).toString(), // e.g. "500000"
        shares: (Math.round(order.shares ?? 0) * 10_00_000).toString(), // e.g. "1000000"
        type: order.action === "Buy" ? 1 : 2,
        nonce: orderStruct.nonce.toString(),
        salt: orderStruct.salt.toString(),
        signature,
      }

      setApprovalState("submitting")
      await createOrder(payload).unwrap()

      toast.success("Order placed successfully", {
        duration: 3000,
        position: "top-right",
        style: { fontSize: "12px", padding: "8px 12px", maxWidth: "320px" },
      })

      // ── Redux: derive display price & shares ─────────────────────────────
      const marketPriceCents: number = (() => {
        if (order.orderType === "Limit") return order.limitCents ?? 0
        const isYes = order.outcome === "Yes" || order.outcome === "Up"
        return isYes
          ? ((selectedMarket as { yesProbability?: number })?.yesProbability ?? 0)
          : ((selectedMarket as { noProbability?: number })?.noProbability ?? 0)
      })()

      const computedShares: number = (() => {
        if (order.orderType === "Limit") return order.shares ?? 0
        if (order.action === "Sell") return order.shares ?? 0
        const pricePerShare = marketPriceCents / 100
        if (pricePerShare <= 0) return 0
        return Math.floor((order.amount ?? 0) / pricePerShare)
      })()

      dispatch(
        addOrder({
          id: `temp-${Date.now()}`,
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
          token: { title: "", id: "" },
        }),
      )

      const usdcDollars = order.amount ?? (computedShares * marketPriceCents) / 100
      const usdcToReserve = BigInt(Math.round(usdcDollars * 1_000_000)).toString()
      dispatch(reserveAmount(usdcToReserve))
    } catch (err: unknown) {
      console.error("Trade error:", err)
      let message = "Trade failed. Please try again."

      if (err instanceof Error) {
        // Wallet / ethers errors
        const code = (err as unknown as { code?: number | string }).code
        if (code === 4001 || err.message.includes('reason="rejected"')) {
          message = "Transaction rejected by user."
        } else if (err.message.includes("MetaMask not found")) {
          message = "MetaMask not found. Please install the MetaMask extension."
        } else if (err.message.includes("Magic not ready")) {
          message = "Wallet not ready. Please try again."
        } else if (err.message.includes("insufficient funds")) {
          message = "Insufficient funds for gas fees."
        } else if (err.message) {
          message = err.message
        }
      } else if (typeof err === "object" && err !== null) {
        // RTK Query / backend API errors: { status: number, data: { message: string } }
        const apiErr = err as { status?: number; data?: { message?: string; type?: string } }
        if (apiErr.data?.message) {
          message = apiErr.data.message
        }
      }

      setTradeError(message)
    } finally {
      setIsTrading(false)
      setApprovalState("idle")
    }
  }

  return { executeTrade, isTrading, tradeError, approvalState }
}
