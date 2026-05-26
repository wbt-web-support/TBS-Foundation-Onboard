import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(await clearSessionCookieOptions());
  return res;
}
