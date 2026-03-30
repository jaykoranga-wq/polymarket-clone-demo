// src/components/market/tabs/ActivityTab.tsx
// TODO: replace MOCK_ACTIVITY with useGetMarketActivityQuery(marketId) when API ready

import { formatMarketDate } from "@/libs/formatDate"
import { MOCK_ACTIVITY } from "@/mocks/mockActivity"

interface ActivityTabProps {
  marketId: string // ready for API call later
}

export const ActivityTab = ({ marketId: _ }: ActivityTabProps) => {
  // TODO: const { data: items = [] } = useGetMarketActivityQuery(marketId)
  const items = MOCK_ACTIVITY

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3.5">
        <span className="font-base font-bold text-white uppercase ">Recent Activity</span>
        <span className="font-base text-white/3">{items.length} trades</span>
      </div>

      {/* Column headers */}
      <div
        className="grid text-[10px] font-bold uppercase tracking-widest pb-2 border-b mb-1"
        style={{
          gridTemplateColumns: "1fr 56px 56px 72px 88px",
          color: "rgba(255,255,255,0.3)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <span>User</span>
        <span className="text-center">Action</span>
        <span className="text-center">Outcome</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Amount</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid items-center py-2.5 transition-colors hover:bg-white/[0.02] rounded-lg px-1"
            style={{
              gridTemplateColumns: "1fr 56px 56px 72px 88px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {/* User + time */}
            <div className="flex flex-col min-w-0">
              <span
                className="text-[12px] font-medium"
                style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}
              >
                {item.user}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                {formatMarketDate(item.timestamp)}
              </span>
            </div>

            {/* Action */}
            <span
              className="text-[11px] font-bold text-center"
              style={{ color: item.action === "Buy" ? "#00c853" : "#e53935" }}
            >
              {item.action}
            </span>

            {/* Outcome badge */}
            <div className="flex justify-center">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background:
                    item.outcome === "Yes" ? "rgba(0,200,83,0.12)" : "rgba(229,57,53,0.12)",
                  color: item.outcome === "Yes" ? "#00c853" : "#e53935",
                }}
              >
                {item.outcome}
              </span>
            </div>

            {/* Shares */}
            <span
              className="text-[12px] text-right font-medium"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {item.shares.toLocaleString()}
            </span>

            {/* USDC */}
            <span
              className="text-[12px] text-right font-medium"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              ${item.usdcAmount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
