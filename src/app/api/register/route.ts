import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendConfirmationEmail } from "@/lib/resend";
import { TOURNAMENT } from "@/lib/tournament";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      shirtSize,
      genderFlight,
      paymentMethod,
      afterParty,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !shirtSize || !genderFlight) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Get or create tournament
    let tournament = await prisma.tournament.findUnique({
      where: { year: TOURNAMENT.year },
    });

    if (!tournament) {
      tournament = await prisma.tournament.create({
        data: {
          name: TOURNAMENT.name,
          year: TOURNAMENT.year,
          date: TOURNAMENT.date,
          location: TOURNAMENT.location,
          maxPlayers: TOURNAMENT.maxPlayers,
          entryFee: TOURNAMENT.entryFeeCents,
        },
      });
    }

    // Check registration is open
    if (!tournament.registrationOpen) {
      return NextResponse.json({ error: "Registration is currently closed." }, { status: 400 });
    }

    // Check capacity (only count non-waitlisted players)
    const playerCount = await prisma.player.count({
      where: { tournamentId: tournament.id, waitlisted: false },
    });

    const isWaitlisted = playerCount >= tournament.maxPlayers;

    // Check for duplicate registration
    const existing = await prisma.player.findUnique({
      where: {
        email_tournamentId: { email, tournamentId: tournament.id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
    }

    // Link to existing UserAccount if the registrant already has one
    const existingAccount = await prisma.userAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    // Check if this email has registered in a previous tournament
    const previousReg = await prisma.player.findFirst({
      where: { email, tournamentId: { not: tournament.id } },
    });

    // Create player
    const player = await prisma.player.create({
      data: {
        fullName,
        email,
        phone,
        shirtSize,
        genderFlight,
        teamPreference: null,
        returningPlayer: !!previousReg,
        dietaryNeeds: null,
        tournamentId: tournament.id,
        waitlisted: isWaitlisted,
        ...(existingAccount && { userAccountId: existingAccount.id }),
      },
    });

    // Create after party registration if requested
    let afterPartyReg = null;
    if (afterParty && afterParty.numGuests > 0) {
      const numGuests = Math.min(Math.max(1, afterParty.numGuests), 20);
      const numKids = Math.min(Math.max(0, afterParty.numKids || 0), 20);
      const existingAP = await prisma.afterPartyRegistration.findUnique({ where: { email } });
      if (!existingAP) {
        afterPartyReg = await prisma.afterPartyRegistration.create({
          data: {
            name: fullName,
            email,
            numGuests,
            numKids,
            totalAmount: 0, // Price TBD — will be updated when finalized
            paymentMethod: paymentMethod === "stripe" ? "stripe" : "at_door",
            paymentStatus: "unpaid",
            playerId: player.id,
          },
        });
      }
    }

    // Free registration mode — skip payment entirely
    if (tournament.freeRegistration) {
      await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: 0,
          status: "unpaid",
          method: "free",
        },
      });

      try {
        await sendConfirmationEmail(email, fullName, "free");
      } catch {
        // Don't fail registration if email fails
      }

      return NextResponse.json({ success: true, redirect: `/register/confirmation?status=free${isWaitlisted ? "&waitlisted=true" : ""}` });
    }

    if (paymentMethod === "stripe") {
      // Build line items
      const lineItems: {
        price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
        quantity: number;
      }[] = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `The Caz Masters ${TOURNAMENT.year} - Entry Fee`,
              description: `Registration for ${fullName}`,
            },
            unit_amount: tournament.entryFee,
          },
          quantity: 1,
        },
      ];

      // After party price TBD — no Stripe line item for now

      // Create Stripe checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/register/confirmation?status=paid${isWaitlisted ? "&waitlisted=true" : ""}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=true`,
        customer_email: email,
        metadata: {
          playerId: player.id,
          ...(afterPartyReg ? { afterPartyId: afterPartyReg.id } : {}),
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: tournament.entryFee,
          status: "unpaid",
          stripeSessionId: session.id,
          method: "stripe",
        },
      });

      // Link stripe session to after party reg
      if (afterPartyReg) {
        await prisma.afterPartyRegistration.update({
          where: { id: afterPartyReg.id },
          data: { stripeSessionId: session.id },
        });
      }

      return NextResponse.json({ checkoutUrl: session.url });
    } else {
      // Pay day-of
      await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: tournament.entryFee,
          status: "unpaid",
          method: "day_of",
        },
      });

      // Send confirmation email
      try {
        await sendConfirmationEmail(email, fullName, "unpaid");
      } catch {
        // Don't fail registration if email fails
      }

      return NextResponse.json({ success: true, waitlisted: isWaitlisted });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
