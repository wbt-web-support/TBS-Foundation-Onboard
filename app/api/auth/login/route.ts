import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth/users";
import { createSessionCookie, sessionCookieOptions } from "@/lib/auth/session";
import { getServiceClient, getAnonClient } from "@/lib/supabase/server";
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
    // Step 1: verify credentials via Supabase Auth.
    const { data: authData, error: authError } = await getAnonClient().auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      // If email is unconfirmed, auto-confirm it using the service role and retry.
      if (authError?.message?.toLowerCase().includes("email not confirmed")) {
        const { error: confirmErr } = await getServiceClient().auth.admin.updateUserById(
          // We need the user id — look it up via admin API.
          await getServiceClient()
            .auth.admin.listUsers()
            .then(({ data }) => data.users.find((u) => u.email?.toLowerCase() === email)?.id ?? ""),
          { email_confirm: true },
        );
        if (!confirmErr) {
          // Retry sign-in after confirming.
          const { data: retryData, error: retryErr } = await getAnonClient().auth.signInWithPassword({ email, password });
          if (!retryErr && retryData.user) {
            return await buildLoginResponse(retryData.user.id, retryData.user.email!, email);
          }
        }
      }
      console.error("[login] auth failed:", authError?.message);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return await buildLoginResponse(authData.user.id, authData.user.email!, email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    if (msg.includes("JWT_SECRET")) {
      return NextResponse.json({ error: "Server auth is not configured" }, { status: 503 });
    }
    if (msg.includes("Supabase")) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    console.error("[login] unexpected error:", msg);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

async function buildLoginResponse(authUserId: string, authEmail: string, emailLookup: string) {
  let appUser = await findUserByEmail(emailLookup);

  // Auto-create app_users row if trigger hadn't fired yet for this user.
  if (!appUser) {
    const supabase = getServiceClient();
    await supabase
      .from("app_users")
      .upsert({ id: authUserId, email: emailLookup, role: "admin" }, { onConflict: "email" });
    appUser = await findUserByEmail(emailLookup);
  }

  if (!appUser) {
    console.error("[login] could not create app_users row for:", emailLookup);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }

  const payload: SessionPayload = {
    sub: authUserId,
    email: authEmail,
    role: appUser.role,
    submissionId: appUser.submission_id ?? undefined,
  };

  const token = await createSessionCookie(payload);
  const res = NextResponse.json({
    user: {
      id: authUserId,
      email: authEmail,
      role: appUser.role,
      submissionId: appUser.submission_id,
    },
  });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
