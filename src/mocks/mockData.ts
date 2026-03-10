import type { Market } from "../features/markets/types"

// ─────────────────────────────────────────────────────────────────────────────
// This file simulates what your backend API will actually return.
// When the backend is ready, delete this file and replace the import in your
// components with the real RTK Query hook (e.g. useGetMarketsQuery).
//
// Backend endpoint this will eventually replace:
//   GET /api/markets          → returns ApiMarketsResponse
//   GET /api/markets/:id      → returns a single Market
//   GET /api/categories       → returns ApiCategoriesResponse
// ─────────────────────────────────────────────────────────────────────────────

// ─── API Response Shape ───────────────────────────────────────────────────────
// This is exactly what your backend should return.
// Show this to your backend dev so they match this contract.

export interface ApiMarketsResponse {
  success: boolean
  data: Market[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export interface ApiCategoriesResponse {
  success: boolean
  data: string[]
}

export interface ApiSingleMarketResponse {
  success: boolean
  data: Market
}

// ─── Simulated Network Delay ──────────────────────────────────────────────────
// Mimics a real API call with loading state.
// Remove this entire function when switching to real backend.

const simulateDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Raw Mock Data (matches backend DB shape) ─────────────────────────────────

const DUMMY_PRICE_HISTORY = [
  { timestamp: "Oct 1", yesPrice: 0.45 },
  { timestamp: "Oct 2", yesPrice: 0.4 },
  { timestamp: "Oct 2", yesPrice: 0.32 },
  { timestamp: "Oct 3", yesPrice: 0.54 },
  { timestamp: "Oct 5", yesPrice: 0.6 },
  { timestamp: "Oct 6", yesPrice: 0.12 },
  { timestamp: "Oct 7", yesPrice: 0.15 },
  { timestamp: "Oct 8", yesPrice: 0.2 },
  { timestamp: "Oct 9", yesPrice: 0.45 },
  { timestamp: "Oct 10", yesPrice: 0.55 },
  { timestamp: "Oct 11", yesPrice: 0.42 },
  { timestamp: "Oct 12", yesPrice: 0.41 },
  { timestamp: "Oct 13", yesPrice: 0.42 },
  { timestamp: "Oct 14", yesPrice: 0.45 },
  { timestamp: "Oct 25", yesPrice: 0.5 },
  { timestamp: "Oct 29", yesPrice: 0.53 },
  { timestamp: "Nov 1", yesPrice: 0.52 },
]

const DUMMY_ORDER_BOOK = {
  yes: [
    { price: 0.54, shares: 12400 },
    { price: 0.52, shares: 8700 },
    { price: 0.5, shares: 5200 },
    { price: 0.48, shares: 3100 },
    { price: 0.46, shares: 1800 },
  ],
  no: [
    { price: 0.46, shares: 11200 },
    { price: 0.44, shares: 7500 },
    { price: 0.42, shares: 4300 },
    { price: 0.4, shares: 2600 },
    { price: 0.38, shares: 900 },
  ],
}

const DUMMY_RULES = `This market resolves YES if the outcome is confirmed by a majority of credible sources including Reuters, AP, or BBC before the expiry date. Resolution will be determined by the market admin within 48 hours of the event conclusion. In the case of ambiguity or conflicting reports, the market may be extended or resolved as N/A.`

// ─── Markets ──────────────────────────────────────────────────────────────────

export const RAW_MARKETS: Market[] = [
  {
    id: "1",
    title: "2024 Presidential Election Winner",
    category: "Trump",
    description:
      "Predict the outcome of the upcoming US Presidential Election. Over $142M in total trading volume.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1569285645462-a3f9c6332d56?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    expiryDate: "November 5th, 2024",
    yesProbability: 52,
    noProbability: 48,
    volume: "$142M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "Sep 1, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "2",
    title: "US strikes Iran by...?",
    category: "Texas",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1668076476189-7664ff0e7a91?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    expiryDate: "February 20",
    yesProbability: 7,
    noProbability: 93,
    volume: "$308M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "Jan 10, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "3",
    title: "How long will the DHS shutdown last?",
    category: "Fed",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&auto=format&fit=crop",
    expiryDate: "February 20",
    yesProbability: 7,
    noProbability: 93,
    volume: "$18M",
    frequency: "Daily",
    type: "binary_market",
    createdAt: "Jan 15, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "4",
    title: "Khamenei out as Supreme Leader of Iran by March 31?",
    category: "Epstein",
    thumbnailUrl:
      "https://media.istockphoto.com/id/124638317/photo/ruhollah-musavi-khomeini.jpg?s=2048x2048&w=is&k=20&c=uKLf5xGfia4OcraqtZ7dYyzKLNchRzsH0yTLiXWM16A=",
    expiryDate: "March 31",
    yesProbability: 40,
    noProbability: 60,
    volume: "$4.1M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "Feb 1, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "5",
    title: "Which company has best AI model end of February?",
    category: "AI",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop",
    expiryDate: "February 28",
    yesProbability: 7,
    noProbability: 93,
    volume: "$308M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "Jan 20, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "6",
    title: "BTC 5 Minute Up or Down",
    category: "Crypto",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=400&auto=format&fit=crop",
    expiryDate: "5:30 AM",
    yesProbability: 40,
    noProbability: 60,
    volume: "$4.1M",
    frequency: "Event",
    type: "binary_market",
    createdAt: "Feb 10, 2024",
    resolver: "0xabc123def456abc123def456abc123def456abc1",
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  // {
  //   id: "7",
  //   title: "US strikes Iran by...?",
  //   category: "Texas",
  //   thumbnailUrl:
  //     "https://images.unsplash.com/photo-1532187863486-abf51ad9f69d?q=80&w=400&auto=format&fit=crop",
  //   expiryDate: "February 20",
  //   volume: "$308M",
  //   frequency: "Monthly",
  //   type: "multi_option_binary_market",
  //   createdAt: "Jan 5, 2024",
  //   resolver: "0xabc123def456abc123def456abc123def456abc1",
  //   options: [
  //     { date: "march 07", yesProbability: 7,  noProbability: 93 },
  //     { date: "march 08", yesProbability: 10, noProbability: 90 },
  //     { date: "march 09", yesProbability: 2,  noProbability: 98 },
  //   ],
  //   priceHistory: DUMMY_PRICE_HISTORY,
  //   orderBook: DUMMY_ORDER_BOOK,
  //   rules: DUMMY_RULES,
  // },
]

const RAW_CATEGORIES: string[] = [
  "All Markets",
  "Trump",
  "Olympics",
  "Oscars",
  "Texas",
  "Tweet",
  "Markets",
  "Epstein",
  "AI",
  "SOTU",
  "Fed",
  "Gold",
  "Silver",
  "Space",
  "XIPOs",
  "Earnings",
  "China",
]

// ─── Mock API Functions ───────────────────────────────────────────────────────
// These functions mimic async API calls.
// When backend is ready, delete these and use RTK Query hooks instead.

/** GET /api/markets */
export const fetchMarkets = async (): Promise<ApiMarketsResponse> => {
  await simulateDelay()
  return {
    success: true,
    data: RAW_MARKETS,
    meta: {
      total: RAW_MARKETS.length,
      page: 1,
      pageSize: 20,
    },
  }
}

/** GET /api/markets/:id */
export const fetchMarketById = async (id: string): Promise<ApiSingleMarketResponse> => {
  await simulateDelay()
  const market = RAW_MARKETS.find((m) => m.id === id)
  if (!market) throw new Error(`Market with id "${id}" not found`)
  return {
    success: true,
    data: market,
  }
}

/** GET /api/categories */
export const fetchCategories = async (): Promise<ApiCategoriesResponse> => {
  await simulateDelay()
  return {
    success: true,
    data: RAW_CATEGORIES,
  }
}

// ─── Static exports (for components that don't need async yet) ────────────────
// You can keep using these directly in components until RTK Query is wired up.

export const MOCK_MARKETS: Market[] = RAW_MARKETS
export const CATEGORIES: string[] = RAW_CATEGORIES
