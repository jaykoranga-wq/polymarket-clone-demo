import {
  Award,
  BarChart3,
  ChevronDown,
  Film,
  Flame,
  // Globe,
  // Info,
  Link,
  LogOut,
  Medal,
  // Moon,
  Search,
  // Settings,
  Sparkles,
  X,
  Zap,
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
import { setNotifications } from "@/features/notifications/notificationSlice"
import {
  clearActiveDropdown,
  selectActiveDropdownId,
  toggleDropdown as toggleGlobalDropdown,
} from "@/features/ui/uiSlice"
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
// const DarkModeRow = () => {
//   const [dark, setDark] = useState(true)
//   return (
//     <div className="flex items-center gap-3 px-5 py-3">
//       <span className="text-base w-5 flex items-center justify-center">
//         <Moon size={16} className="text-white/60" />
//       </span>
//       <span className="flex-1 text-sm font-medium text-white/80">Dark mode</span>
//       <button
//         onClick={() => setDark((p) => !p)}
//         className={`relative w-10 h-6 rounded-full transition-colors ${dark ? "bg-primary" : "bg-white/20"}`}
//       >
//         <div
//           className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-4" : "translate-x-0.5"}`}
//         />
//       </button>
//     </div>
//   )
// }

// ── SectionHeader ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-5 pt-4 md:pt-6 pb-2">
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{title}</span>
  </div>
)

// ── SidebarItem ───────────────────────────────────────────────────────────────
const SidebarItem = ({
  icon,
  label,
  onClick,
  active = false,
  rightContent,
}: {
  icon?: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  rightContent?: React.ReactNode
}) => (
  <button
    onClick={onClick}
    className={`group cursor-pointer w-full flex items-center gap-3.5 px-5 py-3 text-sm font-medium transition-all relative
      ${active ? "text-white bg-primary/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
  >
    {icon && <span className="w-5 flex items-center justify-center">{icon}</span>}
    <span className="flex-1 text-left">{label}</span>
    {rightContent}
    {active && (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-l-full" />
    )}
  </button>
)

// ── Nav icons map ─────────────────────────────────────────────────────────────
const NAV_ICONS: Record<string, React.ReactNode> = {
  Trending: <Flame size={16} />,
  Breaking: <Zap size={16} />,
  New: <Sparkles size={16} />,
  Hollywood: <Film size={16} />,
  Awards: <Award size={16} />,
}

// ─── Dropdown wrapper (kept for profile dropdown) ─────────────────────────────
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
const SearchBar = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
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
  const [depositLoading, setDepositLoading] = useState(false)
  const [metamaskDepositOpen, setMetamaskDepositOpen] = useState(false)

  const activeDropdown = useAppSelector(selectActiveDropdownId)
  const navigate = useNavigate()
  const [logoutToBackend] = useLogoutMutation()

  // Toggles dropdowns and ensures only one is open
  const toggleDropdown = (name: string) => {
    dispatch(toggleGlobalDropdown(name))
  }

  // Derived sidebar state
  const sidebarOpen = isAuthenticated ? authMenuOpen : menuOpen
  const closeSidebar = () => {
    setAuthMenuOpen(false)
    setMenuOpen(false)
  }

  const displayName = email
    ? email.split("@")[0]
    : publicAddress
      ? `${publicAddress.slice(0, 6)}...${publicAddress.slice(-4)}`
      : "User"

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    dispatch(loadingTrue())
    dispatch(clearActiveDropdown())

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
      dispatch(setNotifications([]))
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
      <MetaMaskDepositModal
        open={metamaskDepositOpen}
        onClose={() => setMetamaskDepositOpen(false)}
      />

      {/* ── Sidebar Overlay ── */}
      <div
        className={`fixed inset-0 bg-black/60  z-60 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar Panel ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[270px] bg-[#121417] border-r border-white/10 z-70 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {/* Sidebar Logo + Close Button */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <img src="/logo.svg" alt="OutcomeX" className="h-5 w-auto" />
            <button
              onClick={closeSidebar}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={22} />
            </button>
          </div>

          {/* Sidebar Search */}
          <div className="px-4 pb-2">
            <MobileSearchBar onClose={closeSidebar} />
          </div>

          {/* Portfolio/Cash — only when authenticated & on mobile (hidden md+) */}
          {isAuthenticated && (
            <div className="md:hidden ">
              <Divider />
              <div className="px-5 py-4 flex justify-around">
                <div
                  className="flex flex-col cursor-pointer"
                  // onClick={() => {
                  //   handlePortfolioClick()
                  //   closeSidebar()
                  // }}
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
                  <span className="text-primary text-sm font-bold">{formatCash(cashAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <SectionHeader title="Navigation" />
          {NAV_LINKS.map((link) => (
            <SidebarItem
              key={link.path}
              icon={NAV_ICONS[link.label]}
              label={link.label}
              onClick={() => {
                navigate(link.path)
                closeSidebar()
              }}
            />
          ))}

          {/* ENGAGEMENT */}
          <SectionHeader title="Engagement" />
          <SidebarItem
            icon={<BarChart3 size={16} className="text-primary" />}
            label="Leaderboard"
            onClick={() => {
              closeSidebar()
              if (isAuthenticated) navigate(`/leaderboard/${user.publicAddress}`)
              else navigate("/leaderboard/guest")
            }}
          />
          <SidebarItem
            icon={<Medal size={16} className="text-primary fill-primary/10" />}
            label="Rewards"
            onClick={() => {
              closeSidebar()
              if (isAuthenticated) navigate(`/rewards/${user.publicAddress}`)
              else navigate("/rewards/guest")
            }}
          />
          {isAuthenticated && (
            <SidebarItem
              icon={<Link size={16} className="text-primary" />}
              label="Portfolio"
              onClick={() => {
                handlePortfolioClick()
                closeSidebar()
              }}
            />
          )}

          {/* SYSTEM */}
          {/* <SectionHeader title="System" />
          <DarkModeRow />
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="w-5 flex items-center justify-center">
              <Globe size={16} className="text-white/60" />
            </span>
            <span className="flex-1 text-sm font-medium text-white/80">Language</span>
            <span className="text-lg">🇺🇸</span>
          </div> */}

          {/* MOBILE AUTH/PROFILE SECTION */}
          <div className="md:hidden mt-auto ">
            <Divider />
            {!isAuthenticated ? (
              <div className="px-5 pt-6 flex flex-col gap-3">
                <Button
                  variant="default"
                  className="w-full bg-accent text-white font-bold text-sm hover:bg-accent/90 h-11 rounded-sm cursor-pointer"
                  onClick={() => {
                    setIsLoginOpen(true)
                    closeSidebar()
                  }}
                >
                  Log In
                </Button>
                <Button
                  variant="default"
                  className="w-full bg-accent text-primary font-bold border-black/20 border text-sm hover:bg-accent/90 h-11 rounded-sm cursor-pointer"
                  onClick={() => {
                    setIsLoginOpen(true)
                    closeSidebar()
                  }}
                >
                  Sign Up
                </Button>
              </div>
            ) : (
              <div className="px-5 pt-6 flex flex-col gap-4">
                {/* Mobile Profile Info */}
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => {
                    navigate(`/profile/${user.publicAddress}`)
                    closeSidebar()
                  }}
                >
                  <Avatar email={email} address={publicAddress} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white capitalize truncate max-w-[150px]">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      View Profile
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    debouncedHandleDeposit()
                    closeSidebar()
                  }}
                  disabled={depositLoading}
                  className="w-full bg-primary text-background text-sm font-bold hover:bg-primary/90 h-11 rounded-sm cursor-pointer"
                >
                  {depositLoading ? "Opening wallet" : "Deposit"}
                </Button>

                <button
                  onClick={() => {
                    handleLogout()
                    closeSidebar()
                  }}
                  className="flex items-center gap-3 px-1 py-2 text-sm font-bold text-red-500/80 hover:text-red-500 transition-colors w-full"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md font-liberation">
        <div className="container flex h-14 items-center gap-4 justify-between">
          {/* ── Left: Burger + Logo + Desktop Nav ── */}
          <div className="flex items-center gap-3">
            {/* Burger — visible below xl */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden text-muted-foreground hover:text-white h-9 w-9 flex items-center justify-center p-0 cursor-pointer"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                dispatch(clearActiveDropdown()) // Close any open dropdowns when sidebar toggles
                if (isAuthenticated) setAuthMenuOpen((p) => !p)
                else setMenuOpen((p) => !p)
              }}
            >
              {sidebarOpen ? <X className="size-5" /> : <HamburgerIcon />}
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="Polymarket" className="h-4.5 sm:h-5.5 w-auto" />
            </div>

            {/* Desktop nav — xl+ */}
            <nav className="hidden xl:flex items-center gap-6 py-1.5 px-3 text-sm font-bold">
              <button
                className="text-secondary transition-colors cursor-pointer hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/markets/trending")
                }}
              >
                Trending
              </button>
              <button
                className="text-secondary transition-colors cursor-pointer hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate("/markets/category/Breaking")
                }}
              >
                Breaking
              </button>
              <button
                className="text-secondary transition-colors cursor-pointer hover:text-white"
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
                    toggleDropdown("more")
                  }}
                  className="flex items-center gap-1 text-secondary cursor-pointer transition-colors hover:text-white ml-0"
                >
                  More{" "}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${activeDropdown === "more" ? "rotate-180" : ""}`}
                  />
                </button>

                {activeDropdown === "more" && (
                  <Dropdown
                    onClose={() => dispatch(clearActiveDropdown())}
                    className="w-48 md:left-0 md:mt-2.5 cursor-pointer"
                  >
                    <MenuItem
                      label="Hollywood"
                      onClick={() => {
                        dispatch(clearActiveDropdown())
                        navigate("/markets/category/Hollywood")
                      }}
                    />
                    <MenuItem
                      label="Awards"
                      onClick={() => {
                        dispatch(clearActiveDropdown())
                        navigate("/markets/category/Awards")
                      }}
                    />
                  </Dropdown>
                )}
              </div>
            </nav>
          </div>

          {/* ── Right side ── */}
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
                  className="hidden md:inline-flex bg-primary text-background text-xs font-bold hover:bg-primary/90 px-4 rounded-sm h-8 cursor-pointer"
                >
                  {depositLoading ? "Opening wallet" : "Deposit"}
                </Button>

                <div>
                  <NotificationBell
                    isOpen={activeDropdown === "notifications"}
                    onToggle={() => toggleDropdown("notifications")}
                  />
                </div>

                {/* Profile avatar + dropdown */}
                <div className="relative hidden md:block">
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDropdown("profile")
                    }}
                  >
                    <Avatar email={email} address={publicAddress} />
                  </div>

                  {activeDropdown === "profile" && (
                    <Dropdown
                      onClose={() => dispatch(clearActiveDropdown())}
                      className="w-72 md:right-0 md:top-11"
                    >
                      <div className="p-5 flex items-start gap-4 relative">
                        {/* Settings button top right */}
                        {/* <button className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
                          <Settings size={16} />
                        </button> */}

                        <div
                          className="flex items-center gap-4 cursor-pointer group flex-1"
                          onClick={() => {
                            dispatch(clearActiveDropdown())
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
                            dispatch(clearActiveDropdown())
                            navigate(`/leaderboard/${user.publicAddress}`)
                          }}
                        />
                        <MenuItem
                          icon={<Medal size={20} className="text-primary fill-primary/10" />}
                          label="Rewards"
                          onClick={() => {
                            dispatch(clearActiveDropdown())
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
                {/* <div className="hidden xl:flex items-center gap-2 text-secondary cursor-pointer hover:opacity-80 transition-opacity">
                  <Info className="size-4" />
                  <span className="text-sm font-medium text-nowrap">How it works</span>
                </div> */}
                <Button
                  variant="default"
                  className="hidden md:inline-flex bg-accent text-white font-base font-bold text-xs hover:bg-accent/90 px-3 sm:px-4 rounded-sm sm:h-8 h-7  cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Log In
                </Button>
                <Button
                  variant="default"
                  className="hidden md:inline-flex bg-accent text-primary font-bold border-black border text-xs hover:bg-accent/90 px-3 sm:px-4 rounded-sm sm:h-8 h-7 cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Sign Up
                </Button>

                {!isAuthenticated && (
                  <div className="hidden xl:block relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDropdown("loggedOutMenu")
                      }}
                      className="flex items-center gap-1 text-secondary transition-colors hover:text-white ml-2"
                    >
                      <HamburgerIcon />
                    </button>

                    {activeDropdown === "loggedOutMenu" && (
                      <Dropdown
                        onClose={() => dispatch(clearActiveDropdown())}
                        className="w-48 md:right-0 md:left-auto md:mt-2.5"
                      >
                        <MenuItem
                          icon={<BarChart3 size={20} className="text-primary" />}
                          label="Leaderboard"
                          onClick={() => {
                            dispatch(clearActiveDropdown())
                            navigate("/leaderboard/guest")
                          }}
                        />
                        <MenuItem
                          icon={<Medal size={20} className="text-primary fill-primary/10" />}
                          label="Rewards"
                          onClick={() => {
                            dispatch(clearActiveDropdown())
                            navigate("/rewards/guest")
                          }}
                        />
                      </Dropdown>
                    )}
                  </div>
                )}
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
const HamburgerIcon = () => <img src="/icons/hamburger.svg" alt="Menu" className="size-5" />
