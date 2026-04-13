"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

interface DropdownProps {
  label: string;
  items: { href: string; label: string }[];
}

function NavDropdown({ label, items }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white/80 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-navy-900 border border-navy-700 rounded-lg shadow-xl py-1 min-w-[160px] z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-navy-800 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const baseTournamentItems = [
  { href: "/info", label: "Information" },
  { href: "/teams", label: "Teams" },
  { href: "/scoring", label: "Scoring" },
  { href: "/leaderboard", label: "Leaderboard" },
];

const recordBookItems = [
  { href: "/stats", label: "Stats" },
  { href: "/players", label: "Players" },
  { href: "/history", label: "Hall of Fame" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [hasActivePolls, setHasActivePolls] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/polls/active-count")
      .then((r) => r.json())
      .then((d) => setHasActivePolls(d.count > 0))
      .catch(() => {});
  }, []);

  function toggleMobileGroup(group: string) {
    setMobileExpanded(mobileExpanded === group ? null : group);
  }

  return (
    <nav className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-sm border-b border-navy-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-black text-white tracking-tight uppercase">
            Caz Masters
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-semibold">Home</Link>
            <NavDropdown label="Tournament" items={baseTournamentItems} />
            {hasActivePolls && (
              <Link href="/vote" className="text-gold-400 hover:text-gold-300 transition-colors text-sm font-black uppercase tracking-wider">Vote</Link>
            )}
            <NavDropdown label="Record Book" items={recordBookItems} />
            <Link href="/about" className="text-white/80 hover:text-white transition-colors text-sm font-semibold">About</Link>
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
              <Link
                href="/auth/signin"
                className="text-white/80 hover:text-white transition-colors text-sm font-semibold"
              >
                Sign In
              </Link>
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
          <div className="lg:hidden pb-4 space-y-1">
            <Link href="/" onClick={() => setOpen(false)} className="block text-white/80 hover:text-white py-2 font-semibold text-base">Home</Link>

            {/* Tournament group */}
            <button
              onClick={() => toggleMobileGroup("tournament")}
              className="flex items-center justify-between w-full text-white/80 hover:text-white py-2 font-semibold text-base"
            >
              Tournament
              <svg className={`w-4 h-4 transition-transform ${mobileExpanded === "tournament" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileExpanded === "tournament" && (
              <div className="pl-4 space-y-1">
                {baseTournamentItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block text-white/60 hover:text-white py-1.5 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {hasActivePolls && (
              <Link href="/vote" onClick={() => setOpen(false)} className="block text-gold-400 hover:text-gold-300 py-2 font-black text-base uppercase tracking-wider">Vote</Link>
            )}

            {/* Record Book group */}
            <button
              onClick={() => toggleMobileGroup("recordbook")}
              className="flex items-center justify-between w-full text-white/80 hover:text-white py-2 font-semibold text-base"
            >
              Record Book
              <svg className={`w-4 h-4 transition-transform ${mobileExpanded === "recordbook" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileExpanded === "recordbook" && (
              <div className="pl-4 space-y-1">
                {recordBookItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block text-white/60 hover:text-white py-1.5 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/about" onClick={() => setOpen(false)} className="block text-white/80 hover:text-white py-2 font-semibold text-base">About</Link>

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
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className="block text-white/80 hover:text-white py-2 font-semibold text-base"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block bg-gold-400 hover:bg-gold-300 text-navy-950 font-black px-5 py-2.5 rounded-lg text-center uppercase tracking-wider text-sm mt-2"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
