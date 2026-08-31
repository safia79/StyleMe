// FR-02: User Login & Session
// FR-08: Premium Subscription — refreshUser() so premium unlocks without logging in again
// FR-10: Profile & Preferences — refreshUser() after saving name/city
// Holds the current user so Navbar, protected pages, and forms stay in sync.
// AuthContext is shared "who is logged in?" data. Pages call useAuth() instead
// of each fetching /api/auth/me on their own.

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api.js";

// The empty box that will later hold { user, login, logout, ... }.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: the logged-in person, or null if nobody is signed in.
  const [user, setUser] = useState(null);
  // loading: true until the first /api/auth/me check finishes (avoids a flash).
  const [loading, setLoading] = useState(true);

  // Ask the backend "is there a valid session cookie?" and store the answer.
  async function refreshUser() {
    const { data } = await apiRequest("/api/auth/me");
    setUser(data.user || null);
  }

  // Run once on startup ([] = no extra triggers). Always clear loading after.
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  // Create an account. If it works, the new user is stored so they are logged in.
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

  // Sign in with email/password. On success, remember that user in state.
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

  // End the session on the server, then forget the user in this browser.
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

// Shortcut for any component that needs the current user or login helpers.
export function useAuth() {
  const value = useContext(AuthContext);
  // Safety net: this hook only works inside <AuthProvider> (see main.jsx).
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
