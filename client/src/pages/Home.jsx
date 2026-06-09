import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, TrendingUp, Clock, Eye,
  Play, Upload, ChevronDown, Loader2,
} from "lucide-react";
import { videoService } from "@/services";
import VideoCard from "@/components/video/VideoCard";
import UploadModal from "@/components/video/UploadModal";

const SORT_OPTIONS = [
  { label: "Newest",   value: "createdAt", type: "desc" },
  { label: "Oldest",   value: "createdAt", type: "asc"  },
  { label: "Most Viewed", value: "views",  type: "desc" },
  { label: "Longest",  value: "duration",  type: "desc" },
];

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("query") || "";

  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [sortIdx, setSortIdx] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const loaderRef = useRef(null);

  const activeSortLabel = SORT_OPTIONS[sortIdx].label;

  // ── Fetch videos ──────────────────────────────
  const fetchVideos = useCallback(async (pageNum = 1, replace = false) => {
    try {
      const sort = SORT_OPTIONS[sortIdx];
      const res = await videoService.getAllVideos({
        page: pageNum,
        limit: 12,
        query: urlQuery,
        sortBy: sort.value,
        sortType: sort.type,
      });
      const data = res.data?.data;
      const docs = data?.docs ?? [];
      setVideos((prev) => (replace ? docs : [...prev, ...docs]));
      setHasMore(data?.hasNextPage ?? false);
    } catch {
      setError("Failed to load videos. Please refresh.");
    }
  }, [urlQuery, sortIdx]);

  // Initial load / on filter change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setVideos([]);
    fetchVideos(1, true).finally(() => setLoading(false));
  }, [fetchVideos]);

  // Infinite scroll — IntersectionObserver on a sentinel div
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          await fetchVideos(next, false);
          setLoadingMore(false);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchVideos]);

  const handleSortChange = (idx) => {
    setSortIdx(idx);
    setShowSortMenu(false);
  };

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Hero bar ── */}
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-xl border-b border-white/[0.05] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            {urlQuery ? (
              <div>
                <p className="text-xs text-neutral-500 mb-0.5">Search results for</p>
                <h1 className="text-lg font-semibold text-white">"{urlQuery}"</h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-white">Home Feed</h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                id="sort-btn"
                onClick={() => setShowSortMenu((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-300 hover:text-white hover:border-neutral-700 transition-all"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {activeSortLabel}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1 w-44 rounded-xl border border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl shadow-2xl z-50 py-1.5 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSortChange(i)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors
                          ${i === sortIdx
                            ? "text-red-400 bg-red-950/30"
                            : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upload button */}
            <button
              id="home-upload-btn"
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all shadow-lg shadow-red-900/30"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* ── Error state ── */}
        {error && (
          <div className="flex items-center justify-center py-24 text-center">
            <div>
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={() => fetchVideos(1, true)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Skeleton loading grid ── */}
        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
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
        )}

        {/* ── Video grid ── */}
        {!loading && !error && (
          <>
            {videos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
                  <Play className="h-8 w-8 text-neutral-600" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {urlQuery ? "No videos found" : "No videos yet"}
                </h2>
                <p className="text-neutral-500 text-sm mb-6 max-w-sm">
                  {urlQuery
                    ? `We couldn't find videos matching "${urlQuery}". Try a different search.`
                    : "Be the first to upload a video to this platform."}
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Upload your first video
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {videos.map((video, i) => (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                  >
                    <VideoCard video={video} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} className="flex justify-center py-10">
              {loadingMore && (
                <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
              )}
              {!hasMore && videos.length > 0 && (
                <p className="text-xs text-neutral-700">You've reached the end</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={(v) => {
          setVideos((p) => [v, ...p]);
          setShowUpload(false);
        }} />}
      </AnimatePresence>
    </div>
  );
}
