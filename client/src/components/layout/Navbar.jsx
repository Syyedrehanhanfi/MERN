import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Upload, Menu, Play,
  LogOut, User, Settings, LayoutDashboard, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false); // mobile search mode
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-16 flex items-center px-4 gap-4 border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
      {/* ── Left: hamburger + logo ── */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          id="sidebar-toggle"
          aria-label="Toggle sidebar"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center shadow-md shadow-red-900/50 group-hover:scale-105 transition-transform">
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight hidden sm:block">
            Play<span className="text-red-500">Tube</span>
          </span>
        </Link>
      </div>

      {/* ── Center: desktop search bar ── */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500 pointer-events-none" />
          <input
            id="global-search"
            type="search"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-red-600/70 focus:ring-1 focus:ring-red-600/30 transition-all"
          />
        </div>
      </form>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* Mobile search toggle */}
        <button
          onClick={() => setShowSearch((p) => !p)}
          className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all"
          aria-label="Search"
        >
          {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        {/* Upload */}
        <Link
          to="/upload"
          id="upload-btn"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-all"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden lg:inline">Upload</span>
        </Link>

        {/* Notifications */}
        <button
          id="notifications-btn"
          aria-label="Notifications"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-neutral-950" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-btn"
            onClick={() => setShowDropdown((p) => !p)}
            aria-label="User menu"
            className="ml-1 h-8 w-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-red-600 transition-all focus:outline-none"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white text-sm font-bold">
                {user?.fullName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-60 rounded-xl border border-white/[0.08] bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white font-bold">
                        {user?.fullName?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                    <p className="text-xs text-neutral-400 truncate">@{user?.username}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { icon: User, label: "Your Channel", to: `/channel/${user?.username}`, id: "channel-link" },
                    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", id: "dashboard-link" },
                    { icon: Settings, label: "Settings", to: "/settings", id: "settings-link" },
                  ].map(({ icon: Icon, label, to, id }) => (
                    <Link
                      key={id}
                      id={id}
                      to={to}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-neutral-500" />
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-white/[0.06] py-1.5">
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile search bar — slides down */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 right-0 bg-neutral-950/95 border-b border-white/[0.06] px-4 py-3 md:hidden overflow-hidden z-20"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <input
                autoFocus
                type="search"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-red-600/70 focus:ring-1 focus:ring-red-600/30 transition-all"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
