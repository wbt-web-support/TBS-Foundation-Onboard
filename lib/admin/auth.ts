export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "client";
  submissionId: string | null;
};

/** Fetch options for authenticated admin API calls (HttpOnly cookie). */
export function adminFetchInit(init: RequestInit = {}): RequestInit {
  return { ...init, credentials: "include" };
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.authenticated || !data.user) return null;
  return data.user as AuthUser;
}

export async function loginAdmin(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Login failed");
  return data.user as AuthUser;
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
