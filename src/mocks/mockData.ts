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

const simulateDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Shared dummy data ────────────────────────────────────────────────────────

const DUMMY_PRICE_HISTORY = [
  { timestamp: "2024-10-01T00:00:00.000Z", yesPrice: 0.45 },
  { timestamp: "2024-10-02T00:00:00.000Z", yesPrice: 0.4 },
  { timestamp: "2024-10-03T00:00:00.000Z", yesPrice: 0.32 },
  { timestamp: "2024-10-04T00:00:00.000Z", yesPrice: 0.54 },
  { timestamp: "2024-10-05T00:00:00.000Z", yesPrice: 0.6 },
  { timestamp: "2024-10-06T00:00:00.000Z", yesPrice: 0.12 },
  { timestamp: "2024-10-07T00:00:00.000Z", yesPrice: 0.15 },
  { timestamp: "2024-10-08T00:00:00.000Z", yesPrice: 0.2 },
  { timestamp: "2024-10-09T00:00:00.000Z", yesPrice: 0.45 },
  { timestamp: "2024-10-10T00:00:00.000Z", yesPrice: 0.55 },
  { timestamp: "2024-10-11T00:00:00.000Z", yesPrice: 0.42 },
  { timestamp: "2024-10-12T00:00:00.000Z", yesPrice: 0.41 },
  { timestamp: "2024-10-25T00:00:00.000Z", yesPrice: 0.5 },
  { timestamp: "2024-10-29T00:00:00.000Z", yesPrice: 0.53 },
  { timestamp: "2024-11-01T00:00:00.000Z", yesPrice: 0.52 },
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

const RESOLVER = "0xabc123def456abc123def456abc123def456abc1"

// ─── Markets ──────────────────────────────────────────────────────────────────
// createdAt is ISO 8601 — this is exactly what your backend DB will return
// Format: "YYYY-MM-DDTHH:mm:ss.sssZ"
// NEVER use display formats like "Feb 10, 2024" — those are for UI only

export const RAW_MARKETS: Market[] = [
  // ── Existing markets (createdAt updated to ISO) ────────────────────────────
  {
    id: "1",
    title: "2024 Presidential Election Winner",
    category: "Politics",
    description:
      "Predict the outcome of the upcoming US Presidential Election. Over $142M in total trading volume.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1569285645462-a3f9c6332d56?q=80&w=1170&auto=format&fit=crop",
    expiryDate: "2024-11-05T00:00:00.000Z",
    yesProbability: 52,
    noProbability: 48,
    volume: "$142M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "2024-09-01T08:00:00.000Z", // ← ISO format
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "2",
    title: "US strikes Iran by end of March?",
    category: "Geopolitics",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1668076476189-7664ff0e7a91?q=80&w=1172&auto=format&fit=crop",
    expiryDate: "2024-03-31T00:00:00.000Z",
    yesProbability: 7,
    noProbability: 93,
    volume: "$308M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "2024-01-10T10:30:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "3",
    title: "How long will the DHS shutdown last?",
    category: "Politics",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2024-02-20T00:00:00.000Z",
    yesProbability: 7,
    noProbability: 93,
    volume: "$18M",
    frequency: "Daily",
    type: "binary_market",
    createdAt: "2024-01-15T14:00:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "4",
    title: "Khamenei out as Supreme Leader of Iran by March 31?",
    category: "Geopolitics",
    thumbnailUrl:
      "https://media.istockphoto.com/id/124638317/photo/ruhollah-musavi-khomeini.jpg?s=2048x2048&w=is&k=20&c=uKLf5xGfia4OcraqtZ7dYyzKLNchRzsH0yTLiXWM16A=",
    expiryDate: "2024-03-31T00:00:00.000Z",
    yesProbability: 40,
    noProbability: 60,
    volume: "$4.1M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "2024-02-01T09:15:00.000Z",
    resolver: RESOLVER,
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
    expiryDate: "2024-02-28T00:00:00.000Z",
    yesProbability: 7,
    noProbability: 93,
    volume: "$308M",
    frequency: "Monthly",
    type: "binary_market",
    createdAt: "2024-01-20T11:00:00.000Z",
    resolver: RESOLVER,
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
    expiryDate: "2024-02-10T05:30:00.000Z",
    yesProbability: 40,
    noProbability: 60,
    volume: "$4.1M",
    frequency: "Event",
    type: "binary_market",
    createdAt: "2024-02-10T00:00:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },

  // ── New markets ────────────────────────────────────────────────────────────
  {
    id: "7",
    title: "Will ETH reach $5000 before June 2026?",
    category: "Crypto",
    description:
      "Ethereum price prediction market. Resolves YES if ETH/USD hits $5000 on any major exchange.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-06-01T00:00:00.000Z",
    yesProbability: 38,
    noProbability: 62,
    volume: "$22M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "2026-03-11T07:00:00.000Z", // ← recent — will appear in "new markets"
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "8",
    title: "Will Fed cut rates in May 2026?",
    category: "Economics",
    description:
      "Resolves YES if the Federal Reserve announces a rate cut at the May 2026 FOMC meeting.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-05-15T00:00:00.000Z",
    yesProbability: 61,
    noProbability: 39,
    volume: "$55M",
    frequency: "Monthly",
    isTrending: false,
    type: "binary_market",
    createdAt: "2026-03-10T12:00:00.000Z", // ← recent
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "9",
    title: "Will Apple release AR glasses in 2026?",
    category: "Tech",
    description: "Resolves YES if Apple officially launches a consumer AR glasses product in 2026.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-12-31T00:00:00.000Z",
    yesProbability: 24,
    noProbability: 76,
    volume: "$9.4M",
    frequency: "Event",
    isTrending: false,
    type: "binary_market",
    createdAt: "2026-02-15T09:30:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "10",
    title: "Will Messi retire before end of 2026?",
    category: "Sports",
    description:
      "Resolves YES if Lionel Messi officially announces retirement from professional football.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-12-31T00:00:00.000Z",
    yesProbability: 33,
    noProbability: 67,
    volume: "$7.8M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "2026-01-05T15:00:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "11",
    title: "Will OpenAI release GPT-5 before July 2026?",
    category: "AI",
    description:
      "Resolves YES if OpenAI publicly releases a model officially named GPT-5 before July 1 2026.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-07-01T00:00:00.000Z",
    yesProbability: 55,
    noProbability: 45,
    volume: "$31M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "2026-03-12T06:00:00.000Z", // ← today — definitely "new"
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "12",
    title: "Will Bitcoin hit $150k in 2026?",
    category: "Crypto",
    description:
      "Resolves YES if BTC/USD price reaches $150,000 on any major exchange before Dec 31 2026.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1609554496796-c345a5335ceb?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-12-31T00:00:00.000Z",
    yesProbability: 44,
    noProbability: 56,
    volume: "$98M",
    frequency: "Event",
    isTrending: true,
    type: "binary_market",
    createdAt: "2026-01-20T10:00:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "13",
    title: "Will India win the 2026 Cricket World Cup?",
    category: "Sports",
    description: "Resolves YES if the Indian cricket team wins the ICC Cricket World Cup 2026.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2026-11-15T00:00:00.000Z",
    yesProbability: 29,
    noProbability: 71,
    volume: "$12M",
    frequency: "Event",
    isTrending: false,
    type: "binary_market",
    createdAt: "2026-03-11T20:00:00.000Z", // ← yesterday — new market
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
  {
    id: "14",
    title: "Will the US enter a recession in 2026?",
    category: "Economics",
    description:
      "Resolves YES if the NBER officially declares a US recession beginning in calendar year 2026.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400&auto=format&fit=crop",
    expiryDate: "2027-01-31T00:00:00.000Z",
    yesProbability: 42,
    noProbability: 58,
    volume: "$76M",
    frequency: "Event",
    isTrending: false,
    type: "binary_market",
    createdAt: "2026-02-28T08:00:00.000Z",
    resolver: RESOLVER,
    priceHistory: DUMMY_PRICE_HISTORY,
    orderBook: DUMMY_ORDER_BOOK,
    rules: DUMMY_RULES,
  },
]

const RAW_CATEGORIES: string[] = [
  "All Markets",
  "Politics",
  "Crypto",
  "AI",
  "Sports",
  "Economics",
  "Geopolitics",
  "Tech",
  "Trump",
  "Olympics",
  "Oscars",
  "Fed",
  "Gold",
  "Silver",
  "Space",
  "Earnings",
  "China",
]

// ─── Mock API Functions ───────────────────────────────────────────────────────

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

// ─── Static exports ───────────────────────────────────────────────────────────

export const MOCK_MARKETS: Market[] = RAW_MARKETS
export const CATEGORIES: string[] = RAW_CATEGORIES
