import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RegistrationForm from "./RegistrationForm";
import { getTournamentSettings } from "@/lib/tournament-settings";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for the 14th Annual Caz Masters charity golf tournament.",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/register&message=register");
  }

  const { freeRegistration, entryFee } = await getTournamentSettings();

  // Look up previous registration for signed-in users
  let prefill: { fullName: string; email: string; phone: string; shirtSize: string; genderFlight: string } | null = null;
  if (session.userAccountId) {
    const prev = await prisma.player.findFirst({
      where: { userAccountId: session.userAccountId },
      orderBy: { createdAt: "desc" },
      select: { fullName: true, email: true, phone: true, shirtSize: true, genderFlight: true },
    });
    if (prev) prefill = prev;
  }
  if (!prefill && session.user?.email) {
    const prev = await prisma.player.findFirst({
      where: { email: session.user.email },
      orderBy: { createdAt: "desc" },
      select: { fullName: true, email: true, phone: true, shirtSize: true, genderFlight: true },
    });
    if (prev) prefill = prev;
  }

  // New player — pre-populate from their auth account
  if (!prefill) {
    prefill = {
      fullName: session.user?.name || "",
      email: session.user?.email || "",
      phone: "",
      shirtSize: "",
      genderFlight: "",
    };
  }

  return (
    <>
      <section className="relative text-white py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt="Cazenovia Golf Club"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-navy-950/75" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-6xl font-black mb-3 uppercase">You In?</h1>
          <p className="text-white/80 text-lg sm:text-xl font-light">
            {freeRegistration
              ? "Lock in your spot. Let\u2019s do this."
              : `Lock in your spot. $${entryFee}. Let\u2019s do this.`}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <RegistrationForm prefill={prefill} />
        </div>
      </section>
    </>
  );
}
