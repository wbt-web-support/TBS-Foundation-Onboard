"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { fetchCurrentUser, logoutAdmin } from "@/lib/admin/auth";
import { useEffect, useState } from "react";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function NavLink({
  href,
  label,
  description,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  description: string;
  icon: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        active
          ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
      }`}
    >
      <Icon
        name={icon}
        className={`mt-0.5 size-5 shrink-0 ${active ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"}`}
      />
      <span className="min-w-0">
        <span className={`block text-sm font-medium ${active ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-500">{description}</span>
      </span>
    </Link>
  );
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then((u) => setSignedIn(u?.role === "admin"));
  }, [pathname]);

  const handleSignOut = async () => {
    await logoutAdmin();
    setSignedIn(false);
    window.location.href = "/admin/clients";
  };

  const panel = (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Admin</p>
        <h2 className="mt-1 text-base font-semibold text-ink">Foundation Onboard</h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Dashboard</p>
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-700">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <Icon name="sheet" className="size-4 text-slate-400 dark:text-slate-500" />
          View onboarding form
        </Link>
        {signedIn && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <Icon name="logout" className="size-4 text-slate-400 dark:text-slate-500" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex">{panel}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ top: "3.5rem" }}
      >
        {panel}
      </div>
    </>
  );
}
