import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Portfolio Tracker — Real-Time Token Dashboard",
  description:
    "Track your Solana token portfolio in real time. View balances, prices, allocation, and on-chain activity for any wallet address.",
  openGraph: {
    title: "Solana Portfolio Tracker",
    description: "Real-time Solana wallet dashboard — balances, pricing, allocation & activity.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06091a" },
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}