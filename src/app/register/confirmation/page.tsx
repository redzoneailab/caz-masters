import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTournamentSettings } from "@/lib/tournament-settings";

export const metadata: Metadata = {
  title: "LET'S FUCKING GO",
};

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { freeRegistration, entryFee } = await getTournamentSettings();
  const isPaid = status === "paid";
  const isFree = status === "free" || freeRegistration;

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/fore-america.jpg"
          alt="FORE AMERICA"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy-950/70" />
      </div>
      <div className="relative max-w-lg mx-auto px-4 sm:px-6 text-center py-20">
        <h1 className="text-5xl sm:text-7xl font-black text-white uppercase mb-6 leading-none">
          Let&apos;s
          <br />
          <span className="text-gold-400">Fucking</span>
          <br />
          Go
        </h1>
        <p className="text-white/90 text-xl mb-2">
          You&apos;re in. Welcome to the 15th Annual Caz Masters.
        </p>
        {isPaid ? (
          <p className="text-gold-400 font-bold text-lg mb-8">
            Paid up and ready to rip.
          </p>
        ) : isFree ? (
          <p className="text-gold-400 font-bold text-lg mb-8">
            You&apos;re registered. We&apos;ll handle payment details later.
          </p>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-8">
            <p className="text-white font-bold">
              Bring ${entryFee} to check-in. Cash or card.
            </p>
          </div>
        )}
        <p className="text-white/60 text-sm mb-10">
          Confirmation email incoming. Check spam if you don&apos;t see it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-colors border border-white/20"
          >
            Back to Home
          </Link>
          <Link
            href="/info"
            className="bg-gold-400 hover:bg-gold-300 text-navy-950 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Read the Rules
          </Link>
        </div>
      </div>
    </section>
  );
}
