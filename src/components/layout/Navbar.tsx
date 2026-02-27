import { Bell, ChevronDown, Info, Menu, Search, User } from "lucide-react"
import { type FC, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { LoginModal } from "@/components/auth/LoginModal"
import { Button } from "@/components/ui/button"
import {
  loadingTrue,
  logout,
  selectIsAuthenticated,
  selectUserData,
} from "@/features/auth/authSlice"
import { useMagic } from "@/lib/magic"
import { setMetaMaskLoggedOut } from "@/routes/utils"

export const Navbar: FC = () => {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { email, publicAddress } = useSelector(selectUserData)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const handleLogout = async () => {
    dispatch(loadingTrue())
    try {
      const isLoggedIn = await magic?.user.isLoggedIn()
      if (isLoggedIn) await magic?.user.logout()
      setMetaMaskLoggedOut()
    } catch (err) {
      console.error("Logout error:", err)
    }
    dispatch(logout())
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* ── Logo + Nav ─────────────────────────────────────── */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-background">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Polymarket</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="text-foreground transition-colors hover:text-primary">
                Trending
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                Breaking
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                New
              </a>
              <a
                href="#"
                className="flex items-center gap-1 transition-colors hover:text-foreground group"
              >
                <span>More</span>
                <ChevronDown className="size-3 transition-transform group-hover:translate-y-0.5" />
              </a>
            </nav>
          </div>

          {/* ── Search ─────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isAuthenticated ? "Search markets" : "Search polymarkets..."}
              className="w-full bg-surface border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          {/* ── Right Side ─────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User identifier — remove once backend is wired */}
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {email
                    ? `📧 ${email}`
                    : `🔑 ${publicAddress?.slice(0, 6)}...${publicAddress?.slice(-4)}`}
                </div>

                {/* Portfolio stats */}
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold mr-2">
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      Portfolio
                    </span>
                    <span className="text-primary text-sm font-bold">$5,675</span>
                  </div>
                  <div className="flex flex-col items-end border-l border-border pl-4">
                    <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      Cash
                    </span>
                    <span className="text-primary text-sm font-bold">$500</span>
                  </div>
                </div>

                <Button
                  variant="default"
                  className="bg-primary text-background font-bold hover:bg-primary/90 px-6 rounded-lg h-10"
                >
                  Deposit
                </Button>

                <div className="flex items-center gap-1 ml-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10"
                  >
                    <Bell className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10 bg-surface/50 rounded-full"
                  >
                    <User className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-accent cursor-pointer hover:opacity-80 transition-opacity">
                  <Info className="size-4" />
                  <span className="text-sm font-medium">How it works</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    className="bg-accent text-white font-bold hover:bg-accent/90 px-6 rounded-lg h-10 cursor-pointer"
                    onClick={() => setIsLoginOpen(true)}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="default"
                    className="bg-accent text-white font-bold hover:bg-accent/90 px-6 rounded-lg h-10 cursor-pointer"
                    onClick={() => setIsLoginOpen(true)}
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer"
                  >
                    <Menu className="size-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
