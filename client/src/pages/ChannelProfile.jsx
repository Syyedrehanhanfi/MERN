import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Users, Play, ThumbsUp, Eye,
  Calendar, MessageSquare, Grid3X3, ListVideo,
} from "lucide-react";
import { userService, videoService, tweetService, subscriptionService, playlistService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import VideoCard from "@/components/video/VideoCard";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
  if (days < 1) return "Today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: "videos", label: "Videos", icon: Grid3X3 },
  { id: "playlists", label: "Playlists", icon: ListVideo },
  { id: "community", label: "Community", icon: MessageSquare },
];

// ── Playlist Card ─────────────────────────────────────────────────────────────
function PlaylistCard({ playlist }) {
  const thumbs = playlist.videos?.slice(0, 1) ?? [];
  return (
    <Link to={`/playlist/${playlist._id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
        {thumbs[0]?.thumbnail ? (
          <img src={thumbs[0].thumbnail} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ListVideo className="h-8 w-8 text-neutral-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-end p-3">
          <span className="text-white text-xs font-semibold bg-black/60 rounded-md px-2 py-0.5">
            {playlist.videos?.length ?? 0} videos
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">{playlist.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{playlist.description}</p>
      </div>
    </Link>
  );
}

// ── Tweet Card ────────────────────────────────────────────────────────────────
function TweetCard({ tweet, owner }) {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/[0.06] p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
          {owner?.avatar
            ? <img src={owner.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">{owner?.fullName?.[0]}</div>
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">{owner?.fullName}</span>
            <span className="text-xs text-neutral-500">{timeAgo(tweet.createdAt)}</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <ThumbsUp className="h-3.5 w-3.5" />
              {tweet.likesCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Channel Page ─────────────────────────────────────────────────────────
export default function ChannelProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  const isOwner = currentUser?.username === username;

  // Fetch channel profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await userService.getChannelProfile(username);
        const data = res.data?.data;
        setChannel(data);
        setSubscribed(data?.isSubscribed ?? false);
        setSubCount(data?.subscriberCount ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  // Fetch tab content
  useEffect(() => {
    if (!channel?._id) return;
    setTabLoading(true);

    const loaders = {
      videos: async () => {
        const res = await videoService.getAllVideos({ userId: channel._id, limit: 12, sortBy: "createdAt", sortType: "desc" });
        setVideos(res.data?.data?.docs ?? []);
      },
      playlists: async () => {
        const res = await playlistService.getUserPlaylists(channel._id);
        setPlaylists(res.data?.data ?? []);
      },
      community: async () => {
        const res = await tweetService.getUserTweets(channel._id);
        setTweets(res.data?.data ?? []);
      },
    };

    loaders[activeTab]?.().finally(() => setTabLoading(false));
  }, [channel?._id, activeTab]);

  const handleSubscribe = async () => {
    if (!channel?._id) return;
    setSubscribed((p) => !p);
    setSubCount((p) => subscribed ? p - 1 : p + 1);
    try { await subscriptionService.toggleSubscription(channel._id); }
    catch { setSubscribed((p) => !p); setSubCount((p) => subscribed ? p + 1 : p - 1); }
  };

  if (loading) return (
    <div className="animate-pulse">
      <div className="w-full h-52 bg-neutral-800" />
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-5 -mt-12 mb-6">
          <div className="h-24 w-24 rounded-full bg-neutral-700 ring-4 ring-neutral-950" />
          <div className="mt-14 space-y-2 flex-1">
            <div className="h-6 bg-neutral-800 rounded w-1/3" />
            <div className="h-4 bg-neutral-800 rounded w-1/5" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!channel) return (
    <div className="flex h-full items-center justify-center py-32 text-center">
      <div>
        <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Channel not found</h2>
        <p className="text-neutral-500 text-sm">@{username} doesn't exist on PlayTube.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Cover Image ── */}
      <div className="relative w-full h-44 lg:h-60 bg-neutral-900 overflow-hidden">
        {channel.coverImage ? (
          <img src={channel.coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-red-950/30 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        {/* ── Channel header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10 mb-8">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-neutral-950 bg-neutral-800 shrink-0 shadow-2xl">
            {channel.avatar
              ? <img src={channel.avatar} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-red-600 to-purple-700">{channel.fullName?.[0]}</div>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 sm:pb-1">
            <h1 className="text-2xl font-bold text-white">{channel.fullName}</h1>
            <p className="text-neutral-400 text-sm">@{channel.username}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {fmtNum(subCount)} subscribers
              </span>
              <span className="flex items-center gap-1.5">
                <Play className="h-4 w-4" />
                {fmtNum(channel.channelsSubscribedToCount ?? 0)} subscriptions
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Joined {new Date(channel.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Subscribe / Edit */}
          <div className="shrink-0">
            {isOwner ? (
              <Link to="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-sm font-medium transition-all">
                Edit Channel
              </Link>
            ) : (
              <button id="channel-subscribe-btn" onClick={handleSubscribe}
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
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-white/[0.06] mb-8">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === id ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {activeTab === id && (
                  <motion.div
                    layoutId="channel-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tabLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}><div className="aspect-video rounded-xl bg-neutral-800 mb-3" /><div className="h-4 bg-neutral-800 rounded w-3/4" /></div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === "videos" && (
                videos.length === 0
                  ? <div className="flex flex-col items-center py-24 text-center"><Play className="h-12 w-12 text-neutral-700 mb-4" /><p className="text-neutral-500">No videos uploaded yet</p></div>
                  : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{videos.map((v) => <VideoCard key={v._id} video={v} />)}</div>
              )}
              {activeTab === "playlists" && (
                playlists.length === 0
                  ? <div className="flex flex-col items-center py-24 text-center"><ListVideo className="h-12 w-12 text-neutral-700 mb-4" /><p className="text-neutral-500">No playlists created yet</p></div>
                  : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{playlists.map((p) => <PlaylistCard key={p._id} playlist={p} />)}</div>
              )}
              {activeTab === "community" && (
                tweets.length === 0
                  ? <div className="flex flex-col items-center py-24 text-center"><MessageSquare className="h-12 w-12 text-neutral-700 mb-4" /><p className="text-neutral-500">No community posts yet</p></div>
                  : <div className="max-w-2xl space-y-4">{tweets.map((t) => <TweetCard key={t._id} tweet={t} owner={channel} />)}</div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}