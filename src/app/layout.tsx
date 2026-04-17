import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "White Box — Where Every Rupee Tells the Truth",
  description: "Trust-as-a-Service transparency platform for NGO donations in Pakistan. Real-time tracking of donations vs verified spending with SHA-256 audit integrity.",
  keywords: ["NGO", "donations", "transparency", "Pakistan", "audit", "trust"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        {/* Footer */}
        <footer className="border-t border-white/5 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted">
            <span>White Box © 2026 — Micathon &apos;26</span>
            <span className="font-mono">SHA-256 Integrity Verified</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
