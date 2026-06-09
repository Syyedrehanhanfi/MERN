import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Bell, BellOff, Search } from "lucide-react";
import { subscriptionService } from "@/services";
import { useAuth } from "@/context/AuthContext";

// ── Subscriber Card ───────────────────────────────────────────────────────────
function SubscriberCard({ sub, index }) {
  const user = sub.subscriber ?? sub; // normalize populated vs flat
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/channel/${user.username}`}
        id={`subscriber-${user._id}`}
        className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.04] bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-white/[0.08] transition-all group"
      >
        {/* Avatar */}
        <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-700 shrink-0 ring-2 ring-transparent group-hover:ring-red-600/50 transition-all">
          {user.avatar
            ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-red-600 to-purple-700">{user.fullName?.[0] ?? "?"}</div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
            {user.fullName}
          </p>
          <p className="text-xs text-neutral-500">@{user.username}</p>
        </div>

        {/* Visit arrow */}
        <div className="shrink-0 text-neutral-600 group-hover:text-red-500 transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 10h6M10 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Subscription Card (channels the user follows) ─────────────────────────────
function SubscriptionCard({ sub, index, onUnsubscribe }) {
  const channel = sub.channel ?? sub;
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscriptionService.toggleSubscription(channel._id);
      onUnsubscribe(sub._id ?? channel._id);
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.04] bg-neutral-900/40 hover:bg-neutral-900/60 transition-all group">
        <Link to={`/channel/${channel.username}`} className="flex items-center gap-4 flex-1 min-w-0 group/ch">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-700 shrink-0 ring-2 ring-transparent group-hover/ch:ring-red-600/50 transition-all">
            {channel.avatar
              ? <img src={channel.avatar} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-red-600 to-purple-700">{channel.fullName?.[0] ?? "?"}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white group-hover/ch:text-red-400 transition-colors truncate">{channel.fullName}</p>
            <p className="text-xs text-neutral-500">@{channel.username}</p>
          </div>
        </Link>

        <button
          id={`unsubscribe-${channel._id}`}
          onClick={handleToggle}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-red-950/50 border border-neutral-700 hover:border-red-800/50 text-neutral-400 hover:text-red-400 text-xs font-medium transition-all disabled:opacity-60"
        >
          {loading
            ? <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            : <BellOff className="h-3.5 w-3.5" />
          }
          Unsubscribe
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Subscribers Page ─────────────────────────────────────────────────────
export default function Subscribers() {
  const { user } = useAuth();
  const [tab, setTab] = useState("subscribers"); // "subscribers" | "subscriptions"
  const [subscribers, setSubscribers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    const fetchers = {
      subscribers: () =>
        subscriptionService.getChannelSubscribers(user._id)
          .then((r) => setSubscribers(r.data?.data ?? [])),
      subscriptions: () =>
        subscriptionService.getSubscribedChannels(user._id)
          .then((r) => setSubscriptions(r.data?.data ?? [])),
    };
    fetchers[tab]?.().finally(() => setLoading(false));
  }, [user?._id, tab]);

  const handleUnsubscribe = (id) => {
    setSubscriptions((p) => p.filter((s) => (s._id ?? s.channel?._id) !== id));
  };

  const filterList = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((s) => {
      const person = s.subscriber ?? s.channel ?? s;
      return (
        person.fullName?.toLowerCase().includes(q) ||
        person.username?.toLowerCase().includes(q)
      );
    });
  };

  const activeList = tab === "subscribers" ? subscribers : subscriptions;
  const filtered = filterList(activeList);

  const TABS = [
    { id: "subscribers", label: "Subscribers", count: subscribers.length },
    { id: "subscriptions", label: "Subscriptions", count: subscriptions.length },
  ];

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-red-500" />
            Subscribers & Subscriptions
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your channel connections</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 border border-white/[0.06] mb-6">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === id ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${tab === id ? "bg-red-600 text-white" : "bg-neutral-700 text-neutral-400"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
          <input
            id="subscriber-search"
            type="search"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/40">
                <div className="h-12 w-12 rounded-full bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-800 rounded w-1/3" />
                  <div className="h-3 bg-neutral-800 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-neutral-900 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-neutral-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              {search ? "No results found" : `No ${tab} yet`}
            </h2>
            <p className="text-neutral-500 text-sm">
              {search ? `No ${tab} matching "${search}"` : tab === "subscribers" ? "People who subscribe will appear here." : "Channels you subscribe to will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {tab === "subscribers"
              ? filtered.map((s, i) => <SubscriberCard key={s._id ?? i} sub={s} index={i} />)
              : filtered.map((s, i) => (
                  <SubscriptionCard key={s._id ?? i} sub={s} index={i} onUnsubscribe={handleUnsubscribe} />
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
