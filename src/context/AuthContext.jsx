/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
// export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 🔥 NEW
  const navigate = useNavigate();

  const applyTenantTheme = (userData) => {
    const primary = userData?.primary_color || "#101011";
    const secondary = userData?.secondary_color || "#ffffff";

    document.documentElement.style.setProperty("--tenant-primary", primary);
    document.documentElement.style.setProperty("--tenant-secondary", secondary);
  };

  // 🔄 Check if user is already logged in (via cookie)
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggingOut) return;

      try {
        const res = await api.get("/auth/me");
        const userData = res.data.data;

        setUser(userData);
        applyTenantTheme(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoggingOut]); // 🔥 dependency added

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const userData = res.data.data;

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      applyTenantTheme(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 🚪 LOGOUT (FIXED)
  const logout = async () => {
    try {
      setIsLoggingOut(true); // 🔥 prevent /me call

      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");

      // Reset theme
      document.documentElement.style.removeProperty("--tenant-primary");
      document.documentElement.style.removeProperty("--tenant-secondary");

      // ✅ Use navigate instead of reload
      navigate("/login", { replace: true });
    }
  };

  // ⏳ Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">
            Authenticating securely...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
