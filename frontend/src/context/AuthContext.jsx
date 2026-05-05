import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, setTokens, clearTokens } from "@/services/api";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("unimeet_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/login", { email, password });
    if (res.success) {
      const userData = { ...res.data.user };
      setUser(userData);
      localStorage.setItem("unimeet_user", JSON.stringify(userData));
      // Store JWT tokens in localStorage
      setTokens(res.data.accessToken, res.data.refreshToken);
      return { success: true, role: res.data.user.role };
    }
    return { success: false, message: res.message || "Invalid credentials" };
  };

  const register = async (data) => {
    const res = await apiClient.post("/auth/register", data);
    if (res.success) {
      return { success: true };
    }
    return { success: false, message: res.message || "Registration failed" };
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("unimeet_refresh_token");
      await apiClient.post("/auth/logout", { refreshToken });
    } catch {}
    setUser(null);
    localStorage.removeItem("unimeet_user");
    clearTokens();
  };

  const updateUser = (data) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem("unimeet_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};