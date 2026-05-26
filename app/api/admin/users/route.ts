import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/analytics/adminAuth";
import type { UserRole } from "@/lib/auth/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/admin/users — create a new admin or client user.
 *  Creates the Supabase Auth account (email auto-confirmed) and the
 *  app_users row in one atomic step. Requires an active admin session. */
export async function POST(request: Request) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    role?: string;
  } | null;

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role: UserRole = body?.role === "client" ? "client" : "admin";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Create the Supabase Auth user with email auto-confirmed so they can log in immediately.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Upsert the app_users row (trigger may have already created it).
  const { error: dbError } = await supabase
    .from("app_users")
    .upsert({ id: authData.user.id, email, role }, { onConflict: "email" });

  if (dbError) {
    // Auth user was created — clean it up to avoid orphans.
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(
    { user: { id: authData.user.id, email, role } },
    { status: 201 },
  );
}
