import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/resend";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Handle tournament registration payment
    const playerId = session.metadata?.playerId;
    if (playerId) {
      await prisma.payment.update({
        where: { playerId },
        data: { status: "paid_online" },
      });

      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (player) {
        try {
          await sendConfirmationEmail(player.email, player.fullName, "paid_online");
        } catch {
          // Log but don't fail
        }
      }
    }

    // Handle donation payment
    const donationId = session.metadata?.donationId;
    if (donationId) {
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "completed" },
      });
    }

    // Handle store order payment
    const storeOrderId = session.metadata?.storeOrderId;
    if (storeOrderId) {
      const order = await prisma.storeOrder.update({
        where: { id: storeOrderId },
        data: { status: "paid" },
        include: { items: true },
      });

      // Decrement inventory
      for (const item of order.items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    // Handle after party payment
    const afterPartyId = session.metadata?.afterPartyId;
    if (afterPartyId) {
      await prisma.afterPartyRegistration.update({
        where: { id: afterPartyId },
        data: { paymentStatus: "paid_online" },
      });
    }

    // Handle beer tab payment
    const beerTabPlayerId = session.metadata?.beerTabPlayerId;
    if (beerTabPlayerId) {
      await prisma.beerTab.update({
        where: { playerId: beerTabPlayerId },
        data: { status: "paid_online" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
