import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Admin | Foundation Onboarding",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
