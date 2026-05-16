import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FinSight — AI-Powered Personal Finance Manager",
  description:
    "Track expenses, set budgets, and gain AI-driven insights to take control of your finances in Pakistan.",
  manifest: "/manifest.webmanifest",
  keywords: [
    "personal finance",
    "expense tracker",
    "budget manager",
    "Pakistan",
    "PKR",
    "FinSight",
  ],
  appleWebApp: {
    capable: true,
    title: "FinSight",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
