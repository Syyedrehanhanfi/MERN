import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListVideo, Plus, X, Pencil, Trash2, Lock, Globe,
  Play, Loader2, AlertCircle, Check,
} from "lucide-react";
import { playlistService } from "@/services";
import { useAuth } from "@/context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function PlaylistModal({ playlist, onClose, onSave }) {
  const [name, setName] = useState(playlist?.name ?? "");
  const [description, setDescription] = useState(playlist?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!playlist;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Playlist name is required.");
    setSaving(true);
    try {
      if (isEdit) {
        const res = await playlistService.updatePlaylist(playlist._id, {
          name: name.trim(),
          description: description.trim(),
        });
        onSave(res.data?.data);
      } else {
        const res = await playlistService.createPlaylist({
          name: name.trim(),
          description: description.trim(),
        });
        onSave(res.data?.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save playlist.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-neutral-950 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">
            {isEdit ? "Edit Playlist" : "New Playlist"}
          </h2>
          <button onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-900/50 text-red-400 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Name <span className="text-red-500">*</span></label>
            <input
              id="playlist-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="My awesome playlist"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Description</label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this playlist about?"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-all disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} id="save-playlist-btn"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />{isEdit ? "Save Changes" : "Create"}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Playlist Card ─────────────────────────────────────────────────────────────
function PlaylistCard({ playlist, index, onEdit, onDelete }) {
  const thumbVideo = playlist.videos?.[0];
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm(`Delete "${playlist.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await playlistService.deletePlaylist(playlist._id);
      onDelete(playlist._id);
    } finally { setDeleting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col gap-3"
    >
      <Link to={`/playlist/${playlist._id}`} id={`playlist-${playlist._id}`} className="block relative">
        {/* Stacked thumbnail effect */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
          {thumbVideo?.thumbnail ? (
            <img src={thumbVideo.thumbnail} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
              <ListVideo className="h-10 w-10 text-neutral-600" />
            </div>
          )}
          {/* Count badge */}
          <div className="absolute inset-0 bg-black/40 flex items-end justify-end p-3">
            <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
              <Play className="h-3 w-3 fill-white" />
              {playlist.videos?.length ?? 0} videos
            </span>
          </div>
        </div>
      </Link>

      {/* Info + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{playlist.description}</p>
          )}
        </div>

        {/* Owner actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`edit-playlist-${playlist._id}`}
            onClick={(e) => { e.preventDefault(); onEdit(playlist); }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            id={`delete-playlist-${playlist._id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
            title="Delete"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Playlists Page ───────────────────────────────────────────────────────
export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", playlist }

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        // GET /playlist/user/:userId
        const res = await playlistService.getUserPlaylists(user._id);
        setPlaylists(res.data?.data ?? []);
      } catch {
        setError("Failed to load playlists.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id]);

  const handleSave = useCallback((saved) => {
    setPlaylists((prev) => {
      const exists = prev.find((p) => p._id === saved._id);
      return exists
        ? prev.map((p) => p._id === saved._id ? saved : p)
        : [saved, ...prev];
    });
  }, []);

  const handleDelete = useCallback((id) => {
    setPlaylists((prev) => prev.filter((p) => p._id !== id));
  }, []);

  return (
    <div className="min-h-full bg-neutral-950 pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ListVideo className="h-5 w-5 text-red-500" />
              Your Playlists
            </h1>
            {!loading && <p className="text-sm text-neutral-500 mt-0.5">{playlists.length} playlist{playlists.length !== 1 ? "s" : ""}</p>}
          </div>
          <button
            id="create-playlist-btn"
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
          >
            <Plus className="h-4 w-4" /> New Playlist
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-8">
        {error && <p className="text-red-400 text-center py-12">{error}</p>}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-video rounded-xl bg-neutral-800 mb-3" />
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && playlists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-neutral-900 flex items-center justify-center mb-5">
              <ListVideo className="h-8 w-8 text-neutral-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No playlists yet</h2>
            <p className="text-neutral-500 text-sm max-w-xs mb-6">Create playlists to organize your favourite videos.</p>
            <button
              onClick={() => setModal({ mode: "create" })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all"
            >
              <Plus className="h-4 w-4" /> Create your first playlist
            </button>
          </motion.div>
        )}

        {!loading && !error && playlists.length > 0 && (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {playlists.map((p, i) => (
                <PlaylistCard
                  key={p._id}
                  playlist={p}
                  index={i}
                  onEdit={(pl) => setModal({ mode: "edit", playlist: pl })}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <PlaylistModal
            key="playlist-modal"
            playlist={modal.mode === "edit" ? modal.playlist : null}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
