import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = checking

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Skip /me check while OAuth callback is being processed
    if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
      setUser(null);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("petzzy_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (data.token) localStorage.setItem("petzzy_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const exchangeGoogleSession = async (session_id) => {
    const { data } = await api.post("/auth/google/session", { session_id });
    if (data.token) localStorage.setItem("petzzy_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("petzzy_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, checkAuth, exchangeGoogleSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
