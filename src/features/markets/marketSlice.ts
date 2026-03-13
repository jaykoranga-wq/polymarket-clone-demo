import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Market, MarketsState } from "./types"

const initialState: MarketsState = {
  list: [],
  loading: false,
  error: null,
  selectedCategory: "",
  selectedMarket: null,
}

const marketSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setMarkets: (state, action: PayloadAction<Market[]>) => {
      state.list = action.payload
      state.loading = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.loading = false
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload
    },
    setSelectedMarket: (state, action: PayloadAction<Market | null>) => {
      state.selectedMarket = action.payload
    },
  },
})

export const { setMarkets, setLoading, setError, setSelectedCategory, setSelectedMarket } =
  marketSlice.actions
export default marketSlice.reducer
