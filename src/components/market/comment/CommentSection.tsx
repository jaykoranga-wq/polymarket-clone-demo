import "./commentSection.css"

import { useState } from "react"

import type { Comment } from "@/mocks/mockComments"
import { MOCK_COMMENTS } from "@/mocks/mockComments"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return "just now"
}

function getInitials(author: string): string {
  if (author.startsWith("0x")) return author.slice(2, 4).toUpperCase()
  return author.slice(0, 2).toUpperCase()
}

function getAvatarColor(author: string): string {
  const colors = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#ec4899,#f43f5e)",
    "linear-gradient(135deg,#14b8a6,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#22c55e,#16a34a)",
    "linear-gradient(135deg,#3b82f6,#6366f1)",
  ]
  let hash = 0
  for (const c of author) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length] as string
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = ({ author, size = 32 }: { author: string; size?: number }) => (
  <div
    className="cs-avatar"
    style={{
      width: size,
      height: size,
      background: getAvatarColor(author),
      fontSize: size * 0.35,
    }}
  >
    {getInitials(author)}
  </div>
)

// ─── Like button ──────────────────────────────────────────────────────────────

const LikeBtn = ({
  count,
  liked,
  onToggle,
}: {
  count: number
  liked: boolean
  onToggle: () => void
}) => (
  <button className={`cs-like-btn${liked ? " liked" : ""}`} onClick={onToggle}>
    <svg
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
    <span>{count}</span>
  </button>
)

// ─── Single comment ───────────────────────────────────────────────────────────

const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
  const [liked, setLiked] = useState(comment.liked)
  const [likes, setLikes] = useState(comment.likes)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [showReplies, setShowReplies] = useState(false)

  const hasReplies = (comment.replies?.length ?? 0) > 0

  const handleLike = () => {
    setLiked((p) => !p)
    setLikes((p) => (liked ? p - 1 : p + 1))
  }

  return (
    <div className={`cs-comment${depth > 0 ? " cs-reply" : ""}`}>
      <Avatar author={comment.author} size={depth > 0 ? 28 : 34} />

      <div className="cs-comment-body">
        {/* Header */}
        <div className="cs-comment-header">
          <span className="cs-author">{comment.author}</span>
          <span className="cs-time">{timeAgo(comment.timestamp)}</span>
        </div>

        {/* Content */}
        <p className="cs-content">{comment.content}</p>

        {/* Actions */}
        <div className="cs-actions">
          <LikeBtn count={likes} liked={liked} onToggle={handleLike} />
          {depth === 0 && (
            <button className="cs-reply-btn" onClick={() => setShowReply((p) => !p)}>
              Reply
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="cs-reply-input-wrap">
            <input
              className="cs-input"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <div className="cs-reply-actions">
              <button
                className="cs-cancel-btn"
                onClick={() => {
                  setShowReply(false)
                  setReplyText("")
                }}
              >
                Cancel
              </button>
              <button
                className="cs-post-btn"
                disabled={!replyText.trim()}
                onClick={() => {
                  setShowReply(false)
                  setReplyText("")
                }}
              >
                Reply
              </button>
            </div>
          </div>
        )}

        {/* Toggle replies */}
        {hasReplies && (
          <button className="cs-toggle-replies" onClick={() => setShowReplies((p) => !p)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{
                transform: showReplies ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {showReplies ? "Hide" : `View ${comment.replies!.length}`}{" "}
            {comment.replies!.length === 1 ? "reply" : "replies"}
          </button>
        )}

        {/* Replies */}
        {showReplies &&
          comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
      </div>
    </div>
  )
}

// ─── Comment Section ──────────────────────────────────────────────────────────

interface CommentSectionProps {
  marketId?: string // pass when wiring to real API
}

export const CommentSection = ({ marketId: _marketId }: CommentSectionProps) => {
  // TODO: replace MOCK_COMMENTS with useGetCommentsQuery(marketId) when API is ready
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
  const [text, setText] = useState("")
  const [sortBy, setSortBy] = useState<"top" | "new">("new")

  const sorted = [...comments].sort((a, b) =>
    sortBy === "top"
      ? b.likes - a.likes
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  const handlePost = () => {
    if (!text.trim()) return
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: "You",
      avatar: null,
      content: text.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false,
      replies: [],
    }
    setComments((p) => [newComment, ...p])
    setText("")
  }

  return (
    <div className="cs-wrap ep-section">
      {/* Header */}
      <div className="cs-header">
        <span className="ep-section-title">
          Comments <span className="cs-count">{comments.length}</span>
        </span>
        <div className="cs-sort-tabs">
          {(["top", "new"] as const).map((s) => (
            <button
              key={s}
              className={`cs-sort-tab${sortBy === s ? " active" : ""}`}
              onClick={() => setSortBy(s)}
            >
              {s === "top" ? "Top" : "New"}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="cs-compose">
        <Avatar author="You" size={34} />
        <div className="cs-compose-right">
          <input
            className="cs-input"
            placeholder="Share your analysis..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePost()}
          />
          {text.trim() && (
            <div className="cs-reply-actions">
              <button className="cs-cancel-btn" onClick={() => setText("")}>
                Cancel
              </button>
              <button className="cs-post-btn" onClick={handlePost}>
                Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments list */}
      <div className="cs-list">
        {sorted.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>
    </div>
  )
}
