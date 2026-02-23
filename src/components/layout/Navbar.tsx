import { Bell, ChevronDown, Info, Menu, Search, User } from "lucide-react"
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
            <a
              href="#"
              className="flex items-center gap-1 transition-colors hover:text-foreground group"
            >
              <span>More</span>
              <ChevronDown className="size-3 transition-transform group-hover:translate-y-0.5" />
            </a>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isAuthenticated ? "Search markets" : "Search polymarkets..."}
            className="w-full bg-surface border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* User Stats and Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
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
                  variant="ghost"
                  className="text-sm font-bold text-accent hover:text-accent/80 hover:bg-transparent"
                  onClick={() => dispatch(login())}
                >
                  Log In
                </Button>
                <Button
                  variant="default"
                  className="bg-accent text-white font-bold hover:bg-accent/90 px-6 rounded-lg h-10"
                >
                  Sign Up
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-10 w-10"
                >
                  <Menu className="size-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
