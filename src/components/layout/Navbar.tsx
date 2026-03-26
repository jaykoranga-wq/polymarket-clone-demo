// src/components/layout/Navbar.tsx
// Changes from previous version:
//   1. Search bar now navigates to /markets/search?q=<query> on submit
//   2. Search clears when navigating away

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
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer select-none">
      {initials}
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

// ── Dropdown ──────────────────────────────────────────────────────────────────
const Dropdown = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
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
      className="absolute right-0 top-12 w-64 bg-[#141920] border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 py-2 overflow-hidden"
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
    <form
      onSubmit={handleSearch}
      className="hidden lg:flex max-w-[280px] w-full ml-70 shrink-0 relative"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search markets"
        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/30"
      />
      {/* clear button */}
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

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [depositLoading, setDepositLoading] = useState(false)
  const [metamaskDepositOpen, setMetamaskDepositOpen] = useState(false)

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

  return (
    <>
      <MetaMaskDepositModal
        open={metamaskDepositOpen}
        onClose={() => setMetamaskDepositOpen(false)}
      />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0f13] md:mx-20">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* ── Logo + Nav ── */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-0 cursor-pointer" onClick={() => navigate("/")}>
              <div className="size-8 rounded-md flex items-center justify-center shrink-0">
                <img src="/icon-black.png" alt="logo" className="size-8 invert" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">Polymarket</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {["Trending", "Breaking", "New"].map((link) => (
                <button
                  key={link}
                  onClick={() => navigate(`/markets/${link}`)}
                  className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  {link}
                </button>
              ))}
              <button className="flex items-center gap-1 text-[13px] font-medium text-white/60 hover:text-white transition-colors">
                More <ChevronDown size={13} className="opacity-70" />
              </button>
            </nav>
          </div>

          {/* ── Search bar — navigates to /markets/search?q=... ── */}
          <SearchBar />

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-6 mr-5">
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={handlePortfolioClick}
                  >
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                      Portfolio
                    </span>
                    <span className="text-[13px] font-bold text-[#00c853]">
                      {formatPortfolio(portfolioAmount as number)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">
                      Cash
                    </span>
                    <span className="text-[13px] font-bold text-[#00c853] max-w-[80px] truncate">
                      {formatCash(cashAmount as number)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={debouncedHandleDeposit}
                  disabled={isLoginOpen || depositLoading}
                  className="bg-[#00c853] text-black font-bold hover:bg-[#00c853]/90 px-5 rounded-lg h-9 text-[13px] cursor-pointer"
                >
                  {depositLoading ? "Opening wallet" : "Deposit"}
                </Button>

                <NotificationBell />

                <div className="relative">
                  <div
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
            ) : isAuthChecking ? (
              <AuthLoader />
            ) : (
              <>
                <div className="hidden md:flex items-center gap-2 text-white/50 cursor-pointer hover:text-white transition-colors">
                  <Info className="size-4" />
                  <span className="text-[13px] font-medium">How it works</span>
                </div>
                <Button
                  className="bg-[#00c853] text-black font-bold hover:bg-[#00c853]/90 px-5 rounded-lg h-9 text-[13px] cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Log In
                </Button>
                <Button
                  className="bg-[#00c853] text-black font-bold hover:bg-[#00c853]/90 px-5 rounded-lg h-9 text-[13px] cursor-pointer"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Sign Up
                </Button>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/40 hover:text-white h-9 w-9 cursor-pointer"
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
