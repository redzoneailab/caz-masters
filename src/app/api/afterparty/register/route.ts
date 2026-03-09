import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  const { name, email, numGuests, paymentMethod } = await req.json();

  if (!name || !email || !numGuests || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (numGuests < 1 || numGuests > 20) {
    return NextResponse.json({ error: "Invalid number of guests" }, { status: 400 });
  }

  // Check for existing registration
  const existing = await prisma.afterPartyRegistration.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "This email is already registered for the after party" }, { status: 400 });
  }

  // Check if this person is a tournament player
  const player = await prisma.player.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      tournament: { year: TOURNAMENT.year },
    },
  });

  const totalAmount = numGuests * TOURNAMENT.afterPartyPriceCents;

  const registration = await prisma.afterPartyRegistration.create({
    data: {
      name,
      email,
      numGuests,
      totalAmount,
      paymentMethod: paymentMethod === "stripe" ? "stripe" : "at_door",
      paymentStatus: paymentMethod === "at_door" ? "unpaid" : "unpaid",
      playerId: player?.id || null,
    },
  });

  if (paymentMethod === "stripe") {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Caz Masters After Party (${numGuests} guest${numGuests > 1 ? "s" : ""})` },
            unit_amount: TOURNAMENT.afterPartyPriceCents,
          },
          quantity: numGuests,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/afterparty/confirmation?registered=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/afterparty?cancelled=true`,
      customer_email: email,
      metadata: { afterPartyId: registration.id },
    });

    await prisma.afterPartyRegistration.update({
      where: { id: registration.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  return NextResponse.json({ success: true });
}
