import { Bell, ChevronDown, ChevronRight, Info, Moon, Search, Settings, X } from "lucide-react"
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
import { formatCash, formatPortfolio } from "@/libs/formatCurrency"
import { setMetaMaskLoggedOut } from "@/routes/utils"

import { CategoryTabs } from "./CategoryTabs"

// ─── FIX 1: Polymarket diamond/shield SVG logo ────────────────────────────────

// ─── Avatar initials ──────────────────────────────────────────────────────────
// FIX 6: w-9 h-9 (slightly larger), rounded-full (already was)
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
      if (user.loginMethod === LOGIN_METHODS.Email || user.loginMethod === LOGIN_METHODS.Google) {
        try {
          await logoutToBackend().unwrap()
        } catch (err) {
          console.error("Backend logout failed:", err)
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
    if (isAuthenticated) navigate(`${ROUTES.PORTFOLIO}`)
    else setIsLoginOpen(true)
  }

  return (
    <>
      {/* FIX 9: bg-[#0d0f13] instead of bg-background/80 */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0d0f13] md:mx-20">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* ── FIX 1: Logo + Nav ── */}
          <div className="flex items-center gap-8 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex items-center gap-0">
              <div className="size-8 rounded-md flex items-center justify-center shrink-0">
                <img src="/icon-black.png" alt="logo" className="size-8 invert" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">Polymarket</span>
            </div>

            {/* FIX 2: all nav links same muted color + weight, none highlighted */}
            <nav className="hidden md:flex items-center gap-6">
              {["Trending", "Breaking", "New"].map((link) => (
                <button
                  key={link}
                  className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
                >
                  {link}
                </button>
              ))}
              {/* FIX 3: More with chevron */}
              <button className="flex items-center gap-1 text-[13px] font-medium text-white/60 hover:text-white transition-colors">
                More <ChevronDown size={13} className="opacity-70" />
              </button>
            </nav>
          </div>

          {/* FIX 4: Search bar max-w-[360px] not too wide */}
          <div className="hidden lg:flex max-w-[280px] w-full ml-70 shrink-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <input
              type="text"
              placeholder="Search markets"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-white/30"
            />
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* FIX 5: gap-6 between portfolio and cash (was gap-4) */}
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

                {/* Deposit */}
                <Button
                  onClick={handleDeposit}
                  className="bg-[#00c853] text-black font-bold hover:bg-[#00c853]/90 px-5 rounded-lg h-9 text-[13px]"
                >
                  Deposit
                </Button>

                {/* Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/40 hover:text-white h-9 w-9"
                >
                  <Bell className="size-[18px]" />
                </Button>

                {/* Avatar */}
                <div className="relative">
                  <div onClick={() => setProfileOpen((p) => !p)}>
                    <Avatar email={email} address={publicAddress} />
                  </div>

                  {profileOpen && (
                    <Dropdown onClose={() => setProfileOpen(false)}>
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
      <LoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}

// ─── Hamburger ────────────────────────────────────────────────────────────────
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
    <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
  </svg>
)
