import { Link } from "react-router-dom";
import { Eye, Clock } from "lucide-react";

// Format view count: 1234567 → "1.2M"
function formatViews(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Format duration in seconds: 3723 → "1:02:03"
function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Format relative time: "3 days ago"
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  if (weeks <  5) return `${weeks}w ago`;
  if (months< 12) return `${months}mo ago`;
  return `${years}y ago`;
}

export default function VideoCard({ video }) {
  const owner = video.owner ?? {};

  return (
    <Link
      to={`/watch/${video._id}`}
      id={`video-card-${video._id}`}
      className="group flex flex-col gap-3 focus:outline-none"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Duration badge */}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-xs font-mono font-medium">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="h-5 w-5 text-white fill-white ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-3">
        {/* Channel avatar */}
        <Link
          to={`/channel/${owner.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-0.5"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-700 ring-2 ring-transparent hover:ring-red-600 transition-all">
            {owner.avatar ? (
              <img src={owner.avatar} alt={owner.username} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-red-600 to-purple-700">
                {owner.fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>
          <Link
            to={`/channel/${owner.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-neutral-400 hover:text-white transition-colors mt-1 block"
          >
            {owner.fullName ?? owner.username}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(video.views)} views
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
