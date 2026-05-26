import Image from "next/image";
import { WBT_LOGO_DISPLAY, WBT_LOGO_URL } from "@/lib/brand/wbtLogo";

/** WBT wordmark — light logo for light mode, /logo.png for dark mode. */
export function WbtLogo({ className = "" }: { className?: string }) {
  return (
    <>
      <Image
        src={WBT_LOGO_URL}
        alt="We Build Trades"
        width={WBT_LOGO_DISPLAY.width}
        height={WBT_LOGO_DISPLAY.height}
        className={`${className} dark:hidden`}
        priority
        unoptimized
      />
      <Image
        src="/logo.png"
        alt="We Build Trades"
        width={WBT_LOGO_DISPLAY.width}
        height={WBT_LOGO_DISPLAY.height}
        className={`${className} hidden dark:block`}
        priority
        unoptimized
      />
    </>
  );
}
