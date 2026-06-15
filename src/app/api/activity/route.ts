import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { completeMission } from "@/lib/missions";
import { recordUserActivity, type ActivityType } from "@/lib/streak-engine";

const VALID: ActivityType[] = [
  "league_visit",
  "recap_view",
  "ai_visit",
  "daily_challenge",
  "prediction",
  "mission",
];

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const type = String(body.type ?? "") as ActivityType;
    if (!VALID.includes(type)) {
      return NextResponse.json({ error: "INVALID" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await recordUserActivity(user.id, type);

    if (type === "ai_visit") await completeMission(user.id, "visit_ai");
    if (type === "recap_view") await completeMission(user.id, "share_result");

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
