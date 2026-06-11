import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isPredictionOpen } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const matchId = String(body.matchId ?? "");
    const homeScore = Number(body.homeScore);
    const awayScore = Number(body.awayScore);

    if (!matchId) {
      return NextResponse.json({ error: "بازی انتخاب نشده" }, { status: 400 });
    }

    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0 ||
      homeScore > 20 ||
      awayScore > 20
    ) {
      return NextResponse.json({ error: "امتیاز نامعتبر است" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "بازی پیدا نشد" }, { status: 404 });
    }

    if (!isPredictionOpen(match.kickoffAt, match.isFinished)) {
      return NextResponse.json({ error: "زمان پیش‌بینی این بازی تمام شده" }, { status: 400 });
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: { userId: user.id, matchId },
      },
      update: { homeScore, awayScore },
      create: { userId: user.id, matchId, homeScore, awayScore },
    });

    return NextResponse.json({ prediction });
  } catch {
    return NextResponse.json({ error: "خطا در ثبت پیش‌بینی" }, { status: 500 });
  }
}
