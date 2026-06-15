import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 w-full bg-rail">
      <div className="flex h-full w-full items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center outline-none">
          <Image
            src="/logo.png"
            alt="We Build Trades"
            width={160}
            height={32}
            className="h-8 w-auto object-contain"
            style={{ width: "auto", height: "2rem" }}
            priority
            unoptimized
          />
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-rail-muted">
          Client Onboarding
        </span>
      </div>
    </header>
  );
}
