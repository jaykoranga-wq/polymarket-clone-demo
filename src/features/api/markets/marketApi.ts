import type { ApiMarketListResponse } from "@/features/markets/apiTypes/marketApiTypes"
import type { Market } from "@/features/markets/types"

import { api } from "../api"

const marketApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMarkets: builder.query<Market[], void>({
      query: () => "/v1/user/marketplace",
      transformResponse: (res: ApiMarketListResponse) =>
        res.data.data.map((m) => ({
          id: m.id,
          title: m.title,
          thumbnailUrl: m.displayImageUrl ?? "",
          expiryDate: new Date(m.resolutionTime).toLocaleDateString(),
          category: m.category.name,
          volume: `$${m.optionGroups[0]?.tokens.reduce((s, t) => s + t.volume, 0)}`,
          yesProbability: 50, // not in response yet — default for now
          noProbability: 50,
          frequency: "Event",
          type: "binary_market",
          createdAt: m.createdAt,
        })),
      providesTags: ["Markets"],
    }),
  }),
})
export const { useGetMarketsQuery } = marketApi
