import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, Film, Image, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { videoService } from "@/services";

// Helper to format file size: 12582912 → "12 MB"
function fmtSize(bytes) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// Drag-and-drop file zone
function DropZone({ accept, label, icon: Icon, file, onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200 p-6 text-center
        ${dragging
          ? "border-red-500 bg-red-950/20"
          : file
            ? "border-green-600/60 bg-green-950/10"
            : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500 hover:bg-neutral-900"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />

      {file ? (
        <>
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm font-medium text-white truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{fmtSize(file.size)}</p>
          </div>
        </>
      ) : (
        <>
          <Icon className="h-8 w-8 text-neutral-500" />
          <div>
            <p className="text-sm font-medium text-neutral-300">{label}</p>
            <p className="text-xs text-neutral-600 mt-0.5">Drag & drop or click to browse</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function UploadModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [progress, setProgress] = useState(0); // 0–100
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [error, setError] = useState("");

  const isUploading = status === "uploading";
  const isSuccess   = status === "success";

  const handleThumbnail = (file) => {
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())   return setError("Title is required.");
    if (!formData.description.trim()) return setError("Description is required.");
    if (!videoFile)  return setError("Please select a video file.");
    if (!thumbnail)  return setError("Please select a thumbnail.");

    setError("");
    setStatus("uploading");
    setProgress(10);

    try {
      // POST /videos — multipart/form-data
      // Fields: title, description, videoFile (File), thumbnail (File)
      const data = new FormData();
      data.append("title",       formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("videoFile",   videoFile);
      data.append("thumbnail",   thumbnail);

      const res = await videoService.publishVideo(data);
      setProgress(100);
      setStatus("success");

      // Bubble new video up to parent (Home feed)
      setTimeout(() => onSuccess(res.data?.data), 1200);
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setProgress(0);
    }
  };

  // Simulated progress tick while uploading
  useState(() => {
    if (status !== "uploading") return;
    const t = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 600);
    return () => clearInterval(t);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isUploading && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-neutral-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-600/20 flex items-center justify-center">
              <Upload className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">Upload Video</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            id="upload-modal-close"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success state */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-white">Upload Successful!</p>
                <p className="text-sm text-neutral-400 mt-1">Your video is now processing.</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto max-h-[75vh]"
            >
              {/* Error alert */}
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

              {/* File zones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    Video File <span className="text-red-500">*</span>
                  </label>
                  <DropZone
                    accept="video/*"
                    label="Select video"
                    icon={Film}
                    file={videoFile}
                    onFile={setVideoFile}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-300 mb-2 block">
                    Thumbnail <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 border-dashed cursor-pointer
                      ${thumbnail ? "border-green-600/60" : "border-neutral-700 hover:border-neutral-500"}
                      transition-colors`}
                    onClick={() => !isUploading && document.getElementById("thumb-input")?.click()}
                  >
                    <input
                      id="thumb-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && handleThumbnail(e.target.files[0])}
                    />
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center gap-2 bg-neutral-900/60 p-4 text-center">
                        <Image className="h-8 w-8 text-neutral-500" />
                        <p className="text-sm text-neutral-300">Select thumbnail</p>
                        <p className="text-xs text-neutral-600">Drag & drop or click</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="video-title"
                  placeholder="Enter video title..."
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  disabled={isUploading}
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all disabled:opacity-50"
                />
                <p className="text-xs text-neutral-600 text-right">{formData.title.length}/100</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="video-description"
                  rows={4}
                  placeholder="Tell viewers about your video..."
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  disabled={isUploading}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all disabled:opacity-50 resize-none"
                />
              </div>

              {/* Progress bar */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading to server...
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-red-600 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-upload-btn"
                  disabled={isUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4" />Publish Video</>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
