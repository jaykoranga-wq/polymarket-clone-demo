import { type FC, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Toaster } from "sonner"

import { MyCarousel } from "@/components/custom/MyCarousel"
import { CategoryTabs } from "@/components/layout/CategoryTabs"
import { HeroBanner } from "@/components/layout/HeroBanner"
import { Navbar } from "@/components/layout/Navbar"
import { MarketGrid } from "@/components/market/MarketGrid"
import { AuthLoader } from "@/components/ui/AuthLoader"
import { loadingTrue, login, selectUserLoading } from "@/features/auth/authSlice"
import { selectFilteredMarkets, selectTrendingMarkets } from "@/features/markets/marketSelectors"
import { setMarkets } from "@/features/markets/marketSlice"
import { MOCK_MARKETS } from "@/features/markets/mockData"
import type { Market } from "@/features/markets/types"
import { useMagic } from "@/lib/magic"
import { wasMetaMaskLoggedOut } from "@/routes/utils"

const Home: FC = () => {
  const dispatch = useDispatch()
  const trendingMarkets = useSelector(selectTrendingMarkets)
  const filteredMarkets = useSelector(selectFilteredMarkets)
  const { magic } = useMagic()
  const userLoading = useSelector(selectUserLoading)

  useEffect(() => {
    // Simulate API fetch and hydrate store
    dispatch(setMarkets(MOCK_MARKETS))
    const checkAuth = async () => {
      try {
        // Always try to get redirect result first — Magic handles the check internally
        dispatch(loadingTrue())
        const result = await magic?.oauth2.getRedirectResult()

        if (result) {
          dispatch(
            login({
              email: result.magic.userMetadata.email ?? null,
              publicAddress: result.magic.userMetadata.wallets.ethereum?.publicAddress ?? null,
              loading: false,
            }),
          )
          console.log(result)
          return
        }
      } catch {
        // Not a redirect — that's fine, fall through to session check
        //this ,below login, is to set isauthenticated false , this will run on refresh when no one is loggedin
        dispatch(
          login({
            email: null,
            publicAddress: null,
            loading: false,
            isAuthenticated: false,
          }),
        )
      }

      try {
        const isLoggedIn = await magic?.user.isLoggedIn()
        if (isLoggedIn) {
          const userInfo = await magic?.user.getInfo()

          dispatch(
            login({
              email: userInfo?.email ?? null,
              publicAddress: userInfo?.wallets.ethereum?.publicAddress ?? null,
              loading: false,
            }),
          )
        }
      } catch (err) {
        console.error(err)
      }
      //meta mask redirect
      try {
        if (window.ethereum && !wasMetaMaskLoggedOut()) {
          // eth_accounts (no popup) returns accounts if user already connected
          const accounts: string[] = await window.ethereum.request({
            method: "eth_accounts", // 👈 NOT eth_requestAccounts (that triggers popup)
          })
          console.log("accounts of metamask:", accounts)
          if (accounts.length > 0) {
            dispatch(
              login({
                email: null,
                publicAddress: accounts[0],
                loading: false,
              }),
            )
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    // ── Check existing Magic session ───────────────────────

    if (magic) checkAuth()
  }, [dispatch, magic])

  const mainHeroMarket = MOCK_MARKETS[0]
  //for testing
  const carouselItems = MOCK_MARKETS.filter((_, index) => {
    return index < 5
  })
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30  md:mx-20">
      <Toaster richColors position="top-center" />
      {userLoading && <AuthLoader />}
      <Navbar />
      <CategoryTabs />

      <main className="container mx-auto px-4 pb-20">
        {mainHeroMarket && <MyCarousel items={carouselItems} renderItem={renderHeroBanner} />}

        <MarketGrid title="All Ending Soon Markets" markets={filteredMarkets} />

        <MarketGrid title="Earn Rewards for Supporting Market Activity" markets={trendingMarkets} />
      </main>
    </div>
  )
}

export default Home
