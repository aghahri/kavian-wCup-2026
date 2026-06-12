import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refreshMatchAfterScoreUpdate } from "@/lib/matches/match-refresh";
import { prisma } from "@/lib/prisma";

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
      homeTeamAr?: string | null;
      awayTeamAr?: string | null;
      stage?: string;
      stageEn?: string | null;
      stageAr?: string | null;
      kickoffAt?: Date;
      homeScore?: number | null;
      awayScore?: number | null;
      isFinished?: boolean;
    } = {};

    if (body.homeTeam !== undefined) data.homeTeam = String(body.homeTeam).trim();
    if (body.awayTeam !== undefined) data.awayTeam = String(body.awayTeam).trim();
    if (body.homeTeamFa !== undefined) data.homeTeamFa = String(body.homeTeamFa).trim();
    if (body.awayTeamFa !== undefined) data.awayTeamFa = String(body.awayTeamFa).trim();
    if (body.homeTeamAr !== undefined) data.homeTeamAr = body.homeTeamAr ? String(body.homeTeamAr).trim() : null;
    if (body.awayTeamAr !== undefined) data.awayTeamAr = body.awayTeamAr ? String(body.awayTeamAr).trim() : null;
    if (body.stage !== undefined) data.stage = String(body.stage).trim();
    if (body.stageEn !== undefined) data.stageEn = body.stageEn ? String(body.stageEn).trim() : null;
    if (body.stageAr !== undefined) data.stageAr = body.stageAr ? String(body.stageAr).trim() : null;
    if (body.kickoffAt !== undefined) data.kickoffAt = new Date(body.kickoffAt);
    if (body.homeScore !== undefined) data.homeScore = body.homeScore === null ? null : Number(body.homeScore);
    if (body.awayScore !== undefined) data.awayScore = body.awayScore === null ? null : Number(body.awayScore);
    if (body.isFinished !== undefined) data.isFinished = Boolean(body.isFinished);

    const match = await prisma.match.update({ where: { id }, data });

    const scoreChanged =
      body.homeScore !== undefined ||
      body.awayScore !== undefined ||
      body.isFinished !== undefined;

    if (scoreChanged) {
      await refreshMatchAfterScoreUpdate(id);
    }

    const refreshed = await prisma.match.findUnique({ where: { id } });
    return NextResponse.json({ match: refreshed ?? match });
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
