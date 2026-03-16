import { type FC } from "react"
import { useSelector } from "react-redux"
import { Toaster } from "sonner"

import { MyCarousel } from "@/components/custom/MyCarousel"
import { HeroBanner } from "@/components/layout/HeroBanner"
import { MarketGrid } from "@/components/market/MarketGrid"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { selectUserLoading } from "@/features/auth/authSlice"
import { selectAllMarkets, selectNewMarkets } from "@/features/markets/marketSelectors"
import type { Market } from "@/features/markets/types"
import { MOCK_MARKETS } from "@/mocks/mockData"

const Home: FC = () => {
  // const trendingMarkets = useSelector(selectTrendingMarkets)
  // const filteredMarkets = useSelector(selectFilteredMarkets)
  const allMarkets = useSelector(selectAllMarkets)
  const newMarkets = useSelector(selectNewMarkets)
  console.log("new market value", newMarkets)
  const userLoading = useSelector(selectUserLoading)

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
        <MarketGrid title="NEW MARKETS" markets={newMarkets.slice(0, 4)} groupKey={`new_market`} />
        <MarketGrid
          title="All Ending Soon Markets"
          markets={allMarkets.slice(0, 4)}
          groupKey={`ending_soon`}
        />
        <MarketGrid
          title="Earn Rewards for Supporting Market Activity"
          markets={allMarkets.slice(0, 4)}
          groupKey={`earn_rewards`}
        />
      </main>
    </div>
  )
}

export default Home
