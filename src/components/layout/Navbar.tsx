import { ChevronDown, ChevronRight, Info, Moon, Search, Settings, X } from "lucide-react"
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
  selectAvailableAmount,
  selectIsAuthChecking,
  selectIsAuthenticated,
  selectLoginMethod,
  selectPortfolioAmount,
  selectUserData,
  selectUserLoading,
} from "@/features/auth/authSlice"
import { LOGIN_METHODS } from "@/features/auth/authTypes/loginMethodsTypes"
import { useMagic } from "@/features/auth/lib/magic"
import { useDebouncedCallback } from "@/hooks/custom/useDebounce"
import { formatCash, formatPortfolio } from "@/libs/formatCurrency"
import { setMetaMaskLoggedOut } from "@/routes/utils"

import { MetaMaskDepositModal } from "../deposit/MetaMaskDepositModal"
import { NotificationBell } from "../navbar/NotificationBell"
import { AuthLoader } from "../ui/AuthLoader"
import { CategoryTabs } from "./CategoryTabs"

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ email, address }: { email: string | null; address: string | null }) => {
  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : address
      ? address.slice(2, 4).toUpperCase()
      : "??"
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center">
      <div className="w-4 h-4  flex items-center justify-center text-muted-foreground font-base font-bold shrink-0 cursor-pointer">
        {initials}
      </div>
    </div>
  )
}

// ── MenuItem ──────────────────────────────────────────────────────────────────
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
    className={`cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 rounded-lg
      ${red ? "text-red-500 hover:text-red-400" : "text-white/80 hover:text-white"}`}
  >
    {icon && <span className="text-base w-5 flex items-center justify-center">{icon}</span>}
    <span className="flex-1 text-left">{label}</span>
    {rightIcon && <span className="text-white/30">{rightIcon}</span>}
  </button>
)

// ── DarkModeRow ───────────────────────────────────────────────────────────────
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
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  )
}

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────
const Dropdown = ({
  children,
  onClose,
  className = "right-0 top-12 w-64",
}: {
  children: React.ReactNode
  onClose: () => void
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className={`absolute bg-[#141920] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 py-2 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

const Divider = () => <div className="my-1.5 mx-4 h-px bg-white/8" />

// ── SearchBar ─────────────────────────────────────────────────────────────────
// Separate component so it can manage its own state cleanly
const SearchBar = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    // navigate to markets page with search query param
    navigate(`${ROUTES.MarketSearch}?q=${encodeURIComponent(trimmed)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(e as unknown as React.FormEvent)
    if (e.key === "Escape") setQuery("")
  }

  return (
    <form onSubmit={handleSearch} className="hidden xl:flex w-70   max-w-md  relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search markets"
        className="w-full bg-slate border border-progress-bar rounded-2sm py-2.5 pl-8.5 pr-2.5 text-sm leading-4 text-white focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder-[#6B7280] max-w-67.5 "
      />
      {/* clear button */}
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors "
        >
          <X size={14} />
        </button>
      )}
    </form>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export const Navbar: FC = () => {
  const dispatch = useDispatch()
  const { magic } = useMagic()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const { email, publicAddress } = useSelector(selectUserData)
  const portfolioAmount = useSelector(selectPortfolioAmount)
  const cashAmount = useSelector(selectAvailableAmount)
  const user = useAppSelector(selectUserData)
  const isAuthChecking = useAppSelector(selectIsAuthChecking)
  const loginMethod = useAppSelector(selectLoginMethod)
  const isUserLoading = useAppSelector(selectUserLoading)

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)
  const [metamaskDepositOpen, setMetamaskDepositOpen] = useState(false)

  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const [logoutToBackend] = useLogoutMutation()

  const displayName = email
    ? email.split("@")[0]
    : publicAddress
      ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-4)}`
      : "User"

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    dispatch(loadingTrue())
    setProfileOpen(false)

    try {
      if (user.loginMethod === LOGIN_METHODS.Email || user.loginMethod === LOGIN_METHODS.Google) {
        try {
          await logoutToBackend().unwrap()
        } catch (err) {
          console.log(err)
        }
        const isLoggedIn = await magic?.user.isLoggedIn()
        if (isLoggedIn) await magic?.user.logout()
      }
      if (user.loginMethod === LOGIN_METHODS.MetaMask) {
        setMetaMaskLoggedOut()
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_method")
        localStorage.removeItem("auth_address")
      }
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      localStorage.removeItem("isSignedIn")
      dispatch(logout())
      dispatch(loadingFalse())
      navigate(ROUTES.HOME)
    }
  }

  // ── Deposit ───────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true)
      return
    }
    if (loginMethod === LOGIN_METHODS.MetaMask) {
      setMetamaskDepositOpen(true)
      return
    }
    setDepositLoading(true)
    await magic?.wallet.showUI()
    setDepositLoading(false)
  }

  const handlePortfolioClick = () => {
    if (isAuthenticated) navigate(ROUTES.PORTFOLIO)
    else setIsLoginOpen(true)
  }

  const debouncedHandleDeposit = useDebouncedCallback(handleDeposit, 500)
  const showAuthLoader = isAuthChecking || isUserLoading

  return (
    <>
      {/* <header className=" sticky top-0 z-50  border-b border-border bg-background/80 backdrop-blur-md font-liberation md:px-20">
        <div className=" container  flex h-14 items-center gap-4 justify-between "> */}
      <MetaMaskDepositModal
        open={metamaskDepositOpen}
        onClose={() => setMetamaskDepositOpen(false)}
      />

      <header className="sticky top-0 z-50  border-b border-border bg-background/80 backdrop-blur-md font-liberation">
        <div className=" container  flex h-14 items-center gap-4 justify-between">
          {/* ── Logo + Nav ── */}
          <div
            className="flex items-center gap-8 cursor-pointer"
            onClick={() => {
              navigate("/")
            }}
          >
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Polymarket" className=" h-4 sm:h-5.5 w-auto" />
            </div>

            <nav className="hidden lg:flex items-center gap-6 py-1.5 px-3 text-sm font-bold  ">
              <button
                className="text-secondary transition-colors hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/markets/trending")
                }}
              >
                Trending
              </button>
              <button
                className="text-secondary transition-colors hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/markets/category/Breaking")
                }}
              >
                Breaking
              </button>
              <button
                className="text-secondary transition-colors hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/markets/new_market")
                }}
              >
                New
              </button>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMoreOpen((p) => !p)
                  }}
                  className="flex items-center gap-1 text-secondary transition-colors hover:text-white ml-0"
                >
                  More{" "}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {moreOpen && (
                  <Dropdown onClose={() => setMoreOpen(false)} className="left-0 mt-2 w-48">
                    <MenuItem
                      label="Hollywood"
                      onClick={() => {
                        setMoreOpen(false)
                        navigate("/markets/category/Hollywood")
                      }}
                    />
                    <MenuItem
                      label="Awards"
                      onClick={() => {
                        setMoreOpen(false)
                        navigate("/markets/category/Awards")
                      }}
                    />
                  </Dropdown>
                )}
              </div>
            </nav>
          </div>

          {/* ── Right side with search ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SearchBar />
            {showAuthLoader ? (
              <AuthLoader />
            ) : isAuthenticated ? (
              <>
                {/* Portfolio + Cash */}
                <div className="hidden sm:flex items-center gap-4 font-base font-bold ">
                  <div
                    className="flex flex-col items-start cursor-pointer"
                    onClick={handlePortfolioClick}
                  >
                    <span className="text-secondary uppercase tracking-wide leading-none">
                      Portfolio
                    </span>
                    <span className="text-primary font-sm font-bold">
                      {formatPortfolio(portfolioAmount)}
                    </span>
                  </div>
                  <div className="flex flex-col ">
                    <span className="text-secondary uppercase tracking-wide leading-none ">
                      Cash
                    </span>
                    <span className="text-primary font-sm font-bold">{formatCash(cashAmount)}</span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className={`hidden sm:block w-px bg-vertical-divider h-4 mx-1 `} />

                <Button
                  onClick={debouncedHandleDeposit}
                  disabled={isLoginOpen || depositLoading}
                  className={`bg-primary text-background text-xs font-bold hover:bg-primary/90 px-4 rounded-sm h-8`}
                >
                  {depositLoading ? "Opening wallet" : "Deposit"}
                </Button>

                {/* Bell
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-white h-9 w-9 flex items-center justify-center p-0"
                >
                  <Bell width={16} height={20} className="shrink-0" />
                </Button> */}
                <NotificationBell />

                {/* Profile avatar + dropdown */}
                <div className="relative ">
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setProfileOpen((p) => !p)
                    }}
                  >
                    <Avatar email={email} address={publicAddress} />
                  </div>

                  {profileOpen && (
                    <Dropdown onClose={() => setProfileOpen(false)}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => navigate(`/profile/${user.publicAddress}`)}
                        >
                          <Avatar email={email} address={publicAddress} />
                          <span className="text-sm font-semibold text-white">{displayName}</span>
                        </div>
                        <button className="text-white/40 hover:text-white transition-colors">
                          <Settings size={16} />
                        </button>
                      </div>
                      <Divider />
                      <MenuItem
                        icon="🏆"
                        label="Leaderboard"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate(`/leaderboard/${user.publicAddress}`)
                        }}
                      />
                      <MenuItem
                        icon="💚"
                        label="Rewards"
                        onClick={() => {
                          setProfileOpen(false)
                          navigate(`/rewards/${user.publicAddress}`)
                        }}
                      />
                      <Divider />
                      <MenuItem label="Logout" red onClick={handleLogout} />
                    </Dropdown>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* How it works */}
                <div className="hidden lg:flex items-center gap-2 text-secondary cursor-pointer hover:opacity-80 transition-opacity">
                  <Info className="size-4" />
                  <span className="text-sm font-medium text-nowrap">How it works</span>
                </div>
                <Button
                  variant="default"
                  className="bg-accent text-white font-base font-bold text-xs hover:bg-accent/90 px-3 sm:px-4 rounded-sm sm:h-8 h-7  cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Log In
                </Button>
                <Button
                  variant="default"
                  className="bg-accent text-primary font-bold border-black border text-xs hover:bg-accent/90 px-3 sm:px-4 rounded-sm sm:h-8 h-7 cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Sign Up
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-white h-10 w-10 cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setMenuOpen((p) => !p)}
                  >
                    {menuOpen ? <X className="size-5" /> : <HamburgerIcon />}
                  </Button>

                  {menuOpen && (
                    <Dropdown onClose={() => setMenuOpen(false)}>
                      <MenuItem
                        icon="🏆"
                        label="Leaderboard"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/leaderboard/guest")
                        }}
                      />
                      <MenuItem
                        icon="💚"
                        label="Rewards"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/rewards/guest")
                        }}
                      />
                      <MenuItem icon="🔗" label="APIs" />
                      <Divider />
                      <DarkModeRow />
                      <Divider />
                      <MenuItem
                        label="Help Center"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/page/help")
                        }}
                      />
                      <MenuItem
                        label="Terms of Use"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/terms")
                        }}
                      />
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
      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}

// ── Hamburger ─────────────────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
  </svg>
)
