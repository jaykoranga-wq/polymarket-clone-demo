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
        {/* <span className="font-base font-bold text-white uppercase ">Recent Activity</span> */}
        <span className="font-sm text-primary">{items.length} trades</span>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="min-w-sm">
          {/* Column headers */}
          <div
            className="grid font-xs text-white font-bold uppercase tracking-widest pb-2 border-b border-white/6 mb-1 px-1"
            style={{
              gridTemplateColumns: "repeat(5, 1fr)",
            }}
          >
            <span>User</span>
            <span className="text-center">Action</span>
            <span className="text-center">Outcome</span>
            <span className="text-center">Shares</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid items-center border-b border-b-white/4 py-2.5 transition-colors hover:bg-white/2 rounded-lg px-1"
                style={{
                  gridTemplateColumns: "repeat(5, 1fr)",
                }}
              >
                {/* User + time */}
                <div className="flex flex-col min-w-0">
                  <span className="font-base font-medium text-white">{item.user}</span>
                  <span className="font-xs text-white/25">{formatMarketDate(item.timestamp)}</span>
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
                  className="font-base text-center font-medium"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {item.shares.toLocaleString()}
                </span>

                {/* Amount */}
                <div className="flex justify-end pr-1">
                  <div className="flex items-center gap-1.5 bg-white/4  py-1 rounded-md">
                    <span className="text-[12px] font-bold text-white">
                      ${item.usdcAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
