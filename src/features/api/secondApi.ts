import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

import type { RootState } from "@/app/store"
export const secondApi = createApi({
  reducerPath: "secondApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL_SECOND,

    prepareHeaders: (headers, { getState }) => {
      headers.set("ngrok-skip-browser-warning", "true")
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set("Authorization", `${token}`)
      }
      return headers
    },
  }),
  tagTypes: ["Markets", "Orders"],
  endpoints: () => ({}),
})
