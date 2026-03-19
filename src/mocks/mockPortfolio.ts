// src/mocks/mockPortfolio.ts
// Replace each export with API call when backend is ready:
//   const { data: positions } = useGetPositionsQuery()
//   const { data: orders }    = useGetOrdersQuery()
//   const { data: history }   = useGetHistoryQuery()

import {
  HISTORY_TYPE,
  type HistoryType,
  ORDER_STATUS,
  type OrderStatus,
  POSITION_SIDE,
  type PositionSide,
} from "@/pages/portfolio/portfolioConstants"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Position {
  id: string
  marketId: string
  marketTitle: string
  category: string
  tags?: string[] // e.g. ["Closing Soon"]
  side: PositionSide
  shares: number
  avgPrice: number // cents e.g. 67
  nowPrice: number // cents e.g. 89
  invested: number // USDC
  value: number // current USDC value
}

export interface PortfolioOrder {
  id: string
  marketId: string
  marketTitle: string
  category: string
  side: PositionSide
  orderType: "Limit" | "Market"
  shares: number
  price: number // cents
  filled: number // shares filled
  status: OrderStatus
  createdAt: string // ISO
  expiresAt?: string
}

export interface HistoryItem {
  id: string
  marketId: string
  marketTitle: string
  category: string
  type: HistoryType
  side: PositionSide
  shares: number
  price: number // cents
  total: number // USDC
  pnl?: number // only for sell/redeem
  settledAt: string // ISO
}

export interface PortfolioChartPoint {
  day: number // 1–30
  value: number // portfolio USD value
}

// ── Mock positions ────────────────────────────────────────────────────────────
export const MOCK_POSITIONS: Position[] = [
  {
    id: "pos-001",
    marketId: "m-001",
    marketTitle: "Will Bitcoin reach $150K by end of 2026?",
    category: "Crypto",
    side: POSITION_SIDE.YES,
    shares: 750,
    avgPrice: 67,
    nowPrice: 89,
    invested: 502.5,
    value: 667.5,
  },
  {
    id: "pos-002",
    marketId: "m-002",
    marketTitle: "Will AI create 10M+ new jobs in 2026?",
    category: "Tech",
    side: POSITION_SIDE.YES,
    shares: 600,
    avgPrice: 42,
    nowPrice: 56,
    invested: 252.0,
    value: 336.0,
  },
  {
    id: "pos-003",
    marketId: "m-003",
    marketTitle: "US GDP growth above 3% in 2026?",
    category: "Economy",
    side: POSITION_SIDE.NO,
    shares: 850,
    avgPrice: 42,
    nowPrice: 34,
    invested: 357.0,
    value: 289.0,
  },
  {
    id: "pos-004",
    marketId: "m-004",
    marketTitle: "Will new federal election happen in 2026?",
    category: "Politics",
    tags: ["Closing Soon"],
    side: POSITION_SIDE.NO,
    shares: 1200,
    avgPrice: 66,
    nowPrice: 76,
    invested: 792.0,
    value: 912.0,
  },
  {
    id: "pos-005",
    marketId: "m-005",
    marketTitle: "Major tech IPO valued over $50B in Q1 2026?",
    category: "Tech",
    side: POSITION_SIDE.YES,
    shares: 450,
    avgPrice: 55,
    nowPrice: 65,
    invested: 247.5,
    value: 292.5,
  },
  {
    id: "pos-006",
    marketId: "m-006",
    marketTitle: "S&P 500 above 6500 by June 2026?",
    category: "Finance",
    side: POSITION_SIDE.YES,
    shares: 900,
    avgPrice: 71,
    nowPrice: 82,
    invested: 639.0,
    value: 738.0,
  },
]

// ── Mock orders ───────────────────────────────────────────────────────────────
export const MOCK_PORTFOLIO_ORDERS: PortfolioOrder[] = [
  {
    id: "ord-001",
    marketId: "m-001",
    marketTitle: "Will Bitcoin reach $150K by end of 2026?",
    category: "Crypto",
    side: POSITION_SIDE.YES,
    orderType: "Limit",
    shares: 200,
    price: 65,
    filled: 0,
    status: ORDER_STATUS.PENDING,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "ord-002",
    marketId: "m-007",
    marketTitle: "Will Fed cut rates before Q3 2026?",
    category: "Economy",
    side: POSITION_SIDE.NO,
    orderType: "Limit",
    shares: 500,
    price: 38,
    filled: 200,
    status: ORDER_STATUS.PARTIAL,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "ord-003",
    marketId: "m-003",
    marketTitle: "US GDP growth above 3% in 2026?",
    category: "Economy",
    side: POSITION_SIDE.YES,
    orderType: "Limit",
    shares: 300,
    price: 44,
    filled: 0,
    status: ORDER_STATUS.PENDING,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

// ── Mock history ──────────────────────────────────────────────────────────────
export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "his-001",
    marketId: "m-008",
    marketTitle: "Will Apple release AR glasses in 2025?",
    category: "Tech",
    type: HISTORY_TYPE.REDEEM,
    side: POSITION_SIDE.NO,
    shares: 400,
    price: 100,
    total: 400.0,
    pnl: 156.0,
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "his-002",
    marketId: "m-009",
    marketTitle: "Will GPT-5 launch before 2026?",
    category: "AI",
    type: HISTORY_TYPE.SELL,
    side: POSITION_SIDE.YES,
    shares: 250,
    price: 72,
    total: 180.0,
    pnl: -42.5,
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "his-003",
    marketId: "m-010",
    marketTitle: "Will India win T20 World Cup 2025?",
    category: "Sports",
    type: HISTORY_TYPE.BUY,
    side: POSITION_SIDE.YES,
    shares: 600,
    price: 58,
    total: 348.0,
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "his-004",
    marketId: "m-011",
    marketTitle: "Will Elon Musk remain CEO of X in 2025?",
    category: "Business",
    type: HISTORY_TYPE.SELL,
    side: POSITION_SIDE.YES,
    shares: 150,
    price: 81,
    total: 121.5,
    pnl: 34.5,
    settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
]

// ── Mock chart data ───────────────────────────────────────────────────────────
export const MOCK_PORTFOLIO_CHART: PortfolioChartPoint[] = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: Math.round(22000 + (i / 29) * 7000 + (Math.random() - 0.3) * 800),
}))

// ── Mock stats ────────────────────────────────────────────────────────────────
export const MOCK_PORTFOLIO_STATS = {
  totalValue: 4685.0,
  available: 8234.67,
  pastMonthPnl: 540.0,
  pastMonthPct: 13.03,
  activePositions: 10,
  potentialValue: 3111.0,
  portfolioValue: 28589.54,
  portfolioDelta: 10158.69,
  portfolioDeltaPct: 55.12,
}
