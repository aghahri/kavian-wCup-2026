import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "بازی پیدا نشد" }, { status: 404 });
    }

    const data: {
      homeTeam?: string;
      awayTeam?: string;
      homeTeamFa?: string;
      awayTeamFa?: string;
      stage?: string;
      kickoffAt?: Date;
      homeScore?: number | null;
      awayScore?: number | null;
      isFinished?: boolean;
    } = {};

    if (body.homeTeam !== undefined) data.homeTeam = String(body.homeTeam).trim();
    if (body.awayTeam !== undefined) data.awayTeam = String(body.awayTeam).trim();
    if (body.homeTeamFa !== undefined) data.homeTeamFa = String(body.homeTeamFa).trim();
    if (body.awayTeamFa !== undefined) data.awayTeamFa = String(body.awayTeamFa).trim();
    if (body.stage !== undefined) data.stage = String(body.stage).trim();
    if (body.kickoffAt !== undefined) data.kickoffAt = new Date(body.kickoffAt);
    if (body.homeScore !== undefined) data.homeScore = body.homeScore === null ? null : Number(body.homeScore);
    if (body.awayScore !== undefined) data.awayScore = body.awayScore === null ? null : Number(body.awayScore);
    if (body.isFinished !== undefined) data.isFinished = Boolean(body.isFinished);

    const match = await prisma.match.update({ where: { id }, data });

    if (match.isFinished && match.homeScore !== null && match.awayScore !== null) {
      const predictions = await prisma.prediction.findMany({ where: { matchId: id } });
      await Promise.all(
        predictions.map((prediction) =>
          prisma.prediction.update({
            where: { id: prediction.id },
            data: {
              points: calculatePoints(
                prediction.homeScore,
                prediction.awayScore,
                match.homeScore!,
                match.awayScore!
              ),
            },
          })
        )
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در ویرایش بازی" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در حذف بازی" }, { status: 500 });
  }
}
