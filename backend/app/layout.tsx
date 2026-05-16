import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FinSight Backend",
  description: "API backend for FinSight",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
