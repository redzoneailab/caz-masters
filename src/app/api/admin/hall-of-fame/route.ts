import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.hallOfFameEntry.findMany({
    orderBy: [{ year: "desc" }, { category: "asc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, category, winnerName, teamName, description, score } = await req.json();

  if (!year || !category || !winnerName) {
    return NextResponse.json({ error: "Year, category, and winner name are required" }, { status: 400 });
  }

  const entry = await prisma.hallOfFameEntry.create({
    data: {
      year: parseInt(year),
      category,
      winnerName,
      teamName: teamName || null,
      description: description || null,
      score: score != null ? parseInt(score) : null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
