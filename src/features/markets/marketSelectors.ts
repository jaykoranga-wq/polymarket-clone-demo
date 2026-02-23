import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "../../app/store";

export const selectMarketsState = (state: RootState) => state.markets;

export const selectAllMarkets = createSelector(
  [selectMarketsState],
  (marketsState) => marketsState.list
);

export const selectMarketsLoading = createSelector(
  [selectMarketsState],
  (marketsState) => marketsState.loading
);

export const selectSelectedCategory = createSelector(
  [selectMarketsState],
  (marketsState) => marketsState.selectedCategory
);

export const selectFilteredMarkets = createSelector(
  [selectAllMarkets, selectSelectedCategory],
  (markets, category) => {
    if (category === "All Markets") return markets;
    return markets.filter((market) => market.category === category);
  }
);

export const selectTrendingMarkets = createSelector(
  [selectAllMarkets],
  (markets) => markets.filter((market) => market.isTrending)
);
