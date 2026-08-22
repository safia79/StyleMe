// FR-02: User Login & Session
// Holds the current user so Navbar, protected pages, and forms stay in sync.

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const { data } = await apiRequest("/api/auth/me");
    setUser(data.user || null);
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function register(formValues) {
    const result = await apiRequest("/api/auth/register", {
      method: "POST",
      body: formValues,
    });

    if (result.ok) {
      setUser(result.data.user);
    }

    return result;
  }

  async function login(formValues) {
    const result = await apiRequest("/api/auth/login", {
      method: "POST",
      body: formValues,
    });

    if (result.ok) {
      setUser(result.data.user);
    }

    return result;
  }

  async function logout() {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
