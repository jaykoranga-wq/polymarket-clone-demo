export const MARKET_TYPES = {
  BINARY: "binary_market",
  MULTI_OPTION_BINARY: "multi_option_binary_market",
} as const

// This extracts "binary_market" | "multi_option_binary_market" | "multi_option_market" and so on .....
export type MarketType = (typeof MARKET_TYPES)[keyof typeof MARKET_TYPES]
