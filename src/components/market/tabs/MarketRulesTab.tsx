// src/components/market/tabs/MarketRulesTab.tsx

import { useState } from "react"

import { formatMarketDate } from "@/libs/formatDate"
import { MOCK_MARKET_RULES } from "@/mocks/mockMarketRules"

const RULES_MAX = 200

interface MarketRulesTabProps {
  description: string | undefined
  volume: number
  resolutionTime: string | undefined
  createdAt: string | undefined
}

export const MarketRulesTab = ({
  description,
  volume,
  resolutionTime,
  createdAt,
}: MarketRulesTabProps) => {
  const [rulesOpen, setRulesOpen] = useState(false)

  const rules = description ?? ""
  const rulesPreview =
    rules.length > RULES_MAX && !rulesOpen ? rules.slice(0, RULES_MAX) + "…" : rules

  return (
    <div className="ep-section">
      {/* ── Description / Rules text ── */}
      {rules ? (
        <>
          <p className="ep-rules-text">{rulesPreview}</p>
          {rules.length > RULES_MAX && (
            <button className="ep-rules-toggle" onClick={() => setRulesOpen((p) => !p)}>
              {rulesOpen ? "▲ Show less" : "▼ Show more"}
            </button>
          )}
        </>
      ) : (
        <p className="ep-rules-text">No description provided.</p>
      )}

      {/* ── Market meta grid ── */}
      <div className="ep-meta-grid">
        <div>
          <div className="ep-meta-label">Volume</div>
          <div className="ep-meta-value">${volume.toLocaleString()}</div>
        </div>
        <div>
          <div className="ep-meta-label">End Date</div>
          <div className="ep-meta-value">{formatMarketDate(resolutionTime)}</div>
        </div>
        {createdAt && (
          <div>
            <div className="ep-meta-label">Created</div>
            <div className="ep-meta-value">{formatMarketDate(createdAt)}</div>
          </div>
        )}

        {/* ── Resolution info from mock — swap with API later ── */}
        {/* TODO: replace MOCK_MARKET_RULES with market.resolutionSource from API */}
        <div>
          <div className="ep-meta-label">Resolution Source</div>
          <div className="ep-meta-value" style={{ fontSize: 12 }}>
            {MOCK_MARKET_RULES.source}
          </div>
        </div>
        <div>
          <div className="ep-meta-label">Resolution Deadline</div>
          <div className="ep-meta-value">{formatMarketDate(MOCK_MARKET_RULES.deadline)}</div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="ep-meta-label">Notes</div>
          <div
            className="ep-meta-value"
            style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}
          >
            {MOCK_MARKET_RULES.notes}
          </div>
        </div>
      </div>
    </div>
  )
}
