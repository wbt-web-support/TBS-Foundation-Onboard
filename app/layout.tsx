import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "WBT Foundation Onboarding",
  description: "WeBuildTrades Foundation onboarding questionnaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full overflow-x-hidden bg-canvas pt-14">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
