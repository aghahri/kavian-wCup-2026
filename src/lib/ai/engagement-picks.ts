import type { Match } from "@prisma/client";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import { RISK_LABELS } from "@/lib/ai/football-analysis";
import { getMatchStatus } from "@/lib/match-status";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export type EngagementPick = {
  match: Match;
  homeWinPct: number;
  awayWinPct: number;
  drawPct: number;
  riskLevel: string;
  suggestedHomeScore: number;
  suggestedAwayScore: number;
  tag: "pickOfDay" | "upsetRisk" | "safest";
};

function riskLabel(level: string, locale: Locale): string {
  const r = RISK_LABELS[level as keyof typeof RISK_LABELS];
  return locale === "fa" ? r.fa : locale === "ar" ? r.ar : r.en;
}

export async function buildEngagementPicks(locale: Locale) {
  const matches = await prisma.match.findMany({
    where: { isFinished: false },
    orderBy: { kickoffAt: "asc" },
    take: 12,
  });

  const upcoming = matches.filter((m) => getMatchStatus(m.kickoffAt, m.isFinished) === "upcoming");
  if (upcoming.length === 0) return null;

  const analyzed = await Promise.all(
    upcoming.map(async (match) => ({
      match,
      analysis: await getOrCreateMatchAnalysis(match),
    }))
  );

  const pickOfDay = analyzed[0];
  const upsetRisk = [...analyzed].sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 };
    return (
      (riskOrder[b.analysis.riskLevel as keyof typeof riskOrder] ?? 0) -
      (riskOrder[a.analysis.riskLevel as keyof typeof riskOrder] ?? 0)
    );
  })[0];
  const safest = [...analyzed].sort((a, b) => {
    const gapA = Math.abs(a.analysis.homeWinPct - a.analysis.awayWinPct);
    const gapB = Math.abs(b.analysis.homeWinPct - b.analysis.awayWinPct);
    return gapB - gapA;
  })[0];

  return {
    pickOfDay: {
      match: pickOfDay.match,
      homeWinPct: pickOfDay.analysis.homeWinPct,
      awayWinPct: pickOfDay.analysis.awayWinPct,
      drawPct: pickOfDay.analysis.drawPct,
      riskLevel: pickOfDay.analysis.riskLevel,
      suggestedHomeScore: pickOfDay.analysis.suggestedHomeScore,
      suggestedAwayScore: pickOfDay.analysis.suggestedAwayScore,
      tag: "pickOfDay" as const,
      riskLabel: riskLabel(pickOfDay.analysis.riskLevel, locale),
    },
    upsetRisk: {
      match: upsetRisk.match,
      homeWinPct: upsetRisk.analysis.homeWinPct,
      awayWinPct: upsetRisk.analysis.awayWinPct,
      drawPct: upsetRisk.analysis.drawPct,
      riskLevel: upsetRisk.analysis.riskLevel,
      suggestedHomeScore: upsetRisk.analysis.suggestedHomeScore,
      suggestedAwayScore: upsetRisk.analysis.suggestedAwayScore,
      tag: "upsetRisk" as const,
      riskLabel: riskLabel(upsetRisk.analysis.riskLevel, locale),
    },
    safest: {
      match: safest.match,
      homeWinPct: safest.analysis.homeWinPct,
      awayWinPct: safest.analysis.awayWinPct,
      drawPct: safest.analysis.drawPct,
      riskLevel: safest.analysis.riskLevel,
      suggestedHomeScore: safest.analysis.suggestedHomeScore,
      suggestedAwayScore: safest.analysis.suggestedAwayScore,
      tag: "safest" as const,
      riskLabel: riskLabel(safest.analysis.riskLevel, locale),
    },
  };
}
