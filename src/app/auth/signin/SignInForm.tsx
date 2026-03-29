"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

const MESSAGES: Record<string, string> = {
  register: "Sign in to register for the Caz Masters.",
};

export default function SignInForm({
  callbackUrl,
  error,
  message,
}: {
  callbackUrl?: string;
  error?: string;
  message?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = callbackUrl || "/";

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, callbackUrl: redirect });
  }

  return (
    <section className="min-h-[80vh] bg-navy-950 flex items-center justify-center py-16">
      <div className="max-w-sm w-full mx-auto px-4">
        <Link
          href="/"
          className="block text-center text-lg font-black text-white tracking-tight uppercase mb-2"
        >
          Caz Masters
        </Link>
        <h1 className="text-3xl font-black text-white uppercase text-center mb-8">
          Sign In
        </h1>

        {message && MESSAGES[message] && (
          <div className="bg-gold-400/10 border border-gold-400/30 rounded-xl p-3 mb-6 text-gold-400 text-sm text-center font-medium">
            {MESSAGES[message]}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-red-400 text-sm text-center">
            {error === "OAuthAccountNotLinked"
              ? "This email is already associated with another sign-in method."
              : "Something went wrong. Please try again."}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: redirect })}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-navy-700" />
          <span className="text-navy-500 text-sm font-medium">or</span>
          <div className="flex-1 border-t border-navy-700" />
        </div>

        <form onSubmit={handleEmailSignIn}>
          <label htmlFor="email" className="block text-navy-300 text-sm font-medium mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-white placeholder:text-navy-600 focus:outline-none focus:border-gold-400 transition-colors mb-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-400 hover:bg-gold-300 text-navy-950 font-black py-3 rounded-xl transition-colors uppercase tracking-wider text-sm disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Sign-In Link"}
          </button>
        </form>

        <p className="text-navy-500 text-xs text-center mt-6">
          We&apos;ll email you a magic link to sign in. No password needed.
        </p>
      </div>
    </section>
  );
}
