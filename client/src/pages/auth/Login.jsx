import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, AlertCircle, Play, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  // Proper state management for 'username' and 'password'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting Login credentials:", { username, password });

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Backend uses email/username via $or, passing same value to both fields
      await login({
        email: username,
        username: username,
        password: password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">PlayTube</span>
        </div>

        {/* Card Container */}
        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="text-neutral-400 text-sm mt-1">Access your creator dashboard & custom feeds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message display block */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 rounded-lg bg-red-950/50 border border-red-900/40 text-red-400 p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username/Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-1.5">
                <User className="h-4 w-4 text-neutral-500" />
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                placeholder="Enter your username or email"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-neutral-500" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-8 pt-6 border-t border-neutral-800/50 text-center text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-red-500 hover:text-red-400 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
