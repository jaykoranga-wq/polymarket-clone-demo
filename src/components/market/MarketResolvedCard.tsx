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
  const bg = isYesWon ? "rgba(0,200,83,0.08)" : "rgba(229,57,53,0.08)"

  return (
    <div
      style={{
        background: "#161a22",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: bg,
          padding: "16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: color,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Market Resolved
        </div>

        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {formatMarketDate(resolutionTime)}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 10,
          }}
        >
          Outcome:
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: 20,
            background: color,
            color: "#000",
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: "0.05em",
          }}
        >
          {winningOutcome}
        </div>
      </div>
    </div>
  )
}
