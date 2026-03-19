import type { FC } from "react"

interface PercentageBarProps {
  yesPercentage: number
  noPercentage: number
  hideLabels?: boolean
}

export const PercentageBar: FC<PercentageBarProps> = ({
  yesPercentage,
  noPercentage,
  hideLabels,
}) => {
  return (
    <div className="w-full flex flex-col gap-1">
      {/* bar */}
      <div
        className="w-full overflow-hidden"
        style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}
      >
        <div
          style={{
            height: "100%",
            width: `${yesPercentage}%`,
            background: "#00c853",
            borderRadius: 99,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* labels */}
      {!hideLabels && (
        <div className="flex justify-between">
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00c853" }}>{yesPercentage}%</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e53935" }}>{noPercentage}%</span>
        </div>
      )}
    </div>
  )
}
