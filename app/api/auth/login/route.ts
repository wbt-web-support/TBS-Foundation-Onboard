import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/users";
import { createSessionCookie, sessionCookieOptions } from "@/lib/auth/session";
import { getServiceClient } from "@/lib/supabase/server";
import type { SessionPayload } from "@/lib/auth/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const appUser = await findUserByEmail(email);
    if (!appUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const payload: SessionPayload = {
      sub: authData.user.id,
      email: authData.user.email!,
      role: appUser.role,
      submissionId: appUser.submission_id ?? undefined,
    };

    const token = await createSessionCookie(payload);
    const res = NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: appUser.role,
        submissionId: appUser.submission_id,
      },
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    if (msg.includes("JWT_SECRET")) {
      return NextResponse.json({ error: "Server auth is not configured" }, { status: 503 });
    }
    if (msg.includes("Supabase")) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
