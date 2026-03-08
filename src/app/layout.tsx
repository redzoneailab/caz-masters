import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Caz Masters | 15th Annual Charity Golf Tournament",
  description:
    "Join us for the 15th Annual Caz Masters charity golf tournament at Cazenovia Golf Club. July 4th Weekend, 2026. 72-player field.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <AuthSessionProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
