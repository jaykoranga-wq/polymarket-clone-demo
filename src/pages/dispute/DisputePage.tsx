import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
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

  const [countdown, setCountdown] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string>("")

  const disputeData = extractDisputeData(timelineData)

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

    try {
      // Step 1: Approve
      const oracleAddress =
        import.meta.env.VITE_ORACLE_ADDRESS ||
        import.meta.env.VITE_UMA_ADDRESS ||
        "0x0000000000000000000000000000000000000000"
      const approvalResult = await approveUSDC(oracleAddress, disputeData.bondAmount, setStatus)

      if (!approvalResult.success) {
        throw new Error("USDC approval failed")
      }

      // Step 2: Submit Dispute
      const disputeResult = await submitDisputeTransaction(
        disputeData.identifier,
        disputeData.bondAmount,
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
      <div className="flex pt-20 justify-center min-h-screen text-white">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  if (marketError || timelineError)
    return (
      <div className="p-10 mt-10 text-[#e53935] text-center min-h-screen">
        Failed to load dispute data. Please try again.
      </div>
    )
  if (!market || !disputeData)
    return (
      <div className="p-10 mt-10 text-gray-500 text-center min-h-screen">
        No disputable answer found for this market.
      </div>
    )

  return (
    <div className="container py-10 max-w-2xl mx-auto text-white min-h-[80vh]">
      <Toaster richColors position="top-center" />
      <button
        onClick={handleCancel}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
      >
        <ArrowLeft size={16} /> Back to Market
      </button>

      <div className="bg-[#11141b] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="border-b border-white/10 p-6 bg-white/5">
          <h1 className="text-xl font-bold text-white mb-2">Raise Dispute</h1>
          <p className="text-sm text-gray-400">Challenge the proposed oracle resolution</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1: Market Info */}
          <section>
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Market Information
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 font-sm">
              <div>
                <span className="text-gray-500 block mb-1">Market Question</span>
                <span className="text-white font-medium">{market.title}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-gray-500">Proposed Outcome</span>
                {/* Normally we would map the outcome value or fetch it, placeholder for now */}
                <span className="text-white bg-white/10 px-2 py-0.5 rounded text-xs font-semibold">
                  TBD from Timeline
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-gray-500">Time Remaining</span>
                <span
                  className={`font-mono font-medium ${countdown === "Expired" ? "text-[#e53935]" : "text-yellow-400"}`}
                >
                  {countdown || "Calculating..."}
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Dispute Details */}
          <section>
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Dispute Details
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 font-sm">
              <div>
                <span className="text-gray-500 block mb-1">Oracle Identifier</span>
                <div className="font-mono text-xs bg-black/40 border border-white/5 rounded p-2 text-gray-400 break-all select-all">
                  {disputeData.identifier || "N/A"}
                </div>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Required Bond Amount</span>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">
                    {disputeData.bondAmountUSDC} USDC
                  </span>
                  <span className="text-gray-500 pb-1 text-xs">
                    ({disputeData.bondAmount} minor units)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Warning */}
          <section>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-500/90 text-sm">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium">You will need to approve 2 transactions:</p>
                <ol className="list-decimal pl-4 space-y-1 text-yellow-500/80">
                  <li>USDC approval for {disputeData.bondAmountUSDC} USDC</li>
                  <li>Dispute submission to Oracle contract</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Status Display */}
          {status && (
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm font-medium text-primary whitespace-pre-wrap">
              {status}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer bg-transparent"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || countdown === "Expired"}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {countdown === "Expired" ? "Period Expired" : "Submit Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DisputePage
