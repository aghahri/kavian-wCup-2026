import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const prefs = await prisma.userNotificationPrefs.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    return NextResponse.json({ prefs }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const update: {
      matchReminders?: boolean;
      leagueUpdates?: boolean;
      predictionResults?: boolean;
    } = {};
    if (body.matchReminders !== undefined) update.matchReminders = Boolean(body.matchReminders);
    if (body.leagueUpdates !== undefined) update.leagueUpdates = Boolean(body.leagueUpdates);
    if (body.predictionResults !== undefined) {
      update.predictionResults = Boolean(body.predictionResults);
    }

    const prefs = await prisma.userNotificationPrefs.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        matchReminders: update.matchReminders ?? true,
        leagueUpdates: update.leagueUpdates ?? true,
        predictionResults: update.predictionResults ?? true,
      },
      update,
    });

    return NextResponse.json({ prefs }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
