# PlayTube - Modern Video Hosting & Sharing Platform

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

PlayTube is a premium, feature-rich full-stack video hosting and sharing platform. Built using the MERN stack (MongoDB, Express, React, Node.js), Tailwind CSS v4, shadcn/ui, and Framer Motion, it offers a seamless, cinematic user experience designed for modern web browsers. It includes high-performance video processing, infinite scroll, real-time analytics, cascading DB deletes, and optimistic UI updates.

---

## 🚀 Live Demo & Preview

* **Live Link**: comming soon..

## ✨ Features

### 🎬 Core Video Features
* **Drag-and-Drop Video Upload**: Easily upload videos and custom thumbnails with live upload progress.
* **Premium Video Player**: Custom controls, play/pause, volume slider, theater mode, speed controls, progress bar scrub, and responsive sizing.
* **Like/Unlike System**: Dynamic like toggles on videos, comments, and replies with optimistic UI updates.
* **Subscribers & Subscriptions**: Subscribe to channels, view your subscriptions feed, search subscribers list, and manage subscription statuses dynamically.

### 📊 Creator Dashboard & Channel Customization
* **Real-time Analytics Dashboard**: Clean visual graphs (relying on charting libraries) showing aggregate channel views, subscribers, video counts, and total watch time.
* **Interactive Publish Control**: Toggle video visibility (public/private) directly from the dashboard table.
* **Full Channel Profile**: Tabbed view displaying published videos, custom playlists, tweets, and subscribers.
* **Dynamic Customization**: Update channel banners, avatars, bios, usernames, and email settings with immediate visual changes.

### 💬 Social & Playlist Features
* **Nest Comment Threads**: Add comments and nested replies. Includes optimistic comment addition and smooth deletion.
* **Community Tweets**: Express thoughts on the Community Feed. Includes a visual compose text-box with a **circular character counter** limit, CRUD operations, and slide-in tweet interactions.
* **Custom Playlists**: Create, update, and delete playlists with public or private visibility. Effortlessly add or remove videos.

### 🛡️ Technical Architecture & Optimizations
* **Automated JWT Token Refresh**: Centralized Axios interceptor that catches expired `accessToken` (401 errors), silently requests a new one from `/users/refresh-token` using HttpOnly refresh cookies, and retries all concurrent queued requests seamlessly without interrupting the user.
* **Optimistic UI Updates**: Instant feedback on likes, subscribes, unlikes, and playlist edits, rolling back state dynamically if the server API fails.
* **MongoDB Aggregation Pipelines**: Multi-stage pipeline aggregates for computing total watch history, channel statistics (likes, views, subscribers), subscriber counts, and subfeed lookup relationships.
* **Cascading DB Cleanup**: Secure Mongo middleware automatically removes nested records (likes, comments, views, playlist entries) when a video or user account is deleted, avoiding database leakage.
* **Infinite Scroll & Lazy Loading**: Optimizes rendering performance and speeds up home feeds using the browser's native `IntersectionObserver`.
* **Micro-Animations**: Staggered layout entries, slide-ins, spring physics, and hover-to-play thumbnail previews using **Framer Motion**.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 18** | UI rendering & state management |
| **Styling** | **Tailwind CSS v4 & shadcn/ui** | Modern utility classes and premium, accessible primitives |
| **Animations** | **Framer Motion** | Cinematic page transitions and staggered feed entries |
| **Router** | **React Router DOM v6** | Client-side routing, protected routes, and layout wrappers |
| **API Client** | **Axios** | HTTP client with response queue and retry interceptors |
| **Backend** | **Node.js & Express** | Highly structured MVC architecture REST API |
| **Database** | **MongoDB (Mongoose)** | Document database with complex aggregation pipelines |
| **Media Host** | **Cloudinary** | Secure media CDN for video, thumbnail, and avatar hosting |
| **Auth** | **JWT & bcrypt** | Access token (header) & Refresh token (HttpOnly cookie) structure |

---

## 📂 Directory Structure

```text
playtube/
├── client/                 # React frontend (Vite)
│   ├── public/             # Static public assets
│   └── src/
│       ├── components/     # UI, video, comment, and playlist components
│       ├── context/        # Global AuthContext provider
│       ├── hooks/          # Custom utility hooks
│       ├── layouts/        # Layout wrappers (Sidebar/Navbar skeleton)
│       ├── pages/          # Home, Watch, Channel, Dashboard, Settings, etc.
│       └── utils/          # api.js client, helper scripts, etc.
├── server/                 # Express backend REST API
│   ├── src/
│   │   ├── controllers/    # API endpoint controllers (User, Video, Like, Comment...)
│   │   ├── db/             # MongoDB connection setup
│   │   ├── middlewares/    # Auth, Multer upload, error handling middlewares
│   │   ├── models/         # Mongoose schemas (User, Video, Like, Comment, Playlist...)
│   │   └── routes/         # Express router setups
│   └── public/temp/        # Temporary folder for local multer uploads
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) (v16+ recommended) installed.
* Ensure you have a running MongoDB instance (Local or Atlas cloud).
* Sign up for a free [Cloudinary](https://cloudinary.com/) account for image & video hosting.

### Step 1: Clone the Repository
```bash
git clone https://github.com/Syyedrehanhanfi/playtube.git
cd playtube
```

### Step 2: Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `server/` directory and configure the environment variables:
   ```env
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/playtube
   CORS_ORIGIN=http://localhost:5173
   ACCESS_TOKEN_SECRET=your_jwt_access_secret_key_here
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key_here
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend should now be running at `http://localhost:8000`.

### Step 3: Frontend Setup
1. Open a new terminal window, and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The application will run locally at `http://localhost:5173`. Vite's configuration proxies all `/api/v1` routes automatically to `http://localhost:8000`.

---

## 📡 Key API Routes

Below is an overview of standard API endpoints exposed by the server. All requests are routed through `/api/v1`.

* **Auth & Users**: `POST /users/register`, `POST /users/login`, `POST /users/logout`, `POST /users/refresh-token`, `GET /users/current-user`, `PATCH /users/update-account`, `PATCH /users/avatar`
* **Videos**: `GET /videos`, `POST /videos` (Upload), `GET /videos/:videoId`, `PATCH /videos/:videoId`, `DELETE /videos/:videoId`
* **Likes**: `POST /likes/toggle/v/:videoId`, `POST /likes/toggle/c/:commentId`, `GET /likes/videos`
* **Comments**: `GET /comments/:videoId`, `POST /comments/:videoId`, `DELETE /comments/c/:commentId`
* **Playlists**: `POST /playlist`, `GET /playlist/user/:userId`, `GET /playlist/:playlistId`, `POST /playlist/add/:videoId/:playlistId`
* **Subscriptions**: `POST /subscriptions/c/:channelId`, `GET /subscriptions/u/:channelId` (Subscribers list)

---

## 🤝 Contributing

Contributions are welcome! If you find any issues, feel free to open a Pull Request or create an Issue.

1. Fork the repository.
2. Create your branch: `git checkout -b feature/NewFeature`
3. Commit your changes: `git commit -m "Add some feature"`
4. Push to the branch: `git push origin feature/NewFeature`
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
