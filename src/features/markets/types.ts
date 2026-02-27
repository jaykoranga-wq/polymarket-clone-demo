import type { MARKET_TYPES } from "../../constants/marketTypes"
export type MarketFrequency = "Daily" | "Monthly" | "Event"
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
}

export interface BinaryMarket extends BaseMarket {
  type: typeof MARKET_TYPES.BINARY
  yesProbability: number // 0 to 100
  noProbability: number // 0 to 100
}
export interface MultiOptionBinaryOption {
  date: string
  yesProbability: number
  noProbability: number
}
export interface MultiOptionBinaryMarket extends BaseMarket {
  type: typeof MARKET_TYPES.MULTI_OPTION_BINARY
  options: MultiOptionBinaryOption[]
}
// export interface MultioptionMarket extends BaseMarket {
//   type: typeof MARKET_TYPES.MULTI_OPTION
// }
export type Market = BinaryMarket | MultiOptionBinaryMarket

export interface MarketsState {
  list: Market[]
  loading: boolean
  error: string | null
  selectedCategory: string
  selectedMarket: Market | null
}
