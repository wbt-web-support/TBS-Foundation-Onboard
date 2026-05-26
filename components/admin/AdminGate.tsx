"use client";

import { useEffect, useState } from "react";
import {
  adminFetchInit,
  fetchCurrentUser,
  loginAdmin,
  logoutAdmin,
  type AuthUser,
} from "@/lib/admin/auth";

function AuthLoadingShell() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
    </div>
  );
}

function AdminLogin({ onAuth }: { onAuth: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginAdmin(email.trim(), password);
      if (user.role !== "admin") {
        setError("This account does not have admin access.");
        await logoutAdmin();
        return;
      }
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-800">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in with your admin email and password.</p>
        <label className="mt-5 block text-xs font-medium text-slate-500">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <label className="mt-4 block text-xs font-medium text-slate-500">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function AdminGate({ children }: { children: (user: AuthUser) => React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => {
        if (u?.role === "admin") setUser(u);
      })
      .finally(() => setAuthReady(true));
  }, []);

  if (!authReady) return <AuthLoadingShell />;
  if (!user) return <AdminLogin onAuth={setUser} />;
  return <>{children(user)}</>;
}

/** Authenticated fetch init (HttpOnly session cookie). */
export function adminFetchHeaders(_key?: string): RequestInit {
  return adminFetchInit();
}
