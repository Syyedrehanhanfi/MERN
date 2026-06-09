import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, ImagePlus, Camera,
  CheckCircle2, AlertCircle, Loader2, Shield, Bell, Trash2,
} from "lucide-react";
import { userService } from "@/services";
import { useAuth } from "@/context/AuthContext";

// ── Reusable Section Card ─────────────────────────────────────────────────────
function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 overflow-hidden">
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
        ${type === "success" ? "bg-green-900/90 border border-green-700/50 text-green-300" : "bg-red-900/90 border border-red-700/50 text-red-300"}`}
    >
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {message}
    </motion.div>
  );
}

// ── Avatar Upload Row ─────────────────────────────────────────────────────────
function AvatarSection({ user, onSuccess }) {
  const [saving, setSaving] = useState(false);

  const handleFile = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append(field, file);
      const res = field === "avatar"
        ? await userService.updateAvatar(fd)
        : await userService.updateCoverImage(fd);
      onSuccess(res.data?.data?.avatar || res.data?.data?.coverImage, field, res.data?.data);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden h-36 bg-neutral-800 group cursor-pointer"
        onClick={() => !saving && document.getElementById("cover-upload")?.click()}>
        {user?.coverImage
          ? <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-neutral-800 via-red-950/30 to-neutral-900" />
        }
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
          <Camera className="h-5 w-5" /> Change cover image
        </div>
        <input id="cover-upload" type="file" accept="image/*" className="hidden"
          onChange={(e) => handleFile(e, "coverImage")} />
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group cursor-pointer"
          onClick={() => !saving && document.getElementById("avatar-upload")?.click()}>
          <div className="h-20 w-20 rounded-full overflow-hidden ring-2 ring-white/10">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full bg-gradient-to-br from-red-600 to-purple-700 flex items-center justify-center text-2xl text-white font-bold">{user?.fullName?.[0]}</div>
            }
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {saving ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
          </div>
          <input id="avatar-upload" type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e, "avatar")} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{user?.fullName}</p>
          <p className="text-xs text-neutral-500">@{user?.username}</p>
          <p className="text-xs text-neutral-600 mt-1">Click to update avatar or cover image</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useAuth();

  const [accountForm, setAccountForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
  });
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // PATCH /users/update-account
  const handleAccountSave = async (e) => {
    e.preventDefault();
    if (!accountForm.fullName.trim() || !accountForm.email.trim()) {
      return showToast("Name and email are required.", "error");
    }
    setSavingAccount(true);
    try {
      const res = await userService.updateAccount({
        fullName: accountForm.fullName.trim(),
        email: accountForm.email.trim(),
      });
      updateUser(res.data?.data);
      showToast("Account details updated successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update account.", "error");
    } finally { setSavingAccount(false); }
  };

  // POST /users/change-password
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passForm.oldPassword || !passForm.newPassword) {
      return showToast("All password fields are required.", "error");
    }
    if (passForm.newPassword !== passForm.confirm) {
      return showToast("New passwords don't match.", "error");
    }
    if (passForm.newPassword.length < 8) {
      return showToast("New password must be at least 8 characters.", "error");
    }
    setSavingPass(true);
    try {
      await userService.changePassword({
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });
      setPassForm({ oldPassword: "", newPassword: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password.", "error");
    } finally { setSavingPass(false); }
  };

  const handleAvatarSuccess = (_, __, fullUser) => {
    updateUser(fullUser);
    showToast("Photo updated successfully.");
  };

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        {/* ── Profile Photos ── */}
        <SectionCard title="Profile Photos" description="Update your avatar and channel cover image.">
          <AvatarSection user={user} onSuccess={handleAvatarSuccess} />
        </SectionCard>

        {/* ── Account Details ── */}
        <SectionCard title="Account Details" description="Update your display name and email address.">
          <form onSubmit={handleAccountSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    id="settings-fullname"
                    value={accountForm.fullName}
                    onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    id="settings-email"
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-400">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500 text-sm">@</span>
                <input
                  value={user?.username ?? ""}
                  readOnly
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-neutral-600">Username cannot be changed.</p>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingAccount} id="save-account-btn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-60">
                {savingAccount ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Change Password ── */}
        <SectionCard
          title="Change Password"
          description="Use a strong password with at least 8 characters."
        >
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {[
              { id: "old-password", field: "oldPassword", label: "Current Password" },
              { id: "new-password", field: "newPassword", label: "New Password" },
              { id: "confirm-password", field: "confirm", label: "Confirm New Password" },
            ].map(({ id, field, label }) => (
              <div key={id} className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    id={id}
                    type="password"
                    placeholder="••••••••"
                    value={passForm[field]}
                    onChange={(e) => setPassForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button type="submit" disabled={savingPass} id="save-password-btn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-60">
                {savingPass ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : <><Shield className="h-4 w-4" />Update Password</>}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div className="rounded-2xl border border-red-900/40 bg-red-950/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-900/30">
            <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
            <p className="text-sm text-neutral-500 mt-0.5">Irreversible and destructive actions</p>
          </div>
          <div className="px-6 py-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Delete Account</p>
              <p className="text-xs text-neutral-500 mt-0.5">Permanently delete your account and all its content.</p>
            </div>
            <button id="delete-account-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 text-sm font-medium transition-all">
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
