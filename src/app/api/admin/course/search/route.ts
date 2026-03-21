import { NextRequest, NextResponse } from "next/server";

function checkAuth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

interface SearchCourse {
  id: string;
  club_name: string;
  course_name: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Search query required" }, { status: 400 });
  }

  const apiKey = process.env.GOLF_COURSE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Golf course API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Key ${apiKey}` } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Golf course API search error:", res.status, text);
      return NextResponse.json({ error: "Course search failed" }, { status: 502 });
    }

    const data = await res.json();

    // The API returns an object keyed by course ID, or an array — normalize both
    let rawCourses: SearchCourse[] = [];
    if (Array.isArray(data.courses)) {
      rawCourses = data.courses;
    } else if (data.courses && typeof data.courses === "object") {
      // courses is an object keyed by ID: { "abc123": { id, club_name, ... } }
      rawCourses = Object.values(data.courses);
    } else if (Array.isArray(data)) {
      rawCourses = data;
    }

    const courses = rawCourses.map((c) => ({
      id: c.id,
      clubName: c.club_name || "",
      courseName: c.course_name || "",
      city: c.location?.city || "",
      state: c.location?.state || "",
      country: c.location?.country || "",
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Golf course API error:", error);
    return NextResponse.json({ error: "Failed to search courses" }, { status: 500 });
  }
}
