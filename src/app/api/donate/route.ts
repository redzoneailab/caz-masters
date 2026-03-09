import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { amount, donorName, donorEmail, dedicatedTo, message } = await req.json();

  if (!amount || amount < 1 || amount > 10000) {
    return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
  }

  const amountCents = Math.round(amount * 100);

  const donation = await prisma.donation.create({
    data: {
      amount: amountCents,
      donorName: donorName || null,
      donorEmail: donorEmail || null,
      dedicatedTo: dedicatedTo || null,
      message: message || null,
    },
  });

  const lineItemName = dedicatedTo
    ? `Caz Cares Donation - In honor of ${dedicatedTo}`
    : "Caz Cares Donation";

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: lineItemName },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate?donated=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate?cancelled=true`,
    metadata: { donationId: donation.id },
    ...(donorEmail ? { customer_email: donorEmail } : {}),
  });

  await prisma.donation.update({
    where: { id: donation.id },
    data: { stripeSessionId: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
