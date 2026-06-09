import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/routing/RouteGuards";
import MainLayout from "@/layouts/MainLayout";

// ── Placeholder pages (replaced in Phase 3) ──────────────────────────────────
const ComingSoon = ({ page }) => (
  <div className="flex h-full min-h-[calc(100vh-4rem)] w-full items-center justify-center">
    <div className="text-center">
      <div className="text-5xl mb-4">🎬</div>
      <h1 className="text-2xl font-bold text-white mb-2">{page}</h1>
      <p className="text-neutral-400 text-sm">Coming in Phase 3</p>
    </div>
  </div>
);

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Home from "@/pages/Home";
import VideoPlayer from "@/pages/VideoPlayer";
import ChannelProfile from "@/pages/ChannelProfile";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import History from "@/pages/History";
import LikedVideos from "@/pages/LikedVideos";
import Playlists from "@/pages/Playlists";
import Community from "@/pages/Community";
import Subscribers from "@/pages/Subscribers";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ── */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* ── Protected routes — all render inside MainLayout ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/watch/:videoId" element={<VideoPlayer />} />
              <Route path="/channel/:username" element={<ChannelProfile />} />
              <Route path="/upload" element={<ComingSoon page="Upload Video" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/liked" element={<LikedVideos />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/community" element={<Community />} />
              <Route path="/subscribers" element={<Subscribers />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
