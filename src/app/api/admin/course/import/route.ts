import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT } from "@/lib/tournament";
import type { TeeAssignments } from "@/lib/tees";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

// API response shape from golfcourseapi.com:
//
// GET /v1/courses/{id} → { course: { id, club_name, course_name, location, tees } }
//
// Holes are positional arrays — NO hole_number field. Index 0 = hole 1.
//
// Tee names can be compound "Front/Back" for 9-hole courses played as 18:
//   "White/Red"    → White tees for holes 1-9, Red tees for holes 10-18
//   "Yellow/Yellow" → Yellow tees for all 18 holes

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
 * Split a compound tee name like "White/Red" into front/back names.
 * Returns null if not a compound name.
 */
function splitTeeName(name: string): { front: string; back: string } | null {
  if (!name.includes("/")) return null;
  const [front, back] = name.split("/", 2);
  if (!front || !back) return null;
  return { front: front.trim(), back: back.trim() };
}

/**
 * Flatten the gender-split tee structure into:
 *   holeNumber -> teeBoxName -> { par, yardage }
 *
 * Handles compound tee names (e.g., "White/Red") by splitting them:
 * the first name applies to holes 1 through halfPoint, the second
 * name to holes halfPoint+1 through totalHoles.
 */
function buildHoleMap(
  tees: { male?: ApiTeeSet[]; female?: ApiTeeSet[] }
): Map<number, Map<string, { par: number; yardage: number | null }>> {
  const holeMap = new Map<number, Map<string, { par: number; yardage: number | null }>>();

  function addHoleEntry(holeNumber: number, teeName: string, par: number, yardage: number | null) {
    let holeTees = holeMap.get(holeNumber);
    if (!holeTees) {
      holeTees = new Map();
      holeMap.set(holeNumber, holeTees);
    }
    // First writer wins
    if (!holeTees.has(teeName)) {
      holeTees.set(teeName, { par, yardage });
    }
  }

  function processTeeSet(teeSet: ApiTeeSet, nameOverride?: string) {
    const rawName = nameOverride || teeSet.tee_name || teeSet.colour || "Default";
    const split = splitTeeName(rawName);
    const totalHoles = teeSet.holes.length;
    const halfPoint = Math.ceil(totalHoles / 2);

    for (let i = 0; i < totalHoles; i++) {
      const h = teeSet.holes[i];
      const holeNumber = i + 1;

      let teeName: string;
      if (split) {
        // Compound name: front half gets first name, back half gets second
        teeName = holeNumber <= halfPoint ? split.front : split.back;
      } else {
        teeName = rawName;
      }

      addHoleEntry(holeNumber, teeName, h.par, h.yardage ?? null);
    }
  }

  // Collect male tee names (raw) for collision detection
  const maleNames = new Set((tees.male || []).map((t) => t.tee_name || t.colour || "Default"));

  // Process male tees first
  for (const ts of tees.male || []) processTeeSet(ts);

  // Process female tees — rename if colliding with male AND data differs
  for (const ts of tees.female || []) {
    const femaleName = ts.tee_name || ts.colour || "Default";
    if (maleNames.has(femaleName)) {
      // Check if any hole differs between this female tee and the already-inserted male version
      // We need to compare using the RESOLVED name (after splitting)
      const split = splitTeeName(femaleName);
      const totalHoles = ts.holes.length;
      const halfPoint = Math.ceil(totalHoles / 2);

      const differs = ts.holes.some((fh, i) => {
        const holeNumber = i + 1;
        const resolvedName = split
          ? (holeNumber <= halfPoint ? split.front : split.back)
          : femaleName;
        const existing = holeMap.get(holeNumber)?.get(resolvedName);
        return existing && (existing.par !== fh.par || existing.yardage !== (fh.yardage ?? null));
      });
      if (differs) {
        // Add (W) suffix to the split names
        if (split) {
          const wFront = split.front === split.back ? `${split.front} (W)` : `${split.front} (W)`;
          const wBack = split.front === split.back ? `${split.back} (W)` : `${split.back} (W)`;
          const wName = `${wFront}/${wBack}`;
          processTeeSet(ts, wName);
        } else {
          processTeeSet(ts, `${femaleName} (W)`);
        }
      }
      // If identical, skip — the male version already covers it
    } else {
      processTeeSet(ts);
    }
  }

  return holeMap;
}

/**
 * After importing a course with split tee names, auto-configure tee assignments.
 * Detects front/back tee patterns and sets up Men/Women flight defaults.
 */
function buildAutoTeeAssignments(
  allTeeNames: string[],
  numHoles: number,
  holeMap: Map<number, Map<string, { par: number; yardage: number | null }>>
): TeeAssignments | null {
  if (allTeeNames.length <= 1) return null;

  // Find tees that only appear on front 9 or back 9 (from split compound names)
  const halfPoint = Math.ceil(numHoles / 2);
  const frontOnlyTees = new Set<string>();
  const backOnlyTees = new Set<string>();

  for (const teeName of allTeeNames) {
    let onFront = false;
    let onBack = false;
    for (const [holeNum, holeTees] of holeMap) {
      if (holeTees.has(teeName)) {
        if (holeNum <= halfPoint) onFront = true;
        else onBack = true;
      }
    }
    if (onFront && !onBack) frontOnlyTees.add(teeName);
    if (onBack && !onFront) backOnlyTees.add(teeName);
  }

  // If we have front/back split tees, auto-assign them for Men
  // and find a tee that spans all holes for Women
  const assignments: TeeAssignments = {};

  if (frontOnlyTees.size > 0 && backOnlyTees.size > 0) {
    // Men: use first front-only tee as default, override back 9 with first back-only tee
    const menFront = Array.from(frontOnlyTees)[0];
    const menBack = Array.from(backOnlyTees)[0];
    const holeOverrides: Record<string, string> = {};
    for (let h = halfPoint + 1; h <= numHoles; h++) {
      holeOverrides[String(h)] = menBack;
    }
    assignments["Men"] = { default: menFront, holes: holeOverrides };
  }

  // Women: find a tee that exists on all holes (from "Yellow/Yellow" → "Yellow" on all)
  const allHoleTees = allTeeNames.filter((name) => {
    for (let h = 1; h <= numHoles; h++) {
      if (!holeMap.get(h)?.has(name)) return false;
    }
    return true;
  });

  // Prefer a tee not used by Men
  const menDefault = assignments["Men"]?.default;
  const menBack = Object.values(assignments["Men"]?.holes || {})[0];
  const womenTee = allHoleTees.find((t) => t !== menDefault && t !== menBack) || allHoleTees[0];
  if (womenTee) {
    assignments["Women"] = { default: womenTee, holes: {} };
  }

  return Object.keys(assignments).length > 0 ? assignments : null;
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

    // Collect all unique tee names for auto-assignment
    const allTeeNames = [...new Set(holes.flatMap((h) => h.teeBoxes.map((t) => t.name)))].sort();

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

    // Auto-configure tee assignments based on split pattern
    const autoAssignments = buildAutoTeeAssignments(allTeeNames, holes.length, holeMap);

    // Link to tournament and set numHoles + auto tee assignments
    if (tournament) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { courseId: course.id, numHoles: holes.length };
      if (autoAssignments) updateData.teeAssignments = autoAssignments;
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: updateData,
      });
    }

    return NextResponse.json({ course, teeAssignments: autoAssignments }, { status: 201 });
  } catch (error) {
    console.error("Course import error:", error);
    return NextResponse.json({ error: "Failed to import course" }, { status: 500 });
  }
}
