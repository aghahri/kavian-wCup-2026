import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { closePredictionsForStartedMatches } from "@/lib/admin-matchday";

export async function POST() {
  try {
    await requireAdmin();
    const count = await closePredictionsForStartedMatches();
    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
