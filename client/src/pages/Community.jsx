import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ThumbsUp,
  Loader2, AlertCircle, Send, X, Check, MessageSquare
} from "lucide-react";
import { tweetService, likeService } from "@/services";
import { useAuth } from "@/context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_360_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ── Compose Box ───────────────────────────────────────────────────────────────
function ComposeBox({ user, onPost }) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const MAX = 280;
  const remaining = MAX - content.length;
  const pct = (content.length / MAX) * 100;

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    try {
      const res = await tweetService.createTweet({ content: content.trim() });
      onPost({ ...res.data?.data, owner: user });
      setContent("");
    } finally { setPosting(false); }
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 mb-6">
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white font-bold">{user?.fullName?.[0]}</div>
          }
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            id="tweet-compose"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX))}
            placeholder="Share something with your community..."
            rows={3}
            className="w-full bg-transparent text-white text-sm placeholder:text-neutral-600 focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            {/* Character ring */}
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#333" strokeWidth="2" />
                <circle cx="10" cy="10" r="8" fill="none"
                  stroke={remaining < 20 ? "#ef4444" : remaining < 60 ? "#f59e0b" : "#dc2626"}
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 8}`}
                  strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>
              <span className={`text-xs font-medium ${remaining < 20 ? "text-red-400" : "text-neutral-500"}`}>
                {remaining}
              </span>
            </div>

            <button
              id="post-tweet-btn"
              onClick={handlePost}
              disabled={!content.trim() || posting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tweet Card ────────────────────────────────────────────────────────────────
function TweetCard({ tweet, index, currentUserId, onDelete, onUpdate }) {
  const owner = tweet.owner ?? {};
  const isOwner = owner._id === currentUserId;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(tweet.content);
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(tweet.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(tweet.likesCount ?? 0);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    setLiked((p) => !p);
    setLikesCount((p) => liked ? p - 1 : p + 1);
    try { await likeService.toggleTweetLike(tweet._id); }
    catch { setLiked((p) => !p); setLikesCount((p) => liked ? p + 1 : p - 1); }
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await tweetService.updateTweet(tweet._id, { content: editText.trim() });
      onUpdate(tweet._id, editText.trim());
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tweetService.deleteTweet(tweet._id);
      onDelete(tweet._id);
    } finally { setDeleting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 hover:border-white/[0.10] transition-colors"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
          {owner.avatar
            ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white font-bold">{owner.fullName?.[0]}</div>
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-white">{owner.fullName}</span>
              <span className="text-xs text-neutral-500 ml-2">@{owner.username}</span>
              <span className="text-xs text-neutral-600 ml-2">· {timeAgo(tweet.createdAt)}</span>
            </div>

            {/* Owner actions */}
            {isOwner && !editing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => { setEditing(true); setEditText(tweet.content); }}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all" title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-955/30 transition-all" title="Delete">
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Content / Edit */}
          {editing ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 280))}
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-red-600 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-xs transition-all">
                  <X className="h-3 w-3" />Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
          )}

          {/* Footer */}
          {!editing && (
            <div className="flex items-center gap-4 mt-3">
              <button onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-red-400" : "text-neutral-500 hover:text-white"}`}>
                <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-red-400" : ""}`} />
                <span>{likesCount > 0 ? likesCount : ""} {liked ? "Liked" : "Like"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Community Page ───────────────────────────────────────────────────────
export default function Community() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const res = await tweetService.getUserTweets(user._id);
        setTweets(res.data?.data ?? []);
      } finally { setLoading(false); }
    })();
  }, [user?._id]);

  const handlePost = useCallback((tweet) => {
    setTweets((p) => [tweet, ...p]);
  }, []);

  const handleDelete = useCallback((id) => {
    setTweets((p) => p.filter((t) => t._id !== id));
  }, []);

  const handleUpdate = useCallback((id, content) => {
    setTweets((p) => p.map((t) => t._id === id ? { ...t, content } : t));
  }, []);

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-red-500" />
            Community
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Share updates with your subscribers</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 pt-8">
        {/* Compose */}
        <ComposeBox user={user} onPost={handlePost} />

        {/* Feed */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-neutral-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-neutral-800 rounded w-1/3" />
                    <div className="h-3 bg-neutral-800 rounded w-full" />
                    <div className="h-3 bg-neutral-800 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tweets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-neutral-900 flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-neutral-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No posts yet</h2>
            <p className="text-neutral-500 text-sm">Use the box above to share your first community post.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {tweets.map((tweet, i) => (
                <TweetCard
                  key={tweet._id}
                  tweet={tweet}
                  index={i}
                  currentUserId={user?._id}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}