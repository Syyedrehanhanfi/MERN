import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { History as HistoryIcon, Play, Eye, Clock, CalendarDays } from "lucide-react";
import { userService } from "@/services";

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

// Premium relative timestamp — "Just now", "2 hours ago", "Yesterday", "3 days ago", etc.
function watchedLabel(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Watched just now";
  if (mins < 60) return `Watched ${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `Watched ${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Watched yesterday";
  if (days < 7) return `Watched ${days} days ago`;
  if (days < 30) return `Watched ${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} ago`;
  return `Watched on ${new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;
}

// Group videos by relative day bucket
function groupByDay(videos) {
  const groups = {};
  videos.forEach((v) => {
    const d = Math.floor((Date.now() - new Date(v.createdAt).getTime()) / 86_400_000);
    const key = d === 0 ? "Today" : d === 1 ? "Yesterday" : d < 7 ? "This Week" : d < 30 ? "This Month" : "Older";
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  });
  // Preserve order
  const ORDER = ["Today", "Yesterday", "This Week", "This Month", "Older"];
  return ORDER.filter((k) => groups[k]).map((k) => ({ label: k, videos: groups[k] }));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[3, 4, 2].map((count, gi) => (
        <div key={gi}>
          <div className="h-4 bg-neutral-800 rounded w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-2xl bg-neutral-900/40">
                <div className="w-44 aspect-video rounded-xl bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-800 rounded w-1/3" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── History Item ──────────────────────────────────────────────────────────────
function HistoryItem({ video, index }) {
  const owner = video.owner ?? {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/watch/${video._id}`}
        id={`history-item-${video._id}`}
        className="flex gap-4 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors group"
      >
        {/* Thumbnail */}
        <div className="relative w-44 aspect-video rounded-xl overflow-hidden bg-neutral-800 shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {video.duration > 0 && (
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-semibold">
              {formatDuration(video.duration)}
            </span>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25">
            <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-4 w-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>

          <Link
            to={`/channel/${owner.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-2 group/ch"
          >
            <div className="h-5 w-5 rounded-full overflow-hidden bg-neutral-700 shrink-0">
              {owner.avatar
                ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
                : <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-[8px] text-white font-bold">{owner.fullName?.[0]}</div>
              }
            </div>
            <span className="text-xs text-neutral-400 group-hover/ch:text-white transition-colors">{owner.fullName}</span>
          </Link>

          <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{fmtViews(video.views)} views</span>
          </div>

          <p className="mt-2 text-[11px] font-medium text-neutral-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {watchedLabel(video.createdAt)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main History Page ─────────────────────────────────────────────────────────
export default function History() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await userService.getWatchHistory();
        const videos = res.data?.data ?? [];
        setGroups(groupByDay(videos));
      } catch {
        setError("Failed to load watch history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalVideos = groups.reduce((sum, g) => sum + g.videos.length, 0);

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-red-500" />
              Watch History
            </h1>
            {!loading && totalVideos > 0 && (
              <p className="text-sm text-neutral-500 mt-0.5">{totalVideos} video{totalVideos !== 1 ? "s" : ""} watched</p>
            )}
          </div>
          {!loading && totalVideos > 0 && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <CalendarDays className="h-4 w-4" />
              Grouped by date
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8">
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
        {loading && <HistorySkeleton />}

        {/* Empty */}
        {!loading && !error && totalVideos === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
              <HistoryIcon className="h-8 w-8 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No watch history yet</h2>
            <p className="text-neutral-500 text-sm max-w-xs">
              Videos you watch will appear here so you can easily find them later.
            </p>
            <Link to="/" className="mt-6 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all">
              Browse Videos
            </Link>
          </motion.div>
        )}

        {/* Grouped list */}
        {!loading && !error && totalVideos > 0 && (
          <div className="space-y-10">
            {groups.map((group, gi) => {
              // Calculate stagger offset per group
              const offset = groups.slice(0, gi).reduce((s, g) => s + g.videos.length, 0);
              return (
                <div key={group.label}>
                  {/* Group header */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: offset * 0.04, duration: 0.3 }}
                    className="flex items-center gap-3 mb-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
                      {group.label}
                    </h2>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                    <span className="text-xs text-neutral-600">{group.videos.length}</span>
                  </motion.div>

                  {/* Items */}
                  <div className="space-y-1">
                    {group.videos.map((video, i) => (
                      <HistoryItem
                        key={video._id}
                        video={video}
                        index={offset + i}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
