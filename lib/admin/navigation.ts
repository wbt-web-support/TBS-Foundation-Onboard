export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

/** Add new admin pages here — the sidebar picks them up automatically. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/clients",
    label: "Client list",
    description: "Submissions & documents",
    icon: "users",
  },
  {
    href: "/admin/form-analytics",
    label: "Form Analytics",
    description: "Funnel, sessions & errors",
    icon: "trend",
  },
  {
    href: "/admin/welcome-videos",
    label: "Welcome Videos",
    description: "Videos on the landing page",
    icon: "play",
  },
];

export const ADMIN_DEFAULT_ROUTE = "/admin/clients";
