import { Bell, ChevronRight, Info, Moon, Search, Settings, X } from "lucide-react"
import { type FC, useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router"

import { useAppSelector } from "@/app/hooks"
import { LoginModal } from "@/components/auth/LoginModal"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { useLogoutMutation } from "@/features/api/auth/authApi"
import {
  loadingFalse,
  loadingTrue,
  logout,
  selectCashAmount,
  selectIsAuthenticated,
  selectPortfolioAmount,
  selectUserData,
} from "@/features/auth/authSlice"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"
import { setMetaMaskLoggedOut } from "@/routes/utils"

import { CategoryTabs } from "./CategoryTabs"

// ─── Hamburger icon ───────────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
  </svg>
)

// ─── Avatar initials ──────────────────────────────────────────────────────────
const Avatar = ({ email, address }: { email: string | null; address: string | null }) => {
  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : address
      ? address.slice(2, 4).toUpperCase()
      : "??"
  return (
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer">
      {initials}
    </div>
  )
}

// ─── Menu item ────────────────────────────────────────────────────────────────
const MenuItem = ({
  icon,
  label,
  onClick,
  red = false,
  rightIcon,
}: {
  icon?: React.ReactNode
  label: string
  onClick?: () => void
  red?: boolean
  rightIcon?: React.ReactNode
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 rounded-lg
      ${red ? "text-red-500 hover:text-red-400" : "text-white/80 hover:text-white"}`}
  >
    {icon && <span className="text-base w-5 flex items-center justify-center">{icon}</span>}
    <span className="flex-1 text-left">{label}</span>
    {rightIcon && <span className="text-white/30">{rightIcon}</span>}
  </button>
)

// ─── Dark mode toggle row ─────────────────────────────────────────────────────
const DarkModeRow = () => {
  const [dark, setDark] = useState(true)
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-base w-5 flex items-center justify-center">
        <Moon size={16} className="text-white/60" />
      </span>
      <span className="flex-1 text-sm font-medium text-white/80">Dark mode</span>
      <button
        onClick={() => setDark((p) => !p)}
        className={`relative w-10 h-6 rounded-full transition-colors ${dark ? "bg-blue-500" : "bg-white/20"}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            dark ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────
const Dropdown = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-64 bg-[#141920] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 py-2 overflow-hidden"
    >
      {children}
    </div>
  )
}

const Divider = () => <div className="my-1.5 mx-4 h-px bg-white/8" />

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export const Navbar: FC = () => {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { email, publicAddress } = useSelector(selectUserData)
  const portfolioAmount = useSelector(selectPortfolioAmount)
  const cashAmount = useSelector(selectCashAmount)
  const user = useAppSelector(selectUserData)

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const [logoutToBackend] = useLogoutMutation()

  const displayName = email
    ? email.split("@")[0]
    : publicAddress
      ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-4)}`
      : "User"

  const handleLogout = async () => {
    dispatch(loadingTrue())
    setProfileOpen(false)

    try {
      // ── Magic users (email + google) ──────────────────────────────────────
      // 1. tell backend to invalidate the session token
      // 2. log out of Magic SDK so getIdToken no longer works
      if (user.loginMethod === LOGIN_METHODS.Email || user.loginMethod === LOGIN_METHODS.Google) {
        try {
          await logoutToBackend().unwrap()
        } catch (err) {
          console.error("Backend logout failed:", err)
          // continue anyway — we still want to clear local state
        }

        const isLoggedIn = await magic?.user.isLoggedIn()
        if (isLoggedIn) await magic?.user.logout()
      }

      // ── MetaMask users ────────────────────────────────────────────────────
      // MetaMask has no programmatic logout — just set the flag
      // so checkMetaMask skips on next page refresh
      if (user.loginMethod === LOGIN_METHODS.MetaMask) {
        setMetaMaskLoggedOut()
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_method")
        localStorage.removeItem("auth_address")
      }
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      // always clear Redux state regardless of what happened above
      localStorage.removeItem("isSignedIn")
      dispatch(logout()) // clears token, email, publicAddress, loginMethod
      dispatch(loadingFalse())
      navigate(`/${ROUTES.HOME}`)
    }
  }

  const handleDeposit = async () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true)
      return
    }
    await magic?.wallet.showUI()
  }

  const handlePortfolioClick = () => {
    if (isAuthenticated) {
      navigate(`${ROUTES.PORTFOLIO}`)
    } else {
      setIsLoginOpen(true)
    }
  }

  const handleLoginClose = () => {
    setIsLoginOpen(false)
  }

  return (
    <>
      <header className=" sticky top-0 z-50  border-b border-border bg-background/80 backdrop-blur-md md:mx-20   ">
        <div className=" container mx-auto flex h-16 items-center justify-between px-4">
          {/* ── Logo + Nav ── */}
          <div
            className="flex items-center gap-8 cursor-pointer"
            onClick={() => {
              navigate("/")
            }}
          >
            <div className="flex items-center gap-2">
              <div className="size-8 rounded bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-background">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Polymarket</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <button className="text-foreground transition-colors hover:text-primary">
                Trending
              </button>
              <button className="text-foreground transition-colors hover:text-primary">
                Breaking
              </button>
              <button className="text-foreground transition-colors hover:text-primary">New</button>
              <button className="text-foreground transition-colors hover:text-primary ml-0">
                More
              </button>
            </nav>
          </div>

          {/* ── Search ── */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isAuthenticated ? "Search markets" : "Search polymarkets..."}
              className="w-full bg-surface border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Portfolio + Cash */}
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold mr-1">
                  <div
                    className="flex flex-col items-end cursor-pointer"
                    onClick={handlePortfolioClick}
                  >
                    <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      Portfolio
                    </span>
                    <span className="text-primary text-sm font-bold">$ {portfolioAmount}</span>
                  </div>
                  <div className="flex flex-col items-end border-l border-border pl-4">
                    <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1">
                      Cash
                    </span>
                    <span className="text-primary text-sm font-bold">$ {cashAmount}</span>
                  </div>
                </div>

                {/* Deposit button */}
                <Button
                  onClick={handleDeposit}
                  variant="default"
                  className="bg-primary text-background font-bold hover:bg-primary/90 px-6 rounded-lg h-10"
                >
                  Deposit
                </Button>

                {/* Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-10 w-10"
                >
                  <Bell className="size-5" />
                </Button>

                {/* Profile avatar + dropdown */}
                <div className="relative">
                  <div onClick={() => setProfileOpen((p) => !p)}>
                    <Avatar email={email} address={publicAddress} />
                  </div>

                  {profileOpen && (
                    <Dropdown onClose={() => setProfileOpen(false)}>
                      {/* User header */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar email={email} address={publicAddress} />
                          <span className="text-sm font-semibold text-white">{displayName}</span>
                        </div>
                        <button className="text-white/40 hover:text-white transition-colors">
                          <Settings size={16} />
                        </button>
                      </div>

                      <Divider />

                      <MenuItem icon="🏆" label="Leaderboard" />
                      <MenuItem icon="💚" label="Rewards" />
                      <MenuItem icon="🔗" label="APIs" />
                      <MenuItem icon="🛠️" label="Builders" />

                      <Divider />

                      <DarkModeRow />

                      <Divider />

                      <MenuItem label="Accuracy" onClick={() => setProfileOpen(false)} />
                      <MenuItem label="Support" onClick={() => setProfileOpen(false)} />
                      <MenuItem label="Documentation" onClick={() => setProfileOpen(false)} />
                      <MenuItem label="Help Center" onClick={() => setProfileOpen(false)} />
                      <MenuItem label="Terms of Use" onClick={() => setProfileOpen(false)} />
                      <MenuItem label="Language" rightIcon={<ChevronRight size={14} />} />

                      <Divider />

                      <MenuItem label="Logout" red onClick={handleLogout} />

                      {/* Explore all */}
                      <div className="mx-3 mt-1 mb-2">
                        <button className="w-full py-2.5 text-sm font-bold text-white bg-white/8 hover:bg-white/12 rounded-xl transition-colors">
                          Explore all
                        </button>
                      </div>
                    </Dropdown>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* How it works */}
                <div className="hidden md:flex items-center gap-2 text-accent cursor-pointer hover:opacity-80 transition-opacity">
                  <Info className="size-4" />
                  <span className="text-sm font-medium">How it works</span>
                </div>

                {/* Log In / Sign Up */}
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

                {/* Hamburger + dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10 cursor-pointer"
                    onClick={() => setMenuOpen((p) => !p)}
                  >
                    {menuOpen ? <X className="size-5" /> : <HamburgerIcon />}
                  </Button>

                  {menuOpen && (
                    <Dropdown onClose={() => setMenuOpen(false)}>
                      <MenuItem icon="🏆" label="Leaderboard" />
                      <MenuItem icon="💚" label="Rewards" />
                      <MenuItem icon="🔗" label="APIs" />

                      <Divider />

                      <DarkModeRow />

                      <Divider />

                      <MenuItem label="Accuracy" onClick={() => setMenuOpen(false)} />
                      <MenuItem label="Documentation" onClick={() => setMenuOpen(false)} />
                      <MenuItem label="Help Center" onClick={() => setMenuOpen(false)} />
                      <MenuItem label="Terms of Use" onClick={() => setMenuOpen(false)} />
                      <MenuItem label="Language" rightIcon={<ChevronRight size={14} />} />
                    </Dropdown>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <CategoryTabs />

      <LoginModal open={isLoginOpen} onClose={handleLoginClose} />
    </>
  )
}
