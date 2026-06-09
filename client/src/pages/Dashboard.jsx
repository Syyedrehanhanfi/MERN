import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, Eye, ThumbsUp, Users, Film,
  TrendingUp, Clock, ArrowUpRight, Video, Loader2,
} from "lucide-react";
import { dashboardService } from "@/services";
import VideoCard from "@/components/video/VideoCard";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-5 overflow-hidden group hover:border-white/[0.12] transition-colors"
    >
      {/* Background glow */}
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity ${color}`} />

      <div className="relative z-10">
        <div className={`inline-flex h-10 w-10 rounded-xl items-center justify-center mb-4 ${color.replace("bg-", "bg-").replace("500", "900/50")}`}>
          <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
        </div>
        <p className="text-sm text-neutral-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Toggle row (visibility control) ──────────────────────────────────────────
function VideoRow({ video, onToggle }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(video._id, video.isPublished); }
    finally { setToggling(false); }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900/40 border border-white/[0.04] hover:bg-neutral-900/70 transition-colors">
      <img src={video.thumbnail} alt={video.title} className="h-14 w-24 object-cover rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{video.title}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{fmtNum(video.views)}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{fmtNum(video.likesCount ?? 0)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={toggling}
        id={`toggle-publish-${video._id}`}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${video.isPublished
            ? "bg-green-900/40 text-green-400 border border-green-800/40 hover:bg-green-900/60"
            : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600"
          }`}
      >
        {toggling
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Video className="h-3 w-3" />
        }
        {video.isPublished ? "Published" : "Draft"}
      </button>
    </div>
  );
}

// ── Dashboard page ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoPage, setVideoPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeView, setActiveView] = useState("stats"); // "stats" | "videos"

  useEffect(() => {
    Promise.all([
      dashboardService.getChannelStats().then((r) => setStats(r.data?.data)).catch(() => {}),
      dashboardService.getChannelVideos({ page: 1, limit: 10, sortBy: "createdAt", sortType: "desc" })
        .then((r) => {
          const data = r.data?.data;
          setVideos(data?.docs ?? []);
          setHasMore(data?.hasNextPage ?? false);
        }).catch(() => {}),
    ]).finally(() => { setLoading(false); setVideosLoading(false); });
  }, []);

  const loadMoreVideos = async () => {
    const next = videoPage + 1;
    const res = await dashboardService.getChannelVideos({ page: next, limit: 10, sortBy: "createdAt", sortType: "desc" });
    const data = res.data?.data;
    setVideos((p) => [...p, ...(data?.docs ?? [])]);
    setHasMore(data?.hasNextPage ?? false);
    setVideoPage(next);
  };

  const handleTogglePublish = async (videoId, currentState) => {
    const { videoService } = await import("@/services");
    await videoService.togglePublishStatus(videoId);
    setVideos((prev) => prev.map((v) => v._id === videoId ? { ...v, isPublished: !currentState } : v));
  };

  const statCards = stats ? [
    { icon: Eye,     label: "Total Views",       value: fmtNum(stats.totalViews ?? 0),       color: "bg-blue-500",   delay: 0 },
    { icon: ThumbsUp,label: "Total Likes",        value: fmtNum(stats.totalLikes ?? 0),       color: "bg-red-500",    delay: 0.06 },
    { icon: Users,   label: "Subscribers",        value: fmtNum(stats.totalSubscribers ?? 0), color: "bg-purple-500", delay: 0.12 },
    { icon: Film,    label: "Total Videos",       value: fmtNum(stats.totalVideos ?? 0),      color: "bg-amber-500",  delay: 0.18 },
  ] : [];

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-red-500" />
              Channel Dashboard
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">Monitor your channel performance</p>
          </div>

          <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 border border-white/[0.06]">
            {["stats", "videos"].map((v) => (
              <button
                key={v}
                id={`dash-view-${v}`}
                onClick={() => setActiveView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
                  ${activeView === v ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-8">
        {/* ── Stats view ── */}
        {activeView === "stats" && (
          <div className="space-y-8">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-neutral-800" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => <StatCard key={card.label} {...card} />)}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500">Unable to load stats. Try refreshing.</div>
            )}

            {/* Chart placeholder — visual placeholder for engagement graph */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" /> Recent Performance
                  </h3>
                </div>

                {/* Stylized bar chart from real video data */}
                {videosLoading ? (
                  <div className="h-40 flex items-end gap-2 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-neutral-800 rounded-t-lg" style={{ height: `${30 + Math.random() * 70}%` }} />
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="h-40 flex items-end gap-2">
                    {videos.slice(0, 10).map((v, i) => {
                      const maxViews = Math.max(...videos.map((x) => x.views ?? 0), 1);
                      const pct = Math.max(8, ((v.views ?? 0) / maxViews) * 100);
                      return (
                        <motion.div
                          key={v._id}
                          title={`${v.title}: ${fmtNum(v.views)} views`}
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
                          className="flex-1 bg-gradient-to-t from-red-600/80 to-red-400/40 rounded-t-lg hover:from-red-500 transition-colors cursor-pointer"
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-neutral-600 text-sm">
                    No video data yet
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                  <span className="text-xs text-neutral-500">Views per video</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Videos management view ── */}
        {activeView === "videos" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">Your Videos ({videos.length})</h2>
            </div>

            {videosLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-neutral-800" />)}
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <Film className="h-12 w-12 text-neutral-700 mb-4" />
                <p className="text-neutral-500">You haven't uploaded any videos yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {videos.map((v) => (
                    <VideoRow key={v._id} video={v} onToggle={handleTogglePublish} />
                  ))}
                </div>
                {hasMore && (
                  <button onClick={loadMoreVideos}
                    className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 font-medium transition-colors mt-4">
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
