import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { year: TOURNAMENT.year },
    include: {
      course: {
        include: {
          holes: {
            include: { teeBoxes: { orderBy: { name: "asc" } } },
            orderBy: { holeNumber: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json({
    course: tournament?.course || null,
    tournamentId: tournament?.id,
    numHoles: tournament?.numHoles || 18,
  });
}

// Seed or configure course
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, numHoles } = await req.json();

  if (action === "set-num-holes" && numHoles) {
    const tournament = await prisma.tournament.findUnique({ where: { year: TOURNAMENT.year } });
    if (tournament) {
      await prisma.tournament.update({ where: { id: tournament.id }, data: { numHoles } });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "seed-cazenovia") {
    // Delete old course data if exists
    const tournament = await prisma.tournament.findUnique({ where: { year: TOURNAMENT.year } });
    if (tournament?.courseId) {
      await prisma.course.delete({ where: { id: tournament.courseId } });
      await prisma.tournament.update({ where: { id: tournament.id }, data: { courseId: null } });
    }

    // Cazenovia Golf Club - 9 physical holes, played as 18
    // Front 9 (holes 1-9): Men = White tees, Women = Yellow tees
    // Back 9 (holes 10-18): Men = Red tees, Women = Yellow tees (same physical holes, different tees)
    const holeData: { holeNumber: number; tees: { name: string; par: number; yardage: number }[] }[] = [
      // Front 9 - White + Yellow
      { holeNumber: 1,  tees: [{ name: "White", par: 4, yardage: 345 }, { name: "Yellow", par: 4, yardage: 310 }] },
      { holeNumber: 2,  tees: [{ name: "White", par: 3, yardage: 155 }, { name: "Yellow", par: 3, yardage: 125 }] },
      { holeNumber: 3,  tees: [{ name: "White", par: 4, yardage: 385 }, { name: "Yellow", par: 4, yardage: 345 }] },
      { holeNumber: 4,  tees: [{ name: "White", par: 5, yardage: 495 }, { name: "Yellow", par: 5, yardage: 440 }] },
      { holeNumber: 5,  tees: [{ name: "White", par: 4, yardage: 340 }, { name: "Yellow", par: 4, yardage: 305 }] },
      { holeNumber: 6,  tees: [{ name: "White", par: 3, yardage: 165 }, { name: "Yellow", par: 3, yardage: 130 }] },
      { holeNumber: 7,  tees: [{ name: "White", par: 4, yardage: 375 }, { name: "Yellow", par: 4, yardage: 330 }] },
      { holeNumber: 8,  tees: [{ name: "White", par: 4, yardage: 405 }, { name: "Yellow", par: 5, yardage: 365 }] },
      { holeNumber: 9,  tees: [{ name: "White", par: 4, yardage: 355 }, { name: "Yellow", par: 4, yardage: 315 }] },
      // Back 9 - Red + Yellow (same physical holes from different tees)
      { holeNumber: 10, tees: [{ name: "Red", par: 4, yardage: 325 }, { name: "Yellow", par: 4, yardage: 310 }] },
      { holeNumber: 11, tees: [{ name: "Red", par: 3, yardage: 145 }, { name: "Yellow", par: 3, yardage: 125 }] },
      { holeNumber: 12, tees: [{ name: "Red", par: 4, yardage: 365 }, { name: "Yellow", par: 4, yardage: 345 }] },
      { holeNumber: 13, tees: [{ name: "Red", par: 5, yardage: 475 }, { name: "Yellow", par: 5, yardage: 440 }] },
      { holeNumber: 14, tees: [{ name: "Red", par: 4, yardage: 320 }, { name: "Yellow", par: 4, yardage: 305 }] },
      { holeNumber: 15, tees: [{ name: "Red", par: 3, yardage: 150 }, { name: "Yellow", par: 3, yardage: 130 }] },
      { holeNumber: 16, tees: [{ name: "Red", par: 4, yardage: 355 }, { name: "Yellow", par: 4, yardage: 330 }] },
      { holeNumber: 17, tees: [{ name: "Red", par: 5, yardage: 390 }, { name: "Yellow", par: 5, yardage: 365 }] },
      { holeNumber: 18, tees: [{ name: "Red", par: 4, yardage: 335 }, { name: "Yellow", par: 4, yardage: 315 }] },
    ];

    const course = await prisma.course.create({
      data: {
        name: "Cazenovia Golf Club",
        city: "Cazenovia",
        state: "NY",
        holes: {
          create: holeData.map((h) => ({
            holeNumber: h.holeNumber,
            teeBoxes: {
              create: h.tees.map((t) => ({
                name: t.name,
                par: t.par,
                yardage: t.yardage,
              })),
            },
          })),
        },
      },
      include: {
        holes: {
          include: { teeBoxes: true },
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    // Link to tournament and set 18 holes
    if (tournament) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { courseId: course.id, numHoles: 18 },
      });
    }

    return NextResponse.json({ course }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
