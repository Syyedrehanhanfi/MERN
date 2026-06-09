import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Mail, Lock, AlertCircle, Play, ImagePlus } from "lucide-react";
import { userService } from "@/services";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, username, password } = formData;
    if (!fullName || !email || !username || !password) {
      setError("All fields are required.");
      return;
    }
    if (!avatar) {
      setError("A profile avatar is required.");
      return;
    }

    setLoading(true);
    try {
      // POST /users/register — multipart/form-data
      // Backend requires: fullName, email, username, password, avatar (file)
      const data = new FormData();
      data.append("fullName", fullName);
      data.append("email", email);
      data.append("username", username.toLowerCase());
      data.append("password", password);
      data.append("avatar", avatar);

      await userService.register(data);

      // Auto-login after successful registration
      await login({ email, username, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 py-8"
      style={{ background: "radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0a 60%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">PlayTube</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-neutral-400 text-sm mt-1">Join the community today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-900/50 text-red-400 p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <label htmlFor="avatar-upload" className="cursor-pointer group">
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-neutral-700 group-hover:border-red-600 overflow-hidden flex items-center justify-center bg-neutral-900 transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-neutral-500 group-hover:text-red-500 transition-colors" />
                  )}
                </div>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <div>
                <p className="text-sm font-medium text-neutral-300">Profile Photo</p>
                <p className="text-xs text-neutral-500">Click to upload avatar <span className="text-red-500">*</span></p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input name="fullName" placeholder="John Doe" value={formData.fullName}
                  onChange={handleChange} disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all disabled:opacity-50" />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">@</span>
                <input name="username" placeholder="johndoe" value={formData.username}
                  onChange={handleChange} disabled={loading}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all disabled:opacity-50" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input name="email" type="email" placeholder="you@example.com" value={formData.email}
                  onChange={handleChange} disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all disabled:opacity-50" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input name="password" type="password" placeholder="Min. 8 characters" value={formData.password}
                  onChange={handleChange} disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all disabled:opacity-50" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</>
              ) : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link to="/login" className="text-red-500 hover:text-red-400 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
