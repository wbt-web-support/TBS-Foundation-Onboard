import Image from "next/image";
import { WBT_LOGO_DISPLAY, WBT_LOGO_URL } from "@/lib/brand/wbtLogo";

/** WBT wordmark from hosted logo (same asset as email + PDF). */
export function WbtLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={WBT_LOGO_URL}
      alt="We Build Trades"
      width={WBT_LOGO_DISPLAY.width}
      height={WBT_LOGO_DISPLAY.height}
      className={className}
      priority
      unoptimized
    />
  );
}
