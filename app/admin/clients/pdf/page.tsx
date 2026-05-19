import { redirect } from "next/navigation";

/** Catch mistaken visits to /admin/clients/pdf (use API or Download button instead). */
export default function AdminClientsPdfRedirectPage() {
  redirect("/admin/clients");
}
