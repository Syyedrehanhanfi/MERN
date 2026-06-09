import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, Share2, ListPlus, Eye, Clock, Bell,
  Send, Trash2, Pencil, ChevronDown, Loader2, AlertCircle,
} from "lucide-react";
import { videoService, commentService, likeService, subscriptionService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import VideoCard from "@/components/video/VideoCard";

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function fmtNum(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── CommentItem ───────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(comment.likesCount ?? 0);
  const owner = comment.owner ?? {};
  const isOwner = owner._id === currentUserId;

  const handleSave = async () => {
    if (!editText.trim() || editText === comment.content) { setEditing(false); return; }
    setSaving(true);
    try {
      await commentService.updateComment(comment._id, { content: editText.trim() });
      onUpdate(comment._id, editText.trim());
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleLike = async () => {
    setLiked((p) => !p);
    setLikesCount((p) => liked ? p - 1 : p + 1);
    try { await likeService.toggleCommentLike(comment._id); }
    catch { setLiked((p) => !p); setLikesCount((p) => liked ? p + 1 : p - 1); }
  };

  return (
    <div className="flex gap-3 group">
      <Link to={`/channel/${owner.username}`} className="shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-700">
          {owner.avatar
            ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center text-xs text-white font-bold bg-gradient-to-br from-red-600 to-purple-700">{owner.fullName?.[0] ?? "?"}</div>
          }
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/channel/${owner.username}`} className="text-sm font-semibold text-white hover:text-red-400 transition-colors">
            {owner.fullName}
          </Link>
          <span className="text-xs text-neutral-500">{timeAgo(comment.createdAt)}</span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-red-600 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditText(comment.content); }}
                className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-xs transition-all">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">{comment.content}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-red-400" : "text-neutral-500 hover:text-white"}`}>
            <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-red-400" : ""}`} />
            {likesCount > 0 && fmtNum(likesCount)}
          </button>

          {isOwner && !editing && (
            <>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs text-neutral-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button onClick={() => onDelete(comment._id)}
                className="flex items-center gap-1 text-xs text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CommentsSection ───────────────────────────────────────────────────────────
function CommentsSection({ videoId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await commentService.getVideoComments(videoId, { page: 1, limit: 20 });
        const data = res.data?.data;
        setComments(data?.docs ?? []);
        setHasMore(data?.hasNextPage ?? false);
        setPage(1);
      } finally { setLoading(false); }
    })();
  }, [videoId]);

  const loadMore = async () => {
    const next = page + 1;
    const res = await commentService.getVideoComments(videoId, { page: next, limit: 20 });
    const data = res.data?.data;
    setComments((p) => [...p, ...(data?.docs ?? [])]);
    setHasMore(data?.hasNextPage ?? false);
    setPage(next);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const res = await commentService.addComment(videoId, { content: newComment.trim() });
      const created = { ...res.data?.data, owner: { _id: user._id, fullName: user.fullName, username: user.username, avatar: user.avatar } };
      setComments((p) => [created, ...p]);
      setNewComment("");
    } finally { setPosting(false); }
  };

  const handleDelete = async (commentId) => {
    await commentService.deleteComment(commentId);
    setComments((p) => p.filter((c) => c._id !== commentId));
  };

  const handleUpdate = (commentId, content) => {
    setComments((p) => p.map((c) => c._id === commentId ? { ...c, content } : c));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">
        {loading ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
      </h3>

      {/* Add comment */}
      <form onSubmit={postComment} className="flex gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-700 shrink-0">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center text-xs text-white font-bold bg-gradient-to-br from-red-600 to-purple-700">{user?.fullName?.[0]}</div>
          }
        </div>
        <div className="flex-1 space-y-2">
          <input
            id="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
          />
          <AnimatePresence>
            {newComment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-end"
              >
                <button
                  type="submit"
                  disabled={posting}
                  id="post-comment-btn"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-60"
                >
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Comment
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-neutral-800 rounded w-1/4" />
                <div className="h-3 bg-neutral-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c._id}
              comment={c}
              currentUserId={user?._id}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
          {hasMore && (
            <button onClick={loadMore}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
              <ChevronDown className="h-4 w-4" /> Load more comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── VideoPlayer (main page) ───────────────────────────────────────────────────
export default function VideoPlayer() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [related, setRelated] = useState([]);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      setLoading(true);
      try {
        const [videoRes, relatedRes] = await Promise.all([
          videoService.getVideoById(videoId),
          videoService.getAllVideos({ limit: 8, sortBy: "views", sortType: "desc" }),
        ]);
        const v = videoRes.data?.data;
        setVideo(v);
        setLiked(v?.isLiked ?? false);
        setLikesCount(v?.likesCount ?? 0);

        // Check subscription status
        if (v?.owner?._id) {
          try {
            const subRes = await subscriptionService.getChannelSubscribers(v.owner._id);
            const subs = subRes.data?.data ?? [];
            setSubscribed(subs.some((s) => s.subscriber?._id === user?._id));
          } catch { /* non-critical */ }
        }

        const relDocs = relatedRes.data?.data?.docs ?? [];
        setRelated(relDocs.filter((r) => r._id !== videoId).slice(0, 8));
      } finally {
        setLoading(false);
      }
    })();
  }, [videoId, user?._id]);

  const handleLike = async () => {
    setLiked((p) => !p);
    setLikesCount((p) => liked ? p - 1 : p + 1);
    try { await likeService.toggleVideoLike(videoId); }
    catch { setLiked((p) => !p); setLikesCount((p) => liked ? p + 1 : p - 1); }
  };

  const handleSubscribe = async () => {
    if (!video?.owner?._id) return;
    setSubscribed((p) => !p);
    try { await subscriptionService.toggleSubscription(video.owner._id); }
    catch { setSubscribed((p) => !p); }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video rounded-2xl bg-neutral-800 w-full" />
        <div className="h-6 bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-800 rounded w-1/2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex gap-3"><div className="aspect-video w-40 rounded-lg bg-neutral-800 shrink-0" /><div className="flex-1 space-y-2"><div className="h-4 bg-neutral-800 rounded" /><div className="h-3 bg-neutral-800 rounded w-2/3" /></div></div>)}
      </div>
    </div>
  );

  if (!video) return (
    <div className="flex h-full items-center justify-center py-32 text-center">
      <div>
        <AlertCircle className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Video not found</h2>
        <p className="text-neutral-500 text-sm mb-6">This video may have been deleted or made private.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors">
          Go back
        </button>
      </div>
    </div>
  );

  const owner = video.owner ?? {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Player + info ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video player */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl shadow-black/50">
            <video
              key={videoId}
              src={video.videoFile}
              controls
              autoPlay
              poster={video.thumbnail}
              className="w-full h-full"
            />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white leading-snug">{video.title}</h1>

          {/* Stats + actions row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{fmtNum(video.views)} views</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{timeAgo(video.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="like-btn"
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${liked ? "bg-red-600/20 text-red-400 border border-red-600/40" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"}`}
              >
                <ThumbsUp className={`h-4 w-4 ${liked ? "fill-red-400" : ""}`} />
                {likesCount > 0 && fmtNum(likesCount)}
                {liked ? "Liked" : "Like"}
              </button>

              <button
                id="share-btn"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-all border border-neutral-700"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>

              <button
                id="save-btn"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-all border border-neutral-700"
              >
                <ListPlus className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          {/* Channel info + subscribe */}
          <div className="flex items-center justify-between rounded-2xl bg-neutral-900/60 border border-white/[0.06] p-4">
            <Link to={`/channel/${owner.username}`} className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-red-600 transition-all">
                {owner.avatar
                  ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-red-600 to-purple-700">{owner.fullName?.[0]}</div>
                }
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-red-400 transition-colors">{owner.fullName}</p>
                <p className="text-xs text-neutral-400">@{owner.username}</p>
              </div>
            </Link>

            {owner._id !== user?._id && (
              <button
                id="subscribe-btn"
                onClick={handleSubscribe}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${subscribed
                    ? "bg-neutral-800 border border-neutral-700 text-neutral-300 hover:border-red-600/40 hover:text-red-400"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30"
                  }`}
              >
                <Bell className="h-4 w-4" />
                {subscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-neutral-900/60 border border-white/[0.06] p-4">
            <p className={`text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap ${!showDesc ? "line-clamp-3" : ""}`}>
              {video.description}
            </p>
            {video.description?.length > 120 && (
              <button
                onClick={() => setShowDesc((p) => !p)}
                className="mt-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                {showDesc ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-2xl bg-neutral-900/40 border border-white/[0.04] p-5">
            <CommentsSection videoId={videoId} />
          </div>
        </div>

        {/* ── Right: Related videos ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Up Next</h3>
          <div className="space-y-3">
            {related.map((v) => (
              <Link
                key={v._id}
                to={`/watch/${v._id}`}
                id={`related-${v._id}`}
                className="flex gap-3 group"
              >
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                  <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {v.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{v.owner?.fullName}</p>
                  <p className="text-xs text-neutral-600">{fmtNum(v.views)} views</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
