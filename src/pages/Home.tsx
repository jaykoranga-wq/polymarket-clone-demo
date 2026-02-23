import { type FC, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { CategoryTabs } from "@/components/layout/CategoryTabs"
import { HeroBanner } from "@/components/layout/HeroBanner"
import { Navbar } from "@/components/layout/Navbar"
import { MarketGrid } from "@/components/market/MarketGrid"
import { selectFilteredMarkets, selectTrendingMarkets } from "@/features/markets/marketSelectors"
import { setMarkets } from "@/features/markets/marketSlice"
import { MOCK_MARKETS } from "@/features/markets/mockData"

const Home: FC = () => {
  const dispatch = useDispatch()
  const trendingMarkets = useSelector(selectTrendingMarkets)
  const filteredMarkets = useSelector(selectFilteredMarkets)

  useEffect(() => {
    // Simulate API fetch and hydrate store
    dispatch(setMarkets(MOCK_MARKETS))
  }, [dispatch])

  const mainHeroMarket = MOCK_MARKETS[0]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <CategoryTabs />

      <main className="container mx-auto px-4 pb-20">
        {mainHeroMarket && (
          <HeroBanner
            title={mainHeroMarket.title}
            description={mainHeroMarket.description || ""}
            favorite="Democratic Party"
            favoriteProbability={52}
          />
        )}

        <MarketGrid title="All Ending Soon Markets" markets={filteredMarkets} />

        <MarketGrid title="Earn Rewards for Supporting Market Activity" markets={trendingMarkets} />
      </main>
    </div>
  )
}

export default Home
