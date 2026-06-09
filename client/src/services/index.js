// ─────────────────────────────────────────────
// Centralized API service layer
// Each function maps directly to a backend endpoint from playtube_collection.json
// Import `api` (Axios instance) for all calls — never use raw axios here
// ─────────────────────────────────────────────
import api from "@/utils/api";

// ══════════════════════════════════════════════
// AUTH / USERS  — /api/v1/users
// ══════════════════════════════════════════════
export const userService = {
  // POST /users/register — multipart/form-data
  register: (formData) =>
    api.post("/users/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // POST /users/login — { email, username, password }
  login: (credentials) => api.post("/users/login", credentials),

  // GET /users/logout
  logout: () => api.get("/users/logout"),

  // POST /users/refresh-token — { refreshToken } (also via cookie)
  refreshToken: () => api.post("/users/refresh-token"),

  // POST /users/current-user
  getCurrentUser: () => api.post("/users/current-user"),

  // POST /users/change-password — { oldPassword, newPassword }
  changePassword: (data) => api.post("/users/change-password", data),

  // PATCH /users/update-account — { fullName, email }
  updateAccount: (data) => api.patch("/users/update-account", data),

  // PATCH /users/avatar — multipart/form-data { avatar: File }
  updateAvatar: (formData) =>
    api.patch("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // PATCH /users/cover-image — multipart/form-data { coverImage: File }
  updateCoverImage: (formData) =>
    api.patch("/users/cover-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // GET /users/c/:username
  getChannelProfile: (username) => api.get(`/users/c/${username}`),

  // GET /users/watch-history
  getWatchHistory: () => api.get("/users/watch-history"),
};

// ══════════════════════════════════════════════
// VIDEOS  — /api/v1/videos
// ══════════════════════════════════════════════
export const videoService = {
  // GET /videos?page&limit&query&sortBy&sortType&userId
  getAllVideos: (params) => api.get("/videos", { params }),

  // POST /videos — multipart/form-data { title, description, videoFile, thumbnail }
  publishVideo: (formData) =>
    api.post("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // GET /videos/:videoId
  getVideoById: (videoId) => api.get(`/videos/${videoId}`),

  // PATCH /videos/:videoId — multipart/form-data { title?, description?, thumbnail? }
  updateVideo: (videoId, formData) =>
    api.patch(`/videos/${videoId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // DELETE /videos/:videoId
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),

  // PATCH /videos/toggle/publish/:videoId
  togglePublishStatus: (videoId) =>
    api.patch(`/videos/toggle/publish/${videoId}`),
};

// ══════════════════════════════════════════════
// COMMENTS  — /api/v1/comments
// ══════════════════════════════════════════════
export const commentService = {
  // GET /comments/:videoId?page&limit
  getVideoComments: (videoId, params) =>
    api.get(`/comments/${videoId}`, { params }),

  // POST /comments/:videoId — { content }
  addComment: (videoId, data) => api.post(`/comments/${videoId}`, data),

  // PATCH /comments/c/:commentId — { content }
  updateComment: (commentId, data) =>
    api.patch(`/comments/c/${commentId}`, data),

  // DELETE /comments/c/:commentId
  deleteComment: (commentId) => api.delete(`/comments/c/${commentId}`),
};

// ══════════════════════════════════════════════
// TWEETS  — /api/v1/tweets
// ══════════════════════════════════════════════
export const tweetService = {
  // POST /tweets — { content }
  createTweet: (data) => api.post("/tweets", data),

  // GET /tweets/user/:userId
  getUserTweets: (userId) => api.get(`/tweets/user/${userId}`),

  // PATCH /tweets/:tweetId — { content }
  updateTweet: (tweetId, data) => api.patch(`/tweets/${tweetId}`, data),

  // DELETE /tweets/:tweetId
  deleteTweet: (tweetId) => api.delete(`/tweets/${tweetId}`),
};

// ══════════════════════════════════════════════
// LIKES  — /api/v1/likes
// ══════════════════════════════════════════════
export const likeService = {
  // POST /likes/toggle/v/:videoId
  toggleVideoLike: (videoId) => api.post(`/likes/toggle/v/${videoId}`),

  // POST /likes/toggle/c/:commentId
  toggleCommentLike: (commentId) => api.post(`/likes/toggle/c/${commentId}`),

  // POST /likes/toggle/t/:tweetId
  toggleTweetLike: (tweetId) => api.post(`/likes/toggle/t/${tweetId}`),

  // GET /likes/videos
  getLikedVideos: () => api.get("/likes/videos"),
};

// ══════════════════════════════════════════════
// SUBSCRIPTIONS  — /api/v1/subscriptions
// ══════════════════════════════════════════════
export const subscriptionService = {
  // POST /subscriptions/c/:channelId — toggle subscribe/unsubscribe
  toggleSubscription: (channelId) =>
    api.post(`/subscriptions/c/${channelId}`),

  // GET /subscriptions/c/:channelId — get subscriber list
  getChannelSubscribers: (channelId) =>
    api.get(`/subscriptions/c/${channelId}`),

  // GET /subscriptions/u/:subscriberId — get subscribed channels
  getSubscribedChannels: (subscriberId) =>
    api.get(`/subscriptions/u/${subscriberId}`),
};

// ══════════════════════════════════════════════
// PLAYLISTS  — /api/v1/playlist
// ══════════════════════════════════════════════
export const playlistService = {
  // POST /playlist — { name, description }
  createPlaylist: (data) => api.post("/playlist", data),

  // GET /playlist/:playlistId
  getPlaylistById: (playlistId) => api.get(`/playlist/${playlistId}`),

  // GET /playlist/user/:userId
  getUserPlaylists: (userId) => api.get(`/playlist/user/${userId}`),

  // PATCH /playlist/:playlistId — { name?, description? }
  updatePlaylist: (playlistId, data) =>
    api.patch(`/playlist/${playlistId}`, data),

  // DELETE /playlist/:playlistId
  deletePlaylist: (playlistId) => api.delete(`/playlist/${playlistId}`),

  // PATCH /playlist/add/:videoId/:playlistId
  addVideoToPlaylist: (videoId, playlistId) =>
    api.patch(`/playlist/add/${videoId}/${playlistId}`),

  // PATCH /playlist/remove/:videoId/:playlistId
  removeVideoFromPlaylist: (videoId, playlistId) =>
    api.patch(`/playlist/remove/${videoId}/${playlistId}`),
};

// ══════════════════════════════════════════════
// DASHBOARD  — /api/v1/dashboard
// ══════════════════════════════════════════════
export const dashboardService = {
  // GET /dashboard/stats
  getChannelStats: () => api.get("/dashboard/stats"),

  // GET /dashboard/videos?page&limit&sortBy&sortType
  getChannelVideos: (params) => api.get("/dashboard/videos", { params }),
};

// ══════════════════════════════════════════════
// HEALTHCHECK  — /api/v1/healthcheck
// ══════════════════════════════════════════════
export const healthService = {
  check: () => api.get("/healthcheck"),
};
