import { NextResponse } from "next/server";

// Donation endpoint is temporarily disabled while the donate page is deactivated.
// Original implementation preserved in git history.
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
