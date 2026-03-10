import type { MARKET_TYPES } from "./marketTypes"

export type MarketFrequency = "Daily" | "Monthly" | "Event"

// ─── Detail-only types (optional — only present on event detail page) ─────────

export interface PricePoint {
  timestamp: string // e.g. "Oct 6", "5:00"
  yesPrice: number // 0.0 to 1.0
}

export interface OrderEntry {
  price: number // 0.0 to 1.0
  shares: number
}

export interface OrderBook {
  yes: OrderEntry[]
  no: OrderEntry[]
}

// ─── Base ─────────────────────────────────────────────────────────────────────

export interface BaseMarket {
  id: string
  title: string
  description?: string
  category: string
  thumbnailUrl: string
  expiryDate: string
  volume: string
  frequency: MarketFrequency
  isTrending?: boolean

  // optional detail fields — not present on card, loaded on event page
  rules?: string
  createdAt?: string
  resolver?: string
  priceHistory?: PricePoint[]
  orderBook?: OrderBook
}

// ─── Binary Market ────────────────────────────────────────────────────────────

export interface BinaryMarket extends BaseMarket {
  type: typeof MARKET_TYPES.BINARY
  yesProbability: number // 0 to 100
  noProbability: number // 0 to 100
}

// ─── Multi Option Binary ──────────────────────────────────────────────────────

export interface MultiOptionBinaryOption {
  date: string
  yesProbability: number
  noProbability: number
}

export interface MultiOptionBinaryMarket extends BaseMarket {
  type: typeof MARKET_TYPES.MULTI_OPTION_BINARY
  options: MultiOptionBinaryOption[]
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type Market = BinaryMarket | MultiOptionBinaryMarket

// ─── Redux State ──────────────────────────────────────────────────────────────

export interface MarketsState {
  list: Market[]
  loading: boolean
  error: string | null
  selectedCategory: string
  selectedMarket: Market | null
}
