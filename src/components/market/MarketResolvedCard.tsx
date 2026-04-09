// src/components/market/MarketResolvedCard.tsx

import { useNavigate } from "react-router"

interface MarketResolvedCardProps {
  winningOutcome: "YES" | "NO"
  resolutionTime: string
  marketId?: string
}

const formatMarketDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

function canRaiseDispute(proposedTimestamp: string): boolean {
  if (!proposedTimestamp) return false
  const twoHoursInMs = 2 * 60 * 60 * 1000
  const timeSinceProposal = Date.now() - new Date(proposedTimestamp).getTime()
  return timeSinceProposal > 0 && timeSinceProposal < twoHoursInMs
}

export const MarketResolvedCard = ({
  winningOutcome,
  resolutionTime,
  marketId,
}: MarketResolvedCardProps) => {
  const navigate = useNavigate()
  const isYesWon = winningOutcome === "YES"
  const color = isYesWon ? "#00c853" : "#e53935"

  // Enforce 2-hour window logic
  const disputeAllowed = canRaiseDispute(resolutionTime)

  const handleRaiseDispute = () => {
    navigate(`/dispute/${marketId ?? ""}`)
  }

  return (
    <div className="border  border-primary/50 rounded-2xl overflow-hidden  bg-linear-to-b from primary/10 to bg-primary/5 ">
      {/* Header */}
      <div className="p-4 text-center">
        <div className="font-base font-extrabold uppercase mb-1.5 text-primary/70  text-nowrap">
          Market Resolved
        </div>

        <div className="font-sm text-white">{formatMarketDate(resolutionTime)}</div>
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <div className="font-default fnt-bold  text-white mb-2.5">Outcome:</div>

        <div
          className="inline-block py-2 px-3.5 border rounded-full text-black font-sm font-black tracking-wider"
          style={{ background: color }}
        >
          {winningOutcome}
        </div>
      </div>

      {/* Dispute Section */}
      <div className="px-5 pb-5 text-center">
        {disputeAllowed ? (
          <button
            onClick={handleRaiseDispute}
            className="w-full py-2 px-4 rounded-xl border border-yellow-500/60 bg-yellow-500/10 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/20 transition-colors"
          >
            Raise Dispute
          </button>
        ) : (
          <p className="text-xs text-white/40 italic">Dispute Period Expired</p>
        )}
      </div>
    </div>
  )
}
