import { type FC, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Toaster } from "sonner"

import { MyCarousel } from "@/components/custom/MyCarousel"
import { HeroBanner } from "@/components/layout/HeroBanner"
import { MarketGrid } from "@/components/market/MarketGrid"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { useGetMarketsQuery } from "@/features/api/markets/marketApi"
import { selectUserLoading } from "@/features/auth/authSlice"
import { selectFilteredMarkets, selectTrendingMarkets } from "@/features/markets/marketSelectors"
import { setMarkets } from "@/features/markets/marketSlice"
import type { Market } from "@/features/markets/types"
import { MOCK_MARKETS } from "@/mocks/mockData"

const Home: FC = () => {
  const dispatch = useDispatch()
  const trendingMarkets = useSelector(selectTrendingMarkets)
  const filteredMarkets = useSelector(selectFilteredMarkets)
  const userLoading = useSelector(selectUserLoading)
  const { data: markets, isLoading: isMarketLoading } = useGetMarketsQuery()

  useEffect(() => {
    if (markets) dispatch(setMarkets(markets))
  }, [dispatch, markets, isMarketLoading])

  // ─────────────────────────────────────────────────────────────────────────
  const mainHeroMarket = MOCK_MARKETS[0]
  const carouselItems = MOCK_MARKETS.filter((_, i) => i < 5)

  function renderHeroBanner(item: Market, index: number): React.ReactNode {
    return (
      <HeroBanner
        key={index}
        title={item.title}
        description={item.description || ""}
        favorite="Democratic Party"
        favoriteProbability={52}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 md:mx-20">
      <Toaster richColors position="top-center" />
      {userLoading && <AuthLoader />}

      <main className="container mx-auto px-4 pb-20">
        {mainHeroMarket && <MyCarousel items={carouselItems} renderItem={renderHeroBanner} />}
        <MarketGrid title="All Ending Soon Markets" markets={filteredMarkets} />
        <MarketGrid title="Earn Rewards for Supporting Market Activity" markets={trendingMarkets} />
      </main>
    </div>
  )
}

export default Home
