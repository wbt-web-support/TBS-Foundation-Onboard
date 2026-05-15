import Link from "next/link";
import { WbtLogo } from "./WbtLogo";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-14 w-full items-center justify-start px-5 sm:px-8">
        <Link href="/" className="flex items-center outline-none ring-brand-500/40 focus-visible:ring-2">
          <WbtLogo className="h-8 w-[200px] shrink-0" />
        </Link>
      </div>
    </header>
  );
}
