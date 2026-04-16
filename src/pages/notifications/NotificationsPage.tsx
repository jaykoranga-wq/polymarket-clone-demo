// src/pages/notifications/NotificationsPage.tsx

import { Bell, ChevronLeft, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router"

import type { RootState } from "@/app/store"
import {
  useDeleteNotificationsMutation,
  useLazyGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/features/api/notifications/notificationApi"
import {
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_TYPES,
} from "@/features/notifications/notificationConstants"
import {
  appendNotifications,
  clearAll,
  markAllRead,
  markRead,
  type Notification,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
  setNotifications,
} from "@/features/notifications/notificationSlice"

const LIMIT = 20

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Type icon ─────────────────────────────────────────────────────────────────
const TypeIcon = ({ type }: { type: Notification["type"] }) => {
  const config = NOTIFICATION_TYPE_CONFIG[type]
  return (
    <div
      className="w-10 h-10 rounded-full font-sm font-bold flex items-center justify-center shrink-0"
      style={{ background: config.bg, color: config.color }}
    >
      {config.icon}
    </div>
  )
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
type Filter = "all" | "unread"

const FilterTabs = ({
  active,
  unreadCount,
  onChange,
}: {
  active: Filter
  unreadCount: number
  onChange: (f: Filter) => void
}) => (
  <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
    {(["all", "unread"] as Filter[]).map((f) => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 capitalize"
        style={{
          background: active === f ? "rgba(255,255,255,0.1)" : "transparent",
          color: active === f ? "#fff" : "rgba(255,255,255,0.4)",
        }}
      >
        {f}
        {f === "unread" && unreadCount > 0 && (
          <span className="ml-1.5 text-xs font-bold text-primary">({unreadCount})</span>
        )}
      </button>
    ))}
  </div>
)

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ filter }: { filter: Filter }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
      <Bell size={22} color="rgba(255,255,255,0.2)" />
    </div>
    <p className="text-sm font-semibold text-white/40">
      {filter === "unread" ? "No unread notifications" : "No notifications"}
    </p>
    <p className="text-xs text-white/20">
      {filter === "unread" ? "You're all caught up!" : "New notifications will appear here."}
    </p>
  </div>
)

// ── Notification row ──────────────────────────────────────────────────────────
const NotifRow = ({ notif }: { notif: Notification }) => {
  const dispatch = useDispatch()
  const [deleteNotifications] = useDeleteNotificationsMutation()
  const [markNotificationsRead] = useMarkNotificationsReadMutation()

  return (
    <div
      onClick={() => {
        if (!notif.read) {
          void markNotificationsRead({ notificationRecipientId: notif.id })
          dispatch(markRead(notif.id))
        }
      }}
      className="flex gap-4 px-5 py-4 border-b border-white/5 cursor-pointer transition-colors duration-150 group relative"
      style={{ background: notif.read ? "transparent" : "rgba(16,210,96,0.04)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = notif.read ? "transparent" : "rgba(16,210,96,0.04)")
      }
    >
      {/* Unread indicator */}
      {!notif.read && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full bg-[#10D260]" />
      )}

      <TypeIcon type={notif.type} />

      <div className="flex-1 min-w-0">
        <div
          className="text-sm mb-0.5"
          style={{
            fontWeight: notif.read ? 500 : 700,
            color: notif.read ? "rgba(255,255,255,0.75)" : "#ffffff",
          }}
        >
          {notif.title}
        </div>
        <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{notif.message}</p>
        <span className="text-xs text-white/25 mt-1 block">{timeAgo(notif.timestamp)}</span>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          void deleteNotifications({ notificationRecipientId: notif.id })
          dispatch(removeNotification(notif.id))
        }}
        className="shrink-0 self-start p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 text-white/25 hover:text-white/70 hover:bg-white/8"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
const RowSkeleton = () => (
  <div className="flex gap-4 px-5 py-4 border-b border-white/5 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-white/8 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-white/8 rounded-full w-2/5" />
      <div className="h-3 bg-white/5 rounded-full w-4/5" />
      <div className="h-2.5 bg-white/5 rounded-full w-1/4" />
    </div>
  </div>
)

// ── Type filter pills ─────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { label: "All types", value: null },
  { label: "Fill", value: NOTIFICATION_TYPES.FILL },
  { label: "System", value: NOTIFICATION_TYPES.SYSTEM },
  { label: "Order", value: NOTIFICATION_TYPES.ORDER },
  { label: "Trade", value: NOTIFICATION_TYPES.TRADE },
] as const

type TypeFilter = (typeof TYPE_FILTERS)[number]["value"]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const token = useSelector((state: RootState) => state.auth.token)
  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadCount)

  const [filter, setFilter] = useState<Filter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [nextSkip, setNextSkip] = useState(0)

  const [triggerFetch] = useLazyGetNotificationsQuery()
  const [deleteNotifications] = useDeleteNotificationsMutation()
  const [markNotificationsRead] = useMarkNotificationsReadMutation()

  const fetchPage = useCallback(
    async (pageSkip: number) => {
      if (!token) return
      setIsFetchingMore(true)
      try {
        const result = await triggerFetch({ limit: LIMIT, skip: pageSkip }, pageSkip > 0)
        if (!result.data) return
        const items = result.data

        if (pageSkip === 0) {
          dispatch(setNotifications(items))
        } else {
          dispatch(appendNotifications(items))
        }

        const more = items.length >= LIMIT
        setHasMore(more)
        setNextSkip(more ? pageSkip + LIMIT : pageSkip)
      } finally {
        setIsFetchingMore(false)
        setIsInitialLoad(false)
      }
    },
    [token, triggerFetch, dispatch],
  )

  // Initial fetch on mount
  useEffect(() => {
    if (token) {
      void fetchPage(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 120 && !isFetchingMore && hasMore) {
      void fetchPage(nextSkip)
    }
  }

  // Derived filtered list
  const displayed = notifications.filter((n) => {
    const readOk = filter === "all" || !n.read
    const typeOk = typeFilter === null || n.type === typeFilter
    return readOk && typeOk
  })

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/6 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-white flex-1">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-extrabold text-primary bg-primary/8 py-0.5 px-2.5 rounded-full border border-primary/30">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <FilterTabs active={filter} unreadCount={unreadCount} onChange={setFilter} />

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  void markNotificationsRead()
                  dispatch(markAllRead())
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/6 transition-all border border-white/8"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  void deleteNotifications()
                  dispatch(clearAll())
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all border border-white/8"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* ── Type filter pills ── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TYPE_FILTERS.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setTypeFilter(value)}
              className="text-xs font-medium px-3 py-1 rounded-full border transition-all duration-150"
              style={{
                background: typeFilter === value ? "rgba(255,255,255,0.1)" : "transparent",
                borderColor:
                  typeFilter === value ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                color: typeFilter === value ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Notification list ── */}
        <div
          className="rounded-xl border border-white/8 overflow-hidden bg-slate"
          onScroll={handleScroll}
          style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}
        >
          {/* Initial skeleton */}
          {isInitialLoad && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </>
          )}

          {/* Empty state */}
          {!isInitialLoad && displayed.length === 0 && <EmptyState filter={filter} />}

          {/* Rows */}
          {!isInitialLoad && displayed.map((n) => <NotifRow key={n.id} notif={n} />)}

          {/* Fetch-more spinner */}
          {isFetchingMore && !isInitialLoad && (
            <div className="flex items-center justify-center py-5">
              <span className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
            </div>
          )}

          {/* End of list */}
          {!isFetchingMore && !hasMore && displayed.length > 0 && (
            <p className="text-center text-xs text-white/20 py-4 select-none">
              You've seen all notifications
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
