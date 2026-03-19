// src/components/navbar/NotificationBell.tsx

import { Bell, Check, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import {
  NOTIFICATION_LIMITS,
  NOTIFICATION_TYPE_CONFIG,
} from "@/features/notifications/notificationConstants"
import {
  clearAll,
  markAllRead,
  markRead,
  type Notification,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
} from "@/features/notifications/notificationSlice"

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const formatBadgeCount = (count: number): string =>
  count > NOTIFICATION_LIMITS.MAX_BADGE_COUNT
    ? `${NOTIFICATION_LIMITS.MAX_BADGE_COUNT}+`
    : String(count)

// ── Sub-components ────────────────────────────────────────────────────────────
const TypeIcon = ({ type }: { type: Notification["type"] }) => {
  const config = NOTIFICATION_TYPE_CONFIG[type]
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: config.bg,
        color: config.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {config.icon}
    </div>
  )
}

const UnreadDot = () => (
  <div
    style={{
      position: "absolute",
      top: 14,
      left: 6,
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: "#00c853",
    }}
  />
)

const EmptyState = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      gap: 10,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Bell size={18} color="rgba(255,255,255,0.2)" />
    </div>
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 500 }}>
      No notifications
    </p>
    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: 0 }}>
      You're all caught up!
    </p>
  </div>
)

// ── Notification row ──────────────────────────────────────────────────────────
const NotifRow = ({ notif }: { notif: Notification }) => {
  const dispatch = useDispatch()
  const unreadBg = "rgba(0,200,83,0.04)"
  const hoverBg = "rgba(255,255,255,0.04)"

  return (
    <div
      onClick={() => dispatch(markRead(notif.id))}
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 14px",
        cursor: "pointer",
        background: notif.read ? "transparent" : unreadBg,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = notif.read ? "transparent" : unreadBg)
      }
    >
      {!notif.read && <UnreadDot />}

      <TypeIcon type={notif.type} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: notif.read ? 500 : 700,
            color: notif.read ? "rgba(255,255,255,0.7)" : "#ffffff",
            marginBottom: 2,
          }}
        >
          {notif.title}
        </div>
        <div
          style={
            {
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties
          }
        >
          {notif.message}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
          {timeAgo(notif.timestamp)}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          dispatch(removeNotification(notif.id))
        }}
        style={{
          color: "rgba(255,255,255,0.2)",
          padding: 4,
          flexShrink: 0,
          alignSelf: "flex-start",
          borderRadius: 4,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── Dropdown header ───────────────────────────────────────────────────────────
const DropdownHeader = ({
  unreadCount,
  hasNotifications,
}: {
  unreadCount: number
  hasNotifications: boolean
}) => {
  const dispatch = useDispatch()

  return (
    <div
      style={{
        padding: "16px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* top row — title + unread badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Notifications</span>
        {unreadCount > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#00c853",
              background: "rgba(0,200,83,0.12)",
              padding: "3px 8px",
              borderRadius: 20,
              border: "1px solid rgba(0,200,83,0.2)",
            }}
          >
            {unreadCount} new
          </span>
        )}
      </div>

      {/* bottom row — action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllRead())}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff"
              e.currentTarget.style.background = "rgba(255,255,255,0.07)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.5)"
              e.currentTarget.style.background = "rgba(255,255,255,0.03)"
            }}
          >
            <Check size={12} /> Mark all read
          </button>
        )}

        {hasNotifications && (
          <button
            onClick={() => dispatch(clearAll())}
            style={{
              flex: unreadCount > 0 ? "0 0 auto" : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(229,57,53,0.7)",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(229,57,53,0.15)",
              background: "rgba(229,57,53,0.04)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e53935"
              e.currentTarget.style.background = "rgba(229,57,53,0.10)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(229,57,53,0.7)"
              e.currentTarget.style.background = "rgba(229,57,53,0.04)"
            }}
          >
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>
    </div>
  )
}
// ── Main component ────────────────────────────────────────────────────────────
export const NotificationBell = () => {
  //   const dispatch      = useDispatch()
  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadCount)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: open ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.color = "rgba(255,255,255,0.8)"
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.color = "rgba(255,255,255,0.4)"
        }}
      >
        <Bell size={18} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#e53935",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "1.5px solid #0d0f13",
            }}
          >
            {formatBadgeCount(unreadCount)}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: NOTIFICATION_LIMITS.DROPDOWN_WIDTH,
            background: "#141920",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <DropdownHeader unreadCount={unreadCount} hasNotifications={notifications.length > 0} />

          <div
            style={{
              maxHeight: NOTIFICATION_LIMITS.MAX_LIST_HEIGHT,
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              notifications.map((n) => <NotifRow key={n.id} notif={n} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
