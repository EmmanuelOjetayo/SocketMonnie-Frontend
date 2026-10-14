import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as authService from "@/services/auth";
import { getCurrentUser } from "@/services/user";
import { ROLES, ROLE_HOME } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore logged-in user on page refresh (httpOnly cookie is sent automatically)
  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        // Normalize response: accepted shapes are
        // { success, data: { user } }, { success, user }, { data: { user } }, { user }, { success: false }
        let fetchedUser = null;
        if (res && typeof res === "object") {
          if (res?.data && res?.data?.user) fetchedUser = res.data.user;
          else if (res?.user) fetchedUser = res.user;
          else if (res?.data?.fetchedUser) fetchedUser = res.data.fetchedUser;
          else if (res?.fetchedUser) fetchedUser = res.fetchedUser;
          else if (res?.user) fetchedUser = res.user;
        }
        // Also accept the raw user object if it has identifying properties
        if (fetchedUser && (fetchedUser._id || fetchedUser.id || fetchedUser.email || fetchedUser.email)) {
          setUser(fetchedUser);
        } else if (res && (res._id || res.id || res.email)) {
          setUser(res);
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

  // Used by both Login and Verify OTP — no token storage, cookie is set by backend
  const authenticate = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Login
  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      authenticate(res.data.user);
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
