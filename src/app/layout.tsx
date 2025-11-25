import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import CacheWarmer from "@/components/CacheWarmer";

export const metadata: Metadata = {
  title: "RVU Tracker",
  description: "Track and analyze medical procedure RVUs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CacheWarmer />
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
