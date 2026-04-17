import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/SessionProvider";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://cazmasters.com"),
  title: {
    default: "The Caz Masters | 15th Annual Charity Golf Tournament",
    template: "%s | The Caz Masters",
  },
  description:
    "72 players. 18 holes. All for charity. July 3rd, 2026 at Cazenovia Golf Club.",
  openGraph: {
    title: "The Caz Masters | 15th Annual Charity Golf Tournament",
    description:
      "72 players. 18 holes. All for charity. July 3rd, 2026 at Cazenovia Golf Club.",
    url: "https://cazmasters.com",
    siteName: "The Caz Masters",
    images: [
      {
        url: "/images/group-2018.jpg",
        width: 1200,
        height: 630,
        alt: "The Caz Masters — Annual Charity Golf Tournament",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Caz Masters | 15th Annual Charity Golf Tournament",
    description:
      "72 players. 18 holes. All for charity. July 3rd, 2026 at Cazenovia Golf Club.",
    images: ["/images/group-2018.jpg"],
  },
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
        <Analytics />
      </body>
    </html>
  );
}
