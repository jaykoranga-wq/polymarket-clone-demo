// src/components/market/MarketResolvedCard.tsx

interface MarketResolvedCardProps {
  winningOutcome: "YES" | "NO"
  resolutionTime: string
}

const formatMarketDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const MarketResolvedCard = ({ winningOutcome, resolutionTime }: MarketResolvedCardProps) => {
  const isYesWon = winningOutcome === "YES"

  const color = isYesWon ? "#00c853" : "#e53935"

  return (
    <div
      className="border border-primary/50 rounded-2xl overflow-hidden  bg-linear-to-b from primary/10 to bg-primary/5 "
      // style={{
      //   background: bg,
      // }}
    >
      {/* Header */}
      <div className="p-4 text-center">
        <div
          className="font-base font-extrabold uppercase mb-1.5 text-primary/70  text-nowrap"
          // style={{
          //   color: color,
          // }}
        >
          Market Resolved
        </div>

        <div className="font-sm text-white">{formatMarketDate(resolutionTime)}</div>
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <div className="font-default fnt-bold  text-white mb-2.5">Outcome:</div>

        <div
          className="inline-block py-2 px-3.5 border rounded-full text-black font-sm font-black tracking-wider"
          style={{
            background: color,
          }}
        >
          {winningOutcome}
        </div>
      </div>
    </div>
  )
}
