import { getServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "./constants";

export const APP_USERS_TABLE = "app_users";

export type DbUser = {
  id: string;
  email: string;
  role: UserRole;
  submission_id: string | null;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from(APP_USERS_TABLE)
    .select("id, email, role, submission_id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === "42P01") return null;
    throw new Error(error.message);
  }
  return data as DbUser | null;
}
