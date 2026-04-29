import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import CacheWarmer from "@/components/CacheWarmer";
import SWRProvider from "@/components/SWRProvider";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <CacheWarmer />
        <SessionProvider>
          <SWRProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
