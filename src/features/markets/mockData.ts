import type { Market } from "./types"

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

const RAW_MARKETS: Market[] = [
  {
    id: "1",
    title: "2024 Presidential Election Winner",
    category: "Trump",
    description:
      "Predict the outcome of the upcoming US Presidential Election. Over $142M in total trading volume.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1580130718766-1aa747a54e2d?q=80&w=400&auto=format&fit=crop",
    expiryDate: "November 5th, 2024",
    yesProbability: 52,
    noProbability: 48,
    volume: "$142M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
  },
  {
    id: "2",
    title: "US strikes Iran by...?",
    category: "Texas",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1532187863486-abf51ad9f69d?q=80&w=400&auto=format&fit=crop",
    expiryDate: "February 20",
    yesProbability: 7,
    noProbability: 93,
    volume: "$308M",
    frequency: "Monthly",
    type: "binary_market",
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
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
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
  },
  {
    id: "4",
    title: "Khamenei out as Supreme Leader of Iran by March 31?",
    category: "Epstein",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=400&auto=format&fit=crop",
    expiryDate: "March 31",
    yesProbability: 40,
    noProbability: 60,
    volume: "$4.1M",
    frequency: "Monthly",
    type: "binary_market",
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
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
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
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
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
  },
  {
    id: "7",
    title: "US strikes Iran by...?",
    category: "Texas",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1532187863486-abf51ad9f69d?q=80&w=400&auto=format&fit=crop",
    expiryDate: "February 20",
    volume: "$308M",
    frequency: "Monthly",
    type: "multi_option_binary_market",
    options: [
      { date: "march 07", yesProbability: 7, noProbability: 93 },
      { date: "march 08", yesProbability: 10, noProbability: 90 },
      { date: "march 09", yesProbability: 2, noProbability: 98 },
    ],
    priceHistory: [
      { timestamp: "Oct 1", yesPrice: 0.45 },
      { timestamp: "Oct 8", yesPrice: 0.47 },
      { timestamp: "Oct 15", yesPrice: 0.44 },
      { timestamp: "Oct 22", yesPrice: 0.5 },
      { timestamp: "Oct 29", yesPrice: 0.53 },
      { timestamp: "Nov 1", yesPrice: 0.52 },
    ],
  },
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
