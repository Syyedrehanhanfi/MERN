import axios from "axios";

// Create a configured Axios instance
const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // Send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor for global error handling & Token Refresh
api.interceptors.response.use(
  (response) => {
    // Pass successful responses through seamlessly
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to avoid infinite loops

      try {
        // Attempt to refresh the access token via our cookie-based refresh token
        await api.post("/users/refresh-token");

        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g. refresh token expired), redirect to login
        // window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
