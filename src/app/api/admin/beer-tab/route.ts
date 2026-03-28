import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendBeerTabEmail } from "@/lib/resend";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// GET — return beer tab with payment status
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ beerTab: [] });
  }

  // Compute beer counts from scores
  const beerScores = await prisma.score.findMany({
    where: { tournamentId: tournament.id, shotgunBeer: true },
    include: {
      player: {
        select: { id: true, fullName: true, email: true, team: { select: { name: true } } },
      },
    },
  });

  const byPlayer = new Map<string, { name: string; email: string; team: string; count: number }>();
  for (const s of beerScores) {
    const existing = byPlayer.get(s.playerId);
    if (existing) {
      existing.count++;
    } else {
      byPlayer.set(s.playerId, {
        name: s.player.fullName,
        email: s.player.email,
        team: s.player.team?.name || "",
        count: 1,
      });
    }
  }

  // Get existing BeerTab records for payment status
  const beerTabs = await prisma.beerTab.findMany({
    where: { tournamentId: tournament.id },
  });
  const tabByPlayer = new Map(beerTabs.map((t) => [t.playerId, t]));

  const beerTab = Array.from(byPlayer.entries())
    .map(([playerId, data]) => {
      const tab = tabByPlayer.get(playerId);
      return {
        playerId,
        name: data.name,
        email: data.email,
        team: data.team,
        count: data.count,
        totalOwed: data.count * TOURNAMENT.shotgunBeerPrice,
        status: tab?.status || "unpaid",
        beerTabId: tab?.id || null,
      };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ beerTab, tournamentId: tournament.id });
}

// POST — send invoice(s)
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, playerId } = await req.json();

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
  });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Compute beer counts
  const beerScores = await prisma.score.findMany({
    where: { tournamentId: tournament.id, shotgunBeer: true },
    include: {
      player: { select: { id: true, fullName: true, email: true } },
    },
  });

  const byPlayer = new Map<string, { name: string; email: string; count: number }>();
  for (const s of beerScores) {
    const existing = byPlayer.get(s.playerId);
    if (existing) {
      existing.count++;
    } else {
      byPlayer.set(s.playerId, { name: s.player.fullName, email: s.player.email, count: 1 });
    }
  }

  async function sendInvoice(pid: string) {
    const data = byPlayer.get(pid);
    if (!data || data.count === 0) return;

    const totalCents = data.count * TOURNAMENT.shotgunBeerPrice * 100;
    const totalDollars = data.count * TOURNAMENT.shotgunBeerPrice;

    // Create Stripe payment link
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Shotgun Mulligans (${data.count})`,
              description: `${data.count} Shotgun Mulligan${data.count !== 1 ? "s" : ""} at The Caz Masters ${TOURNAMENT.year}`,
            },
            unit_amount: TOURNAMENT.shotgunBeerPrice * 100,
          },
          quantity: data.count,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?tab=paid`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      customer_email: data.email,
      metadata: { beerTabPlayerId: pid },
    });

    // Upsert BeerTab record
    await prisma.beerTab.upsert({
      where: { playerId: pid },
      update: {
        totalBeers: data.count,
        totalAmount: totalCents,
        stripeSessionId: session.id,
      },
      create: {
        playerId: pid,
        tournamentId: tournament!.id,
        totalBeers: data.count,
        totalAmount: totalCents,
        status: "unpaid",
        stripeSessionId: session.id,
      },
    });

    await sendBeerTabEmail(data.email, data.name, data.count, totalDollars, session.url!);
  }

  if (action === "send-all") {
    let sent = 0;
    for (const [pid, data] of byPlayer) {
      // Skip players who already paid
      const existing = await prisma.beerTab.findUnique({ where: { playerId: pid } });
      if (existing?.status === "paid_online" || existing?.status === "paid_manual") continue;
      if (data.count === 0) continue;
      await sendInvoice(pid);
      sent++;
    }
    return NextResponse.json({ sent });
  }

  if (action === "send-reminder" && playerId) {
    await sendInvoice(playerId);
    return NextResponse.json({ sent: 1 });
  }

  if (action === "mark-paid" && playerId) {
    await prisma.beerTab.upsert({
      where: { playerId },
      update: { status: "paid_manual" },
      create: {
        playerId,
        tournamentId: tournament!.id,
        totalBeers: byPlayer.get(playerId)?.count || 0,
        totalAmount: (byPlayer.get(playerId)?.count || 0) * TOURNAMENT.shotgunBeerPrice * 100,
        status: "paid_manual",
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "mark-unpaid" && playerId) {
    const existing = await prisma.beerTab.findUnique({ where: { playerId } });
    if (existing) {
      await prisma.beerTab.update({ where: { playerId }, data: { status: "unpaid" } });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
