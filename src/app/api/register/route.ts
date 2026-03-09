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
      teamPreference,
      returningPlayer,
      dietaryNeeds,
      paymentMethod,
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

    // Check capacity
    const playerCount = await prisma.player.count({
      where: { tournamentId: tournament.id },
    });

    if (playerCount >= tournament.maxPlayers) {
      return NextResponse.json({ error: "Tournament is full." }, { status: 400 });
    }

    // Check for duplicate registration
    const existing = await prisma.player.findUnique({
      where: {
        email_tournamentId: { email, tournamentId: tournament.id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        fullName,
        email,
        phone,
        shirtSize,
        genderFlight,
        teamPreference: teamPreference || null,
        returningPlayer: returningPlayer || false,
        dietaryNeeds: dietaryNeeds || null,
        tournamentId: tournament.id,
      },
    });

    if (paymentMethod === "stripe") {
      // Create Stripe checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `The Caz Masters 2026 - Entry Fee`,
                description: `Registration for ${fullName}`,
              },
              unit_amount: TOURNAMENT.entryFeeCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/register/confirmation?status=paid`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=true`,
        customer_email: email,
        metadata: {
          playerId: player.id,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: TOURNAMENT.entryFeeCents,
          status: "unpaid",
          stripeSessionId: session.id,
          method: "stripe",
        },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    } else {
      // Pay day-of
      await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: TOURNAMENT.entryFeeCents,
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

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
