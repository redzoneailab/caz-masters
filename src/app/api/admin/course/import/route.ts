import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// API response shape from golfcourseapi.com:
//
// GET /v1/courses/{id} → { course: { id, club_name, course_name, location, tees } }
//
// tees: {
//   male: [{ tee_name: "White", holes: [{ par: 4, yardage: 357, handicap: 13 }, ...] }, ...],
//   female: [{ tee_name: "Red", holes: [{ par: 5, yardage: 440, handicap: 10 }, ...] }, ...]
// }
//
// Holes are positional arrays — NO hole_number field. Index 0 = hole 1.
// Same tee_name can appear in both male and female with DIFFERENT par values
// (e.g., "White" male par 4 vs "White" female par 5 on same hole).

interface ApiHole {
  par: number;
  yardage: number | null;
  handicap?: number | null;
}

interface ApiTeeSet {
  tee_name: string;
  colour?: string;
  number_of_holes?: number;
  par_total?: number;
  total_yards?: number;
  holes: ApiHole[];
}

/**
 * Flatten the gender-split tee structure into:
 *   holeNumber -> teeBoxName -> { par, yardage }
 *
 * Hole number is derived from array index (0-based → 1-based).
 * If the same tee_name appears in both male and female with different
 * par/yardage on any hole, the female version gets a " (W)" suffix.
 */
function buildHoleMap(
  tees: { male?: ApiTeeSet[]; female?: ApiTeeSet[] }
): Map<number, Map<string, { par: number; yardage: number | null }>> {
  const holeMap = new Map<number, Map<string, { par: number; yardage: number | null }>>();

  function processTeeSet(teeSet: ApiTeeSet, nameOverride?: string) {
    const teeName = nameOverride || teeSet.tee_name || teeSet.colour || "Default";
    for (let i = 0; i < teeSet.holes.length; i++) {
      const h = teeSet.holes[i];
      const holeNumber = i + 1;
      let holeTees = holeMap.get(holeNumber);
      if (!holeTees) {
        holeTees = new Map();
        holeMap.set(holeNumber, holeTees);
      }
      if (!holeTees.has(teeName)) {
        holeTees.set(teeName, { par: h.par, yardage: h.yardage ?? null });
      }
    }
  }

  // Collect male tee names for collision detection
  const maleNames = new Set((tees.male || []).map((t) => t.tee_name || t.colour || "Default"));

  // Process male tees first
  for (const ts of tees.male || []) processTeeSet(ts);

  // Process female tees — rename if colliding with male AND data differs
  for (const ts of tees.female || []) {
    const femaleName = ts.tee_name || ts.colour || "Default";
    if (maleNames.has(femaleName)) {
      // Check if any hole differs between this female tee and the already-inserted male version
      const differs = ts.holes.some((fh, i) => {
        const holeNumber = i + 1;
        const existing = holeMap.get(holeNumber)?.get(femaleName);
        return existing && (existing.par !== fh.par || existing.yardage !== (fh.yardage ?? null));
      });
      if (differs) {
        processTeeSet(ts, `${femaleName} (W)`);
      }
      // If identical, skip — the male version already covers it
    } else {
      processTeeSet(ts);
    }
  }

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

    const data = await res.json();

    // Detail endpoint wraps in { course: {...} }
    const c = data.course || data;
    if (!c || !c.tees) {
      console.error("Golf course API: unexpected response shape, keys:", Object.keys(data));
      return NextResponse.json({ error: "Invalid course data returned" }, { status: 502 });
    }

    const courseName = [c.club_name, c.course_name].filter(Boolean).join(" — ") || "Imported Course";
    // Deduplicate if club_name and course_name are the same
    const dedupedName = c.club_name === c.course_name
      ? c.club_name || "Imported Course"
      : courseName;
    const city = c.location?.city || null;
    const state = c.location?.state || null;

    const holeMap = buildHoleMap(c.tees);

    if (holeMap.size === 0) {
      console.error("Golf course API: buildHoleMap returned empty. tees keys:", Object.keys(c.tees),
        "male count:", c.tees.male?.length, "female count:", c.tees.female?.length);
      return NextResponse.json({ error: "No hole data found for this course" }, { status: 400 });
    }

    // Convert map to sorted array
    const holes = Array.from(holeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([holeNumber, tees]) => ({
        holeNumber,
        teeBoxes: Array.from(tees.entries()).map(([name, d]) => ({
          name,
          par: d.par,
          yardage: d.yardage,
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
        name: dedupedName,
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
