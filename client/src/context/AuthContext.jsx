import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import api from "@/utils/api";

// ─────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────
const initialState = {
  user: null,           // full user object from /users/current-user
  isAuthenticated: false,
  isLoading: true,      // true on first mount while we verify session
};

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────
const AUTH_ACTIONS = {
  SET_USER: "SET_USER",
  LOGOUT: "LOGOUT",
  SET_LOADING: "SET_LOADING",
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Verify session on app mount ──────────────
  // POST /users/current-user — verifyJWT middleware checks the cookie
  const verifySession = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await api.post("/users/current-user");
      const userData = response.data?.data;
      if (userData) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch {
      // 401 means no valid session
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // ── Listen for forced logout from Axios interceptor ──
  useEffect(() => {
    const handleForcedLogout = () => dispatch({ type: AUTH_ACTIONS.LOGOUT });
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  // ─────────────────────────────────────────────
  // Auth Actions exposed to consumers
  // ─────────────────────────────────────────────

  // POST /users/login  — payload: { email, username, password }
  const login = useCallback(async (credentials) => {
    const response = await api.post("/users/login", credentials);
    const { user, accessToken } = response.data.data;
    localStorage.setItem("accessToken", accessToken);
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    return user;
  }, []);

  // GET /users/logout
  const logout = useCallback(async () => {
    try {
      await api.get("/users/logout");
    } finally {
      localStorage.removeItem("accessToken");
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Update local user state after profile edits without refetching
  const updateUser = useCallback((updatedFields) => {
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: { ...state.user, ...updatedFields },
    });
  }, [state.user]);

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    verifySession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
// Custom hook — throws if used outside provider
// ─────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
