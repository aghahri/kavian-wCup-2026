import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { getOrCreateTodayChallenge, todayDateKey, updateUserDailyStreak } from "@/lib/daily-challenge";
import { recordUserActivity } from "@/lib/streak-engine";
import { isPredictionOpen } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const challenge = await getOrCreateTodayChallenge();
  if (!challenge) {
    return NextResponse.json({ challenge: null }, { headers: NO_STORE_HEADERS });
  }
  return NextResponse.json({ challenge }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const challengeId = String(body.challengeId ?? "");
    const homeScore = Number(body.homeScore);
    const awayScore = Number(body.awayScore);
    const firstGoalTeam = String(body.firstGoalTeam ?? "home");
    const winnerPick = String(body.winnerPick ?? "home");

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: { match: true },
    });
    if (!challenge || !challenge.isActive) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (
      !isPredictionOpen(
        challenge.match.kickoffAt,
        challenge.match.isFinished,
        challenge.match.predictionLockOverride
      )
    ) {
      return NextResponse.json({ error: "CLOSED" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const validFirst = ["home", "away", "none"];
    const validWinner = ["home", "away", "draw"];
    if (!validFirst.includes(firstGoalTeam) || !validWinner.includes(winnerPick)) {
      return NextResponse.json({ error: "INVALID" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const entry = await prisma.dailyChallengeEntry.upsert({
      where: { challengeId_userId: { challengeId, userId: user.id } },
      create: {
        challengeId,
        userId: user.id,
        homeScore,
        awayScore,
        firstGoalTeam,
        winnerPick,
      },
      update: { homeScore, awayScore, firstGoalTeam, winnerPick },
    });

    await updateUserDailyStreak(user.id, todayDateKey());
    await recordUserActivity(user.id, "daily_challenge");

    return NextResponse.json({ entry }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
