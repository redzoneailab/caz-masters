import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const registrations = await prisma.afterPartyRegistration.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalHeadcount = registrations.reduce((sum, r) => sum + r.numGuests, 0);
  const paidOnline = registrations.filter((r) => r.paymentStatus === "paid_online");
  const paidManual = registrations.filter((r) => r.paymentStatus === "paid_manual");
  const unpaid = registrations.filter((r) => r.paymentStatus === "unpaid");

  const stats = {
    totalHeadcount,
    totalRegistrations: registrations.length,
    paidCount: paidOnline.length + paidManual.length,
    unpaidCount: unpaid.length,
    revenue: [...paidOnline, ...paidManual].reduce((sum, r) => sum + r.totalAmount, 0),
  };

  return NextResponse.json({ registrations, stats });
}
