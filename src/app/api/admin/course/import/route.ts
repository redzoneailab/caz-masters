import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// The API returns tees split by gender, each containing an array of tee box objects.
// Each tee box has a name and a holes array with per-hole par/yardage/handicap.
//
// Example structure:
// {
//   course: {
//     id, club_name, course_name, location: { city, state, country },
//     tees: {
//       male: [
//         { tee_name: "White", holes: [{ hole_number: 1, par: 4, yardage: 345, handicap: 7 }, ...] },
//         { tee_name: "Blue",  holes: [...] }
//       ],
//       female: [
//         { tee_name: "Red", holes: [...] }
//       ]
//     }
//   }
// }

interface ApiHole {
  hole_number: number;
  par: number;
  yardage: number | null;
  handicap?: number | null;
}

interface ApiTeeSet {
  tee_name: string;
  colour?: string;
  course_rating?: number;
  slope_rating?: number;
  holes: ApiHole[];
}

interface ApiCourseDetail {
  course: {
    id: string;
    club_name: string;
    course_name: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    tees: {
      male?: ApiTeeSet[];
      female?: ApiTeeSet[];
    };
  };
}

/**
 * Flatten the gender-split tee structure into a single map:
 *   holeNumber -> teeBoxName -> { par, yardage }
 *
 * If both male and female sides share the same tee name, we keep both
 * (they'll merge by unique constraint on [courseHoleId, name]).
 * If a tee name appears only under female, it's still a valid tee box.
 */
function buildHoleMap(
  tees: { male?: ApiTeeSet[]; female?: ApiTeeSet[] }
): Map<number, Map<string, { par: number; yardage: number | null }>> {
  const holeMap = new Map<number, Map<string, { par: number; yardage: number | null }>>();

  function processTeeSet(teeSet: ApiTeeSet) {
    const teeName = teeSet.tee_name || teeSet.colour || "Default";
    for (const h of teeSet.holes) {
      if (!h.hole_number || h.hole_number < 1) continue;
      let tees = holeMap.get(h.hole_number);
      if (!tees) {
        tees = new Map();
        holeMap.set(h.hole_number, tees);
      }
      // First writer wins — if the same tee name appears in both male and female,
      // the male set takes precedence (they're usually identical for shared tees).
      if (!tees.has(teeName)) {
        tees.set(teeName, { par: h.par, yardage: h.yardage ?? null });
      }
    }
  }

  for (const ts of tees.male || []) processTeeSet(ts);
  for (const ts of tees.female || []) processTeeSet(ts);

  return holeMap;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "Course ID required" }, { status: 400 });
  }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Golf course API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.golfcourseapi.com/v1/courses/${encodeURIComponent(courseId)}`,
      { headers: { Authorization: `Key ${apiKey}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Golf course API detail error:", res.status, text);
      return NextResponse.json({ error: "Failed to fetch course details" }, { status: 502 });
    }

    const data: ApiCourseDetail = await res.json();
    const c = data.course;
    if (!c) {
      return NextResponse.json({ error: "Invalid course data returned" }, { status: 502 });
    }

    const courseName = [c.club_name, c.course_name].filter(Boolean).join(" — ") || "Imported Course";
    const city = c.location?.city || null;
    const state = c.location?.state || null;

    const holeMap = buildHoleMap(c.tees || {});

    if (holeMap.size === 0) {
      return NextResponse.json({ error: "No hole data found for this course" }, { status: 400 });
    }

    // Convert map to sorted array
    const holes = Array.from(holeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([holeNumber, tees]) => ({
        holeNumber,
        teeBoxes: Array.from(tees.entries()).map(([name, data]) => ({
          name,
          par: data.par,
          yardage: data.yardage,
        })),
      }));

    // Delete existing course if tournament has one
    const tournament = await prisma.tournament.findUnique({ where: { year: TOURNAMENT.year } });
    if (tournament?.courseId) {
      await prisma.course.delete({ where: { id: tournament.courseId } });
      await prisma.tournament.update({ where: { id: tournament.id }, data: { courseId: null } });
    }

    // Create course with holes and tee boxes
    const course = await prisma.course.create({
      data: {
        name: courseName,
        city,
        state,
        holes: {
          create: holes.map((h) => ({
            holeNumber: h.holeNumber,
            teeBoxes: {
              create: h.teeBoxes.map((t) => ({
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
          include: { teeBoxes: { orderBy: { name: "asc" } } },
          orderBy: { holeNumber: "asc" },
        },
      },
    });

    // Link to tournament and set numHoles
    if (tournament) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { courseId: course.id, numHoles: holes.length },
      });
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Course import error:", error);
    return NextResponse.json({ error: "Failed to import course" }, { status: 500 });
  }
}
