import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Compass, ThumbsUp, History, ListVideo,
  Users, BarChart2, MessageSquare, Settings, LogOut, Play,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────
// Nav item definitions — map to backend routes
// ─────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: null, // no section header
    items: [
      { icon: Home,          label: "Home",          to: "/",               id: "nav-home" },
      { icon: Compass,       label: "Explore",       to: "/?sortBy=views",  id: "nav-explore" },
      { icon: ThumbsUp,      label: "Liked Videos",  to: "/liked",          id: "nav-liked" },
      { icon: History,       label: "Watch History", to: "/history",        id: "nav-history" },
      { icon: ListVideo,     label: "Playlists",     to: "/playlists",      id: "nav-playlists" },
    ],
  },
  {
    label: "Creator",
    items: [
      { icon: BarChart2,     label: "Dashboard",     to: "/dashboard",      id: "nav-dashboard" },
      { icon: Users,         label: "Subscribers",   to: "/subscribers",    id: "nav-subscribers" },
      { icon: MessageSquare, label: "Community",     to: "/community",      id: "nav-community" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: Settings,      label: "Settings",      to: "/settings",       id: "nav-settings" },
    ],
  },
];

// Sidebar width constants (matches CSS transition)
const EXPANDED_W = 240;
const COLLAPSED_W = 68;

export default function Sidebar({ isExpanded, sidebarOpen, onMouseEnter, onMouseLeave }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <motion.aside
      animate={{ width: isExpanded ? EXPANDED_W : COLLAPSED_W }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative z-20 flex flex-col h-full shrink-0 overflow-hidden
                 border-r border-white/[0.06] bg-neutral-950"
      aria-label="Sidebar navigation"
    >
      {/* ── Top spacer for Navbar ── */}
      <div className="h-16 shrink-0" />

      {/* ── Scrollable nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {/* Section label */}
            <AnimatePresence>
              {isExpanded && section.label && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: 0.05 }}
                  className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 whitespace-nowrap"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            <ul className="space-y-0.5">
              {section.items.map(({ icon: Icon, label, to, id }) => (
                <li key={id}>
                  <NavLink
                    id={id}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium
                       transition-all duration-150 group relative
                       ${isActive
                         ? "bg-red-600/15 text-red-400"
                         : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                       }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-5 w-5 shrink-0 transition-colors
                            ${isActive ? "text-red-500" : "text-neutral-500 group-hover:text-white"}`}
                        />

                        {/* Label — animates in/out with sidebar */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.15, delay: 0.04 }}
                              className="whitespace-nowrap overflow-hidden"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Tooltip when collapsed */}
                        {!isExpanded && (
                          <span className="absolute left-full ml-3 px-2 py-1 rounded-lg bg-neutral-800
                                           text-xs text-white whitespace-nowrap opacity-0
                                           group-hover:opacity-100 pointer-events-none z-50
                                           shadow-lg transition-opacity duration-150">
                            {label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User profile strip at bottom ── */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.05] transition-colors cursor-default">
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                {user?.fullName?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>

          {/* Name + username — only when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user?.fullName}
                </p>
                <p className="text-xs text-neutral-500 truncate">@{user?.username}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout button — only when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                id="sidebar-logout-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                aria-label="Logout"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-all shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
