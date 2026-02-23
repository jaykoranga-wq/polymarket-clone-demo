import { Bell, Search, User } from "lucide-react"
import type { FC } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Button } from "@/components/ui/button"
import { login, selectIsAuthenticated } from "@/features/auth/authSlice"

export const Navbar: FC = () => {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Main Nav */}
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
            <div className="flex items-center gap-1 cursor-pointer transition-colors hover:text-primary">
              <span>More</span>
              <span className="text-[10px]">▼</span>
            </div>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets"
            className="w-full bg-surface border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* User Stats and Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-4 text-xs font-bold mr-2">
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground uppercase tracking-wider scale-75 origin-right">
                    Portfolio
                  </span>
                  <span className="text-primary">$5,675</span>
                </div>
                <div className="flex flex-col items-end border-l border-border pl-4">
                  <span className="text-muted-foreground uppercase tracking-wider scale-75 origin-right">
                    Cash
                  </span>
                  <span className="text-primary">$500</span>
                </div>
              </div>

              <Button
                variant="default"
                className="bg-primary text-background font-bold hover:bg-primary/90 px-6"
              >
                Deposit
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Bell className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <User className="size-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-sm font-bold hover:text-primary"
                onClick={() => dispatch(login())}
              >
                Login
              </Button>
              <Button
                variant="default"
                className="bg-primary text-background font-bold hover:bg-primary/90 px-6"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
