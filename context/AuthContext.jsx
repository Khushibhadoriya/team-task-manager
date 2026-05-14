"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── 1. Create the context ──────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── 2. Create the Provider component ──────────────────────────────────────
// This wraps the entire app and holds the user state
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until we check login status
  const router                = useRouter();

  // ── On first load, check if user is already logged in ─────────────────
  // This calls /api/auth/me which reads the cookie
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false); // done checking — show the app
    }
  }

  // ── Login function ─────────────────────────────────────────────────────
  async function login(email, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed.");
    }

    setUser(data.user);
    router.push("/dashboard");
    return data;
  }

  // ── Signup function ────────────────────────────────────────────────────
  async function signup(name, email, password) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed.");
    }

    setUser(data.user);
    router.push("/dashboard");
    return data;
  }

  // ── Logout function ────────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }

  // ── Provide these values to the entire app ─────────────────────────────
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── 3. Custom hook so any component can use auth easily ────────────────────
// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}