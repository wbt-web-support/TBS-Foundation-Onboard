import { getServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "./constants";
import { verifyPassword } from "./password";

export const APP_USERS_TABLE = "app_users";

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  submission_id: string | null;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select("id, email, password_hash, role, submission_id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "42P01") return null;
    throw new Error(error.message);
  }
  return data as DbUser | null;
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<DbUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.password_hash);
  return ok ? user : null;
}
