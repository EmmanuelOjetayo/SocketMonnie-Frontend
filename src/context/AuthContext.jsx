import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as authService from "@/services/auth";
import { getCurrentUser } from "@/services/user";
import { normalizeUser } from "@/utils/userProfile";
import { ROLES, ROLE_HOME } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

const AuthContext = createContext(null);

// Without WebSockets, a light poll keeps KYC approval in sync even when the
// member leaves the dashboard open while an admin reviews the submission.
const PROFILE_REFRESH_INTERVAL_MS = 60_000;
const REFRESH_DEDUPE_MS = 5_000;

function extractUser(res) {
  if (!res || typeof res !== "object") return null;
  if (res?.data?.user) return res.data.user;
  if (res?.user) return res.user;
  if (res?.data?.fetchedUser) return res.data.fetchedUser;
  if (res?.fetchedUser) return res.fetchedUser;
  if (res?._id || res?.id || res?.email) return res;
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastRefreshRef = useRef(0);

  // Restore logged-in user on page refresh (httpOnly cookie is sent automatically)
  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        const fetchedUser = extractUser(res);
        if (fetchedUser) {
          setUser(normalizeUser(fetchedUser));
        } else {
          console.error("Invalid user payload", res);
        }
      })
      .catch((err) => {
        console.error("Failed to restore session on refresh:", err);
        if (err?.status === 401 || err?.status === 403) {
          setUser(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Re-fetch /me so admin KYC decisions appear without logout/login.
  const refreshUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      const fetchedUser = extractUser(res);
      if (fetchedUser) {
        setUser(normalizeUser(fetchedUser));
      }
      return fetchedUser || null;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        setUser(null);
      }
      return null;
    }
  }, []);

  const refreshIfStale = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_DEDUPE_MS) return;
    lastRefreshRef.current = now;
    refreshUser();
  }, [refreshUser]);

  const userId = user?._id || user?.id || null;

  useEffect(() => {
    if (!userId) return undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfStale();
    };
    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") refreshIfStale();
    }, PROFILE_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(pollTimer);
    };
  }, [userId, refreshIfStale]);

  // Used by both Login and Verify OTP — no token storage, cookie is set by backend
  const authenticate = useCallback((userData) => {
    setUser(normalizeUser(userData));
  }, []);

  // Login
  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      authenticate(extractUser(res) || res.data?.user);
      return res;
    },
    [authenticate]
  );

  // Logout — cookie is cleared by backend
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      setUser(null);
    }
  }, []);

  // Determine user's home route based on role
  const getHomeRoute = useCallback(() => {
    if (!user) return ROUTES.LOGIN;
    const role = user.role || ROLES.MEMBER;
    return ROLE_HOME[role] || ROUTES.DASHBOARD;
  }, [user]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    authenticate,
    refreshUser,
    getHomeRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
