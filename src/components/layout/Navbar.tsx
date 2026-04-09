import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Heart,
  Info,
  Link,
  LogOut,
  Medal,
  Moon,
  Search,
  Settings,
  Trophy,
  X,
} from "lucide-react"
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
const Avatar = ({
  email,
  address,
  size = "sm",
  square = false,
}: {
  email: string | null
  address: string | null
  size?: "sm" | "md" | "lg"
  square?: boolean
}) => {
  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : address
      ? address.slice(2, 4).toUpperCase()
      : "??"

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-[12px]",
    lg: "w-14 h-14 text-[16px]",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${square ? "rounded-lg" : "rounded-full"} bg-primary/10 border border-white/5 flex items-center justify-center overflow-hidden shrink-0`}
    >
      <div className="flex items-center justify-center text-white font-bold cursor-pointer">
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
  className = "",
}: {
  icon?: React.ReactNode
  label: string
  onClick?: () => void
  red?: boolean
  rightIcon?: React.ReactNode
  className?: string
}) => (
  <button
    onClick={onClick}
    className={`group cursor-pointer w-full flex items-center gap-3.5 px-5 py-3 text-sm font-bold transition-all hover:bg-white/5
      ${red ? "text-red-500" : className ? className : "text-white/60 hover:text-white"}`}
  >
    {icon && <span className="w-5 flex items-center justify-center transition-colors">{icon}</span>}
    <span className="flex-1 text-left">{label}</span>
    {rightIcon && <span className="text-white/30 group-hover:text-white">{rightIcon}</span>}
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
        className={`relative w-10 h-6 rounded-full transition-colors ${dark ? "bg-primary" : "bg-white/20"}`}
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
      className={`fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-[calc(100%+8px)] mx-auto md:mx-0 bg-slate border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6),0_0_20px_rgba(0,200,83,0.1)] z-50 py-0 overflow-hidden flex flex-col max-h-[calc(100vh-80px)] ${className}`}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  )
}

const Divider = () => <div className="mx-5 h-px bg-white/5" />

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

// ── MobileSearchBar ──────────────────────────────────────────────────────────
const MobileSearchBar = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`${ROUTES.MarketSearch}?q=${encodeURIComponent(trimmed)}`)
    onClose()
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search markets"
        className="w-full bg-slate border border-progress-bar rounded-2sm py-2 px-8.5 text-sm text-white focus:outline-none placeholder-[#6B7280]"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </form>
  )
}

const NAV_LINKS = [
  { label: "Trending", path: "/markets/trending" },
  { label: "Breaking", path: "/markets/category/Breaking" },
  { label: "New", path: "/markets/new_market" },
  { label: "Hollywood", path: "/markets/category/Hollywood" },
  { label: "Awards", path: "/markets/category/Awards" },
]

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
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
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
          console.error(err)
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
              <img src="/logo.svg" alt="Polymarket" className=" h-4 sm:h-5.5 w-auto" />
            </div>

            <nav className="hidden xl:flex items-center gap-6 py-1.5 px-3 text-sm font-bold  ">
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
                  <Dropdown onClose={() => setMoreOpen(false)} className="w-48 md:left-0 md:mt-2">
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
                <div className="hidden md:flex items-center gap-4 font-base font-bold ">
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
                <div className={`hidden md:block w-px bg-vertical-divider h-4 mx-1 `} />

                <Button
                  onClick={debouncedHandleDeposit}
                  disabled={isLoginOpen || depositLoading}
                  className={`bg-primary text-background text-xs font-bold hover:bg-primary/90 px-4 rounded-sm h-8 cursor-pointer`}
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

                {/* Auth Burger */}
                <div className="relative xl:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-white h-9 w-9 flex items-center justify-center p-0 cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setAuthMenuOpen((p) => !p)
                    }}
                  >
                    {authMenuOpen ? <X className="size-5" /> : <HamburgerIcon />}
                  </Button>

                  {authMenuOpen && (
                    <Dropdown
                      onClose={() => setAuthMenuOpen(false)}
                      className="w-72 md:right-0 md:top-11"
                    >
                      <div className="p-4">
                        <MobileSearchBar onClose={() => setAuthMenuOpen(false)} />
                      </div>
                      <div className="md:hidden">
                        <Divider />
                        <div className="px-5 py-4 flex flex-col gap-4">
                          <div
                            className="flex flex-col items-start"
                            onClick={() => {
                              handlePortfolioClick()
                              setAuthMenuOpen(false)
                            }}
                          >
                            <span className="text-secondary font-xs uppercase tracking-wide leading-none mb-1">
                              Portfolio
                            </span>
                            <span className="text-primary text-sm font-bold">
                              {formatPortfolio(portfolioAmount)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-secondary font-xs uppercase tracking-wide leading-none mb-1">
                              Cash
                            </span>
                            <span className="text-primary text-sm font-bold">
                              {formatCash(cashAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Divider />
                      <div className="py-2">
                        {NAV_LINKS.map((link) => (
                          <MenuItem
                            key={link.path}
                            label={link.label}
                            onClick={() => {
                              navigate(link.path)
                              setAuthMenuOpen(false)
                            }}
                          />
                        ))}
                      </div>
                    </Dropdown>
                  )}
                </div>

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
                    <Dropdown
                      onClose={() => setProfileOpen(false)}
                      className="w-72 md:right-0 md:top-11"
                    >
                      <div className="p-5 flex items-start gap-4 relative">
                        {/* Settings button top right */}
                        <button className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
                          <Settings size={16} />
                        </button>

                        <div
                          className="flex items-center gap-4 cursor-pointer group flex-1"
                          onClick={() => {
                            setProfileOpen(false)
                            navigate(`/profile/${user.publicAddress}`)
                          }}
                        >
                          <Avatar email={email} address={publicAddress} size="lg" square />
                          <div className="flex flex-col min-w-0">
                            <span className="font-md font-bold text-white truncate capitalize">
                              {displayName}
                            </span>
                            <div className="flex gap-4 mt-2 items-center">
                              <div className="flex flex-col">
                                <span className="font-xs font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                                  Rank
                                </span>
                                <span className="font-base font-extrabold text-primary leading-none">
                                  #412
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-xs font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                                  Win Rate
                                </span>
                                <span className="font-base font-extrabold text-primary leading-none">
                                  78.4%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Divider />
                      <div className="py-2">
                        <MenuItem
                          icon={<BarChart3 size={20} className="text-primary" />}
                          label="Leaderboard"
                          onClick={() => {
                            setProfileOpen(false)
                            navigate(`/leaderboard/${user.publicAddress}`)
                          }}
                        />
                        <MenuItem
                          icon={<Medal size={20} className="text-primary fill-primary/10" />}
                          label="Rewards"
                          onClick={() => {
                            setProfileOpen(false)
                            navigate(`/rewards/${user.publicAddress}`)
                          }}
                        />
                      </div>
                      <Divider />
                      <div className="py-2 ">
                        <MenuItem
                          icon={<LogOut size={20} className="text-no/70" />}
                          label="Logout"
                          onClick={handleLogout}
                          className="text-no/70 hover:text-no"
                        />
                      </div>
                    </Dropdown>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* How it works */}
                <div className="hidden xl:flex items-center gap-2 text-secondary cursor-pointer hover:opacity-80 transition-opacity">
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

                <div className="relative xl:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-white h-10 w-10 cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen((p) => !p)
                    }}
                  >
                    {menuOpen ? <X className="size-5" /> : <HamburgerIcon />}
                  </Button>

                  {menuOpen && (
                    <Dropdown
                      onClose={() => setMenuOpen(false)}
                      className="w-72 md:right-0 md:top-11"
                    >
                      <div className="p-4">
                        <MobileSearchBar onClose={() => setMenuOpen(false)} />
                      </div>
                      <Divider />
                      <div className="py-2">
                        {NAV_LINKS.map((link) => (
                          <MenuItem
                            key={link.path}
                            label={link.label}
                            onClick={() => {
                              navigate(link.path)
                              setMenuOpen(false)
                            }}
                          />
                        ))}
                      </div>
                      <Divider />
                      <MenuItem
                        icon={
                          <Trophy
                            size={16}
                            className="text-primary transition-colors group-hover:text-white"
                          />
                        }
                        label="Leaderboard"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/leaderboard/guest")
                        }}
                      />
                      <MenuItem
                        icon={
                          <Heart
                            size={16}
                            className="text-primary transition-colors group-hover:text-white fill-current"
                          />
                        }
                        label="Rewards"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate("/rewards/guest")
                        }}
                      />
                      <MenuItem
                        icon={
                          <Link
                            size={16}
                            className="text-primary transition-colors group-hover:text-white"
                          />
                        }
                        label="APIs"
                      />
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
