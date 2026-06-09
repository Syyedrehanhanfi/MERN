import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────
// Full-page spinner shown while session is being verified
// ─────────────────────────────────────────────
function AuthLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-red-500" />
        <p className="text-sm text-neutral-400 animate-pulse">Loading PlayTube...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProtectedRoute — requires authentication
// Redirects to /login, preserving the intended destination
// ─────────────────────────────────────────────
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ─────────────────────────────────────────────
// PublicRoute — accessible only when NOT authenticated
// Redirects authenticated users to home (or their intended destination)
// ─────────────────────────────────────────────
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (isLoading) return <AuthLoader />;

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
