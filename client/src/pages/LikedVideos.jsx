import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Play, Eye, Clock, Heart } from "lucide-react";
import { likeService } from "@/services";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(s = 0) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtViews(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-video rounded-xl bg-neutral-800 mb-3" />
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-4/5" />
              <div className="h-3 bg-neutral-800 rounded w-2/5" />
              <div className="h-3 bg-neutral-800 rounded w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Liked Video Card (with Unlike button) ─────────────────────────────────────
function LikedVideoCard({ video, index, onUnlike }) {
  const owner = video.owner ?? {};
  const [unliking, setUnliking] = useState(false);
  const [removing, setRemoving] = useState(false); // triggers exit animation

  const handleUnlike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUnliking(true);
    try {
      // Optimistic: start exit animation immediately
      setRemoving(true);
      await likeService.toggleVideoLike(video._id);
      // Let animation finish then remove from list
      setTimeout(() => onUnlike(video._id), 250);
    } catch {
      setRemoving(false);
      setUnliking(false);
    }
  };

  return (
    <AnimatePresence>
      {!removing && (
        <motion.div
          key={video._id}
          layout
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
          transition={{
            delay: index * 0.05,
            duration: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="group flex flex-col gap-3"
        >
          <Link to={`/watch/${video._id}`} id={`liked-${video._id}`} className="block relative">
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
              <img
                src={video.thumbnail}
                alt={video.title}
                loading="lazy"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Duration */}
              {video.duration > 0 && (
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-semibold">
                  {formatDuration(video.duration)}
                </span>
              )}

              {/* Play hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Unlike button — appears on hover, top-right of thumbnail */}
              <button
                id={`unlike-btn-${video._id}`}
                onClick={handleUnlike}
                disabled={unliking}
                className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                           bg-black/60 backdrop-blur-sm text-red-400 text-xs font-semibold
                           opacity-0 group-hover:opacity-100 hover:bg-red-950/80 hover:text-red-300
                           transition-all duration-200 border border-red-800/30"
                title="Remove from Liked Videos"
              >
                <Heart className={`h-3.5 w-3.5 fill-red-400 ${unliking ? "animate-pulse" : ""}`} />
                {unliking ? "Removing..." : "Unlike"}
              </button>
            </div>
          </Link>

          {/* Meta */}
          <div className="flex gap-3">
            <Link
              to={`/channel/${owner.username}`}
              className="shrink-0 mt-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-700 ring-2 ring-transparent hover:ring-red-600 transition-all">
                {owner.avatar
                  ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-red-600 to-purple-700">{owner.fullName?.[0] ?? "?"}</div>
                }
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link to={`/watch/${video._id}`}>
                <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                  {video.title}
                </h3>
              </Link>
              <Link
                to={`/channel/${owner.username}`}
                className="text-xs text-neutral-400 hover:text-white transition-colors mt-1 block"
              >
                {owner.fullName ?? owner.username}
              </Link>
              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{fmtViews(video.views)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(video.createdAt)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Liked Videos Page ────────────────────────────────────────────────────
export default function LikedVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // GET /likes/videos — returns liked video objects with owner populated
        const res = await likeService.getLikedVideos();
        const raw = res.data?.data ?? [];
        // Backend returns Like docs with a populated `video` field — normalize:
        const normalized = raw.map((item) => item.video ?? item).filter(Boolean);
        setVideos(normalized);
      } catch {
        setError("Failed to load liked videos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Optimistic remove from list after unlike
  const handleUnlike = useCallback((videoId) => {
    setVideos((prev) => prev.filter((v) => v._id !== videoId));
  }, []);

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-red-500" />
              Liked Videos
            </h1>
            {!loading && (
              <p className="text-sm text-neutral-500 mt-0.5">
                {videos.length} video{videos.length !== 1 ? "s" : ""} liked
              </p>
            )}
          </div>

          {!loading && videos.length > 0 && (
            <p className="text-xs text-neutral-600 hidden sm:block">
              Hover a card to unlike it
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8">
        {/* Error */}
        {error && (
          <div className="flex items-center justify-center py-24 text-center">
            <div>
              <p className="text-red-400 mb-3">{error}</p>
              <button onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Skeleton */}
        {loading && <GridSkeleton />}

        {/* Empty */}
        {!loading && !error && videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
              <Heart className="h-8 w-8 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No liked videos yet</h2>
            <p className="text-neutral-500 text-sm max-w-xs">
              Like videos while watching to save them here. They'll appear in this collection.
            </p>
            <Link to="/" className="mt-6 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all shadow-lg shadow-red-900/30">
              Discover Videos
            </Link>
          </motion.div>
        )}

        {/* Video grid with stagger */}
        {!loading && !error && videos.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {videos.map((video, i) => (
              <LikedVideoCard
                key={video._id}
                video={video}
                index={i}
                onUnlike={handleUnlike}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
