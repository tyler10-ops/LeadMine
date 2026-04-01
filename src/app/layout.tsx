import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LeadMine — AI-Powered Lead Mining for Realtors",
  description:
    "LeadMine finds, scores, and prioritizes your best real estate leads automatically. Mine smarter. Close faster.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#0A0A0A] text-neutral-200`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
