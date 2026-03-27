import type {
  ApiMarketListResponse,
  ApiSingleMarketResponse,
} from "@/features/markets/apiTypes/marketApiTypes"
import type { Market } from "@/features/markets/types"

import { secondApi } from "../secondApi"

const mapApiMarketToMarket = (m: ApiMarketListResponse["data"]["data"][number]): Market => {
  const tokens = m.optionGroups?.[0]?.tokens ?? []
  const yesToken = tokens.find((t) => t.title === "Yes")
  const noToken = tokens.find((t) => t.title === "No")
  const now = Date.now()
  const isResolved = new Date(m.resolutionTime).getTime() < now
  console.log("isresolved: ", isResolved)
  return {
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    image: m.displayImageUrl ?? "",
    resolutionTime: m.resolutionTime,
    category: m.category?.name ?? "Unknown",
    createdAt: m.createdAt,

    yesVolume: yesToken?.volume ?? 0,
    noVolume: noToken?.volume ?? 0,

    yesProbability: 50,
    noProbability: 50,

    collateralToken: "dummy",
    conditionId: "dummy",
    yesTokenId: yesToken?.id ?? null,
    noTokenId: noToken?.id ?? null,
    yesTokenOnChainId: yesToken?.tokenId ?? null,
    noTokenOnChainId: noToken?.tokenId ?? null,

    frequency: "Event",
  } satisfies Market
}

const marketApi = secondApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─────────────────────────────────────────────
    // GET ALL MARKETS
    // ─────────────────────────────────────────────
    getMarkets: builder.query<Market[], void>({
      query: () => "/v1/user/marketplace",

      transformResponse: (res: ApiMarketListResponse): Market[] =>
        res.data.data.map(mapApiMarketToMarket),

      providesTags: ["Markets"],
    }),

    // ─────────────────────────────────────────────
    // GET MARKET BY ID
    // ─────────────────────────────────────────────
    getMarketById: builder.query<Market, string>({
      query: (marketId) => ({
        url: `/v1/user/marketplace/fetchSpecific`,
        params: { marketId },
      }),

      transformResponse: (res: ApiSingleMarketResponse): Market => {
        const m = res.data.data

        const tokens = m.optionGroups?.[0]?.tokens ?? []
        const yesToken = tokens.find((t) => t.title === "Yes")
        const noToken = tokens.find((t) => t.title === "No")

        return {
          id: m.id,
          title: m.title,
          description: m.description ?? "",
          image: m.displayImageUrl ?? "",
          category: m.category?.name ?? "Unknown",
          resolutionTime: m.resolutionTime,
          createdAt: m.createdAt,

          yesVolume: yesToken?.volume ?? 0,
          noVolume: noToken?.volume ?? 0,

          yesProbability: 50,
          noProbability: 50,

          collateralToken: "dummy",
          conditionId: "dummy",
          yesTokenId: yesToken?.id ?? null,
          noTokenId: noToken?.id ?? null,
          yesTokenOnChainId: yesToken?.tokenId ?? null,
          noTokenOnChainId: noToken?.tokenId ?? null,
        } satisfies Market
      },

      providesTags: ["Markets"],
    }),

    searchMarkets: builder.query<Market[], string>({
      query: (searchString) => ({
        url: "/v1/user/marketplace",
        params: {
          limit: 10,
          sortKey: "createdAt",
          sortDirection: "DESC",
          searchString,
        },
      }),

      transformResponse: (res: ApiMarketListResponse): Market[] =>
        res.data.data.map(mapApiMarketToMarket),

      providesTags: ["Markets"],
    }),

    getMarketsByCategory: builder.query<Market[], string>({
      query: (categoryId) => ({
        url: "/v1/user/marketplace",
        params: {
          categoryId,
          limit: 10,
          sortKey: "createdAt",
          sortDirection: "DESC",
        },
      }),

      transformResponse: (res: ApiMarketListResponse): Market[] =>
        res.data.data.map(mapApiMarketToMarket),

      providesTags: ["Markets"],
    }),
  }),
})

export const {
  useGetMarketsQuery,
  useGetMarketByIdQuery,
  useSearchMarketsQuery,
  useGetMarketsByCategoryQuery,
} = marketApi
