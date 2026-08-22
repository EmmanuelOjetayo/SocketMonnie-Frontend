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

  // Restore logged-in user on page refresh
  useEffect(() => {
    const token = localStorage.getItem("socketmoni_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((res) => {
        // Correctly handling response structure { success, data: { user } } or { success, user }
        const fetchedUser = res?.data?.user || res?.user || res?.data || res;

        if (fetchedUser && (fetchedUser._id || fetchedUser.id || fetchedUser.email)) {
          setUser(fetchedUser);
        } else {
          console.error("Invalid user payload", res);
          localStorage.removeItem("socketmoni_token");
        }
      })
      .catch((err) => {
        console.error("Failed to restore session on refresh:", err);
        // Only clear if status is 401
        if (err?.status === 401 || err?.status === 403) {
      localStorage.removeItem("socketmoni_token");
      setUser(null);
    }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Used by both Login and Verify OTP
  const authenticate = useCallback((token, userData) => {
    localStorage.setItem("socketmoni_token", token);
    setUser(userData);
  }, []);

  // Login
  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      authenticate(res.data.token, res.data.user);
      return res;
    },
    [authenticate]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem("socketmoni_token");
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
