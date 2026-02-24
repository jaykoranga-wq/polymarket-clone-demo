import type { Market } from "./types"

export const MOCK_MARKETS: Market[] = [
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
      {
        date: "march 07",
        yesProbability: 7,
        noProbability: 93,
      },
      {
        date: "march 08",
        yesProbability: 10,
        noProbability: 90,
      },
      {
        date: "march 09",
        yesProbability: 2,
        noProbability: 98,
      },
    ],
  },
]

export const CATEGORIES = [
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
