import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email",
};

export default function VerifyRequestPage() {
  return (
    <section className="min-h-[80vh] bg-navy-950 flex items-center justify-center py-16">
      <div className="max-w-sm w-full mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gold-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white uppercase mb-4">
          Check Your Email
        </h1>
        <p className="text-navy-300 text-lg mb-2">
          We sent you a sign-in link.
        </p>
        <p className="text-navy-400 text-sm mb-8">
          Click the link in the email to sign in. Check your spam folder if you
          don&apos;t see it.
        </p>
        <Link
          href="/auth/signin"
          className="text-gold-400 hover:text-gold-300 text-sm font-semibold transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </section>
  );
}
