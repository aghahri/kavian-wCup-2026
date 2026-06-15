import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { detectProvider, normalizeYouTubeUrlToEmbed } from "@/lib/highlights";
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
      predictionLockOverride?: string | null;
      scoreSourceName?: string | null;
      scoreSourceUrl?: string | null;
      scoreVerifiedAt?: Date | null;
      externalMatchId?: string | null;
      highlightsUrl?: string | null;
      highlightsProvider?: string | null;
      highlightsEmbedUrl?: string | null;
      markVerified?: boolean;
      autoFinish?: boolean;
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
    if (body.predictionLockOverride !== undefined) {
      const v = body.predictionLockOverride;
      data.predictionLockOverride =
        v === null || v === "" ? null : v === "open" || v === "closed" ? v : null;
    }
    if (body.scoreSourceName !== undefined) {
      data.scoreSourceName = body.scoreSourceName ? String(body.scoreSourceName).trim() : null;
    }
    if (body.scoreSourceUrl !== undefined) {
      data.scoreSourceUrl = body.scoreSourceUrl ? String(body.scoreSourceUrl).trim() : null;
    }
    if (body.externalMatchId !== undefined) {
      data.externalMatchId = body.externalMatchId ? String(body.externalMatchId).trim() : null;
    }
    if (body.highlightsUrl !== undefined) {
      data.highlightsUrl = body.highlightsUrl ? String(body.highlightsUrl).trim() : null;
    }
    if (body.highlightsProvider !== undefined) {
      data.highlightsProvider = body.highlightsProvider ? String(body.highlightsProvider).trim() : null;
    }
    if (body.highlightsEmbedUrl !== undefined) {
      data.highlightsEmbedUrl = body.highlightsEmbedUrl ? String(body.highlightsEmbedUrl).trim() : null;
    }
    if (body.markVerified === true) {
      data.scoreVerifiedAt = new Date();
    } else if (body.scoreVerifiedAt === null) {
      data.scoreVerifiedAt = null;
    }

    const homeScore = body.homeScore !== undefined ? (body.homeScore === null ? null : Number(body.homeScore)) : existing.homeScore;
    const awayScore = body.awayScore !== undefined ? (body.awayScore === null ? null : Number(body.awayScore)) : existing.awayScore;

    if (
      body.autoFinish === true &&
      homeScore !== null &&
      awayScore !== null &&
      body.isFinished !== false
    ) {
      data.isFinished = true;
      if (data.homeScore === undefined) data.homeScore = homeScore;
      if (data.awayScore === undefined) data.awayScore = awayScore;
    }

    const hlUrl = body.highlightsUrl !== undefined ? body.highlightsUrl : existing.highlightsUrl;
    const hlEmbed = body.highlightsEmbedUrl !== undefined ? body.highlightsEmbedUrl : existing.highlightsEmbedUrl;
    const hlCandidate = hlEmbed || hlUrl;
    if (hlCandidate && (body.highlightsUrl !== undefined || body.highlightsEmbedUrl !== undefined)) {
      const provider = detectProvider(String(hlCandidate));
      data.highlightsProvider = provider === "unknown" ? existing.highlightsProvider : provider;
      const normalized = normalizeYouTubeUrlToEmbed(String(hlCandidate));
      if (normalized && provider === "youtube") {
        data.highlightsEmbedUrl = normalized;
      }
    }

    const match = await prisma.match.update({ where: { id }, data });

    const scoreChanged =
      body.homeScore !== undefined ||
      body.awayScore !== undefined ||
      body.isFinished !== undefined;

    if (scoreChanged) {
      await refreshMatchAfterScoreUpdate(id);
    }

    const refreshed = await prisma.match.findUnique({ where: { id } });
    return NextResponse.json({
      match: refreshed ?? match,
      refreshed: scoreChanged,
    });
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
