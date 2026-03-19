// orderApi.ts

import { secondApi } from "../secondApi"
import type { CreateOrderRequest, CreateOrderResponse } from "./orderApiTypes"

export const orderApi = secondApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: "/v1/order",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Orders"],
    }),
  }),
})

export const { useCreateOrderMutation } = orderApi
