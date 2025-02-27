import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Portfolio Tracker",
  description: "Track your Solana token portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}