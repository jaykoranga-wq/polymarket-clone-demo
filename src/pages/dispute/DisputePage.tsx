import { AlertTriangle, ArrowLeft, BarChart3, Clock, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Toaster } from "sonner"

import { useGetMarketByIdQuery, useGetOracleTimelineQuery } from "@/features/api/markets/marketApi"
import { extractDisputeData } from "@/features/markets/disputeHelpers"
import { useDisputeTransactions } from "@/hooks/dispute/useDisputeTransactions"

export const DisputePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    data: market,
    isLoading: marketLoading,
    isError: marketError,
  } = useGetMarketByIdQuery(id ?? "")
  const {
    data: timelineData,
    isLoading: timelineLoading,
    isError: timelineError,
  } = useGetOracleTimelineQuery(id ?? "")
  console.log("timelinedata", timelineData)

  // Derive the latest oracle state from the timeline
  const latestOracleAction: number | null = timelineData?.data?.length
    ? (timelineData.data[timelineData.data.length - 1]?.action ?? null)
    : null

  // RESOLUTION_ACTION.PROPOSE = 1 — only allow dispute in this state
  const PROPOSE = 1

  const disputeData = extractDisputeData(timelineData)

  const [countdown, setCountdown] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string>("")

  useEffect(() => {
    if (!disputeData?.proposedTimestamp) return

    const interval = setInterval(() => {
      const twoHoursInMs = 2 * 60 * 60 * 1000
      const proposedTime = new Date(disputeData.proposedTimestamp).getTime()
      const expiresAt = proposedTime + twoHoursInMs
      const now = Date.now()

      const distance = expiresAt - now
      if (distance < 0) {
        setCountdown("Expired")
        clearInterval(interval)
        return
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setCountdown(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(interval)
  }, [disputeData?.proposedTimestamp])

  const handleCancel = () => navigate(-1)

  const { approveUSDC, submitDisputeTransaction } = useDisputeTransactions()

  const handleSubmit = async () => {
    if (!disputeData) {
      setStatus("❌ Dispute data is unavailable. Please refresh and try again.")
      return
    }
    setIsSubmitting(true)
    setStatus("Initializing...")

    // Identifier must come from market object — timeline action=1 rows don't reliably include it
    const identifier = market?.oracleIdentifier
    if (!identifier) {
      setStatus("❌ Oracle identifier not found. Cannot raise dispute.")
      setIsSubmitting(false)
      return
    }

    try {
      // Step 1: Approve
      const oracleAddress =
        import.meta.env.VITE_ORACLE_ADDRESS ||
        import.meta.env.VITE_UMA_ADDRESS ||
        "0x0000000000000000000000000000000000000000"
      const approvalResult = await approveUSDC(
        oracleAddress,
        disputeData.bondAmount.toString(),
        setStatus,
      )

      if (!approvalResult.success) {
        throw new Error("USDC approval failed")
      }

      // Step 2: Submit Dispute
      const disputeResult = await submitDisputeTransaction(
        identifier, // sourced from market.oracleIdentifier — timeline rows don't include this
        BigInt(disputeData.bondAmount).toString(),
        setStatus,
      )

      if (!disputeResult.success) {
        throw new Error("Dispute submission failed")
      }

      // Step 3: Show success
      setStatus(`✅ Dispute raised successfully!
      
Approval Tx: ${approvalResult.txHash}
Dispute Tx: ${disputeResult.txHash}
      
The backend will automatically detect the AnswerDisputed event and update the database.`)

      // Auto close after 5 seconds
      setTimeout(() => {
        navigate(-1)
      }, 5000)
    } catch (err: unknown) {
      console.error(err)
      setStatus(
        `❌ Error: ${(err as { message: string }).message || "An unexpected error occurred."}`,
      )
    }

    setIsSubmitting(false)
  }

  if (marketLoading || timelineLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="font-xs font-black tracking-[0.4em] uppercase text-[#00FF87]/60">
          Syncing Protocol...
        </p>
      </div>
    )
  if (marketError || timelineError)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle className="text-red-500" size={48} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
          Protocol Link Failure
        </h2>
        <p className="text-white/60 max-w-xs text-sm uppercase tracking-widest leading-loose">
          Failed to load dispute data. Please refresh the connection.
        </p>
      </div>
    )
  if (!market || !disputeData)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <div className="p-4 bg-gray-500/10 border border-gray-500/20 mb-6">
          <AlertTriangle className="text-gray-500" size={48} />
        </div>
        <h2 className="font-2xl font-black uppercase tracking-tighter mb-2">Data Null</h2>
        <p className="text-gray-500 max-w-xs text-sm uppercase tracking-widest">
          No disputable answer found for this market.
        </p>
      </div>
    )

  // ── Guard: only allow dispute when oracle is in PROPOSE state (action=1)
  if (latestOracleAction !== PROPOSE)
    return (
      <div className="flex items-center justify-center md:min-h-screen  p-6">
        <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 py-5 px-6 rounded-lg max-w-md w-full relative overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="p-3 bg-option-no/10 border border-option-no rounded-lg">
              <AlertTriangle className="text-no" size={24} />
            </div>
            <h2 className="font-lg font-black uppercase tracking-wide">Dispute Unavailable</h2>
          </div>
          <p className="text-xs font-medium text-white/60 tracking-widest leading-loose mb-8">
            {latestOracleAction === 2 && "A dispute has already been raised for this market."}
            {latestOracleAction === 3 && "This dispute has already been settled by the admin."}
            {latestOracleAction === 4 &&
              "This market has been fully settled. No further disputes are possible."}
            {latestOracleAction == null && "The market is not in a disputable state."}
          </p>
          <button
            onClick={handleCancel}
            className="w-full font-default py-4 bg-primary hover:bg-primary/90 border rounded-2md border-white/5 text-black font-black uppercase  transition-all"
          >
            RETURN TO TERMINAL
          </button>
        </div>
      </div>
    )

  return (
    <div className="container mt-4 md:mt-6 mb-14 md:mb-20 ">
      <Toaster richColors position="top-center" />

      {/* Back button */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 py-2 px-4 rounded-sm font-base font-bold bg-primary  text-black hover:bg-primary/90 transition-colors mb-8 cursor-pointer  border-none"
      >
        <ArrowLeft size={14} /> BACK TO MARKET
      </button>

      {/* Header */}
      <div className="mb-12">
        <h1 className="font-2xl font-bold text-white mb-1.5 tracking-tighter">Raise Dispute</h1>
        <p className="font-default text-white/60 mb-6 ">Challenge the proposed oracle resolution</p>
        <div className="w-16 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(0,200,83,0.3)]"></div>
      </div>

      <div className="space-y-6">
        {/* Card 1: Market Information */}
        <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 rounded-lg transition-all duration-300 hover:border-white/10 group h-full py-5 px-6 relative overflow-hidden group">
          {/* Decorative background element */}
          {/* <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={120} strokeWidth={1} />
          </div> */}

          <div className="flex items-center gap-3 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#00FF87]"></div>
            <h2 className="font-base font-black text-primary/70 tracking-[0.25em] uppercase">
              Market Information
            </h2>
          </div>

          <div className="mb-10 relative z-10">
            <h3 className="font-xs font-bold text-white/60 mb-3 uppercase tracking-[0.2em]">
              Market Question
            </h3>
            <p className="font-2xl capitalize font-black tracking-tight leading-tight">
              {market.title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#18C96433] border border-white/5 rounded-2md">
                <Clock size={20} className="text-[#18C964]" />
              </div>
              <div className="space-y-1">
                <p className="font-xs font-black text-white/60 uppercase tracking-[0.2em]">
                  Time Remaining
                </p>
                <p
                  className={`font-lg font-black ${countdown === "Expired" ? "text-no" : "text-white"}`}
                >
                  {countdown || "Calculating..."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#2D7FF933] border border-white/5 rounded-2md">
                <BarChart3 size={20} className="text-[#2D7FF9]" />
              </div>
              <div className="space-y-1">
                <p className="font-xs font-black text-white/60 uppercase tracking-[0.2em]">
                  Proposed Outcome
                </p>
                <p className="font-lg font-black text-nowrap">TBD from Timeline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Dispute Details */}
        <div className="bg-linear-to-b from-white/5 to-white/2 border border-white/10 rounded-lg  transition-all duration-300 hover:border-white/10 group h-full py-5 px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#3b82f6]"></div>
            <h2 className="font-base font-black text-white tracking-[0.25em] uppercase">
              Dispute Details
            </h2>
          </div>

          <div className="mb-10">
            <h3 className="font-xs font-bold text-white/60 mb-4 uppercase tracking-[0.2em]">
              Oracle Identifier
            </h3>
            <div className="bg-linear  font-mono text-sm text-primary/80 break-all select-all ">
              {market.oracleIdentifier || "N/A"}
            </div>
          </div>

          <div className="relative  rounded-lg p-4 bg-white/5 border border-white/10">
            <h3 className="font-xs font-bold text-white/60 mb-3 uppercase tracking-[0.2em]">
              Required Bond Amount
            </h3>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-5">
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-black tracking-tighter ">
                  {disputeData.bondAmountUSDC}
                </span>
                <span className="text-3xl font-black text-white/40 uppercase ">USDC</span>
              </div>
              <div className="md:ml-auto">
                <span className="font-xs font-bold text-white tracking-[0.15em] uppercase">
                  {Number(disputeData.bondAmount).toLocaleString()} minor units
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Warning */}
        <div className="bg-option-no/25 border border-no/50 p-6 flex  rounded-lg flex-row items-start gap-5">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertTriangle size={24} className="text-no" />
          </div>
          <div className="space-y-2">
            <p className="font-base font-black text-no uppercase tracking-[0.25em]">
              Protocol Warning
            </p>
            <p className="text-sm text-white/60 font-medium leading-relaxed">
              You will need to approve 2 transactions:
              <div>
                {" "}
                1. USDC approval for{" "}
                <span className="text-white font-bold">{disputeData.bondAmountUSDC} USDC.</span>
              </div>
              2. Dispute submission to Oracle contract.
            </p>
          </div>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-[#00FF87]/5 border border-[#00FF87]/20 p-6 font-mono text-xs text-[#00FF87] whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-widest text-[10px] opacity-70">
              <Loader2 size={12} className={isSubmitting ? "animate-spin" : ""} />
              Execution Log
            </div>
            {status}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-5 pt-8">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 py-6 px-10 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] border border-white/10 text-white font-black uppercase tracking-[0.3em] text-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || countdown === "Expired"}
            className="flex-1 py-6 px-10 bg-primary rounded-lg hover:bg-primary/90 text-bold text-black font-black uppercase tracking-[0.3em] text-xs transition-all disabled:opacity-50 disabled:grayscale disabled:text-white flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98] shadow-[0_0_30px_rgba(0,255,135,0.2)]"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {countdown === "Expired" ? "Period Expired" : "Submit Dispute"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DisputePage
