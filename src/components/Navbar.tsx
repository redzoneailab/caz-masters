"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/teams", label: "Teams" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/scoring", label: "Live Scoring" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/history", label: "History" },
  { href: "/gallery", label: "Gallery" },
  { href: "/donate", label: "Donate" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-sm border-b border-navy-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-black text-white tracking-tight uppercase">
            Caz Masters
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors text-sm font-semibold"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/player/${session.userAccountId}`}
                  className="text-gold-400 hover:text-gold-300 text-sm font-semibold transition-colors"
                >
                  {session.user?.name?.split(" ")[0] || "Profile"}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-white/60 hover:text-white text-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="text-white/80 hover:text-white transition-colors text-sm font-semibold"
              >
                Sign In
              </button>
            )}
            <Link
              href="/register"
              className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-5 py-2 rounded-lg transition-colors text-sm uppercase tracking-wider"
            >
              Register
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-white/80 hover:text-white py-2 font-semibold text-base"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href={`/player/${session.userAccountId}`}
                  onClick={() => setOpen(false)}
                  className="block text-gold-400 hover:text-gold-300 py-2 font-semibold text-base"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { signOut(); setOpen(false); }}
                  className="block text-white/60 hover:text-white py-2 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { signIn("google"); setOpen(false); }}
                className="block text-white/80 hover:text-white py-2 font-semibold text-base"
              >
                Sign In with Google
              </button>
            )}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-5 py-2.5 rounded-lg text-center uppercase tracking-wider text-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
