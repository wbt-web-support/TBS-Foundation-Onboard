import Link from "next/link";
import { WbtLogo } from "./WbtLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-5 sm:px-8">
        <Link href="/" className="flex items-center outline-none ring-brand-500/40 focus-visible:ring-2">
          <WbtLogo className="h-8 w-[200px] shrink-0" />
        </Link>
      </div>
    </header>
  );
}
