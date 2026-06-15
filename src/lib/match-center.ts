import type { MatchAnalysis, MatchEvent } from "@prisma/client";
import {
  buildPredictionStats,
  getLocalizedReasoning,
  RISK_LABELS,
  SURPRISE_LABELS,
} from "@/lib/ai/football-analysis";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import { buildMatchSummary } from "@/lib/match-summary";
import { getCrowdForMatch } from "@/lib/crowd-predictions";
import { resolveHighlightsEmbed } from "@/lib/highlights";
import { getAwayTeamName, getHomeTeamName, getStageName } from "@/lib/match-i18n";
import { getMatchDisplayState, hasMatchScore } from "@/lib/match-status";
import { isPredictionOpen } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔄",
  var: "📺",
  kickoff: "🏁",
  halftime: "⏸️",
  fulltime: "🏁",
};

export function eventDescription(event: MatchEvent, locale: Locale): string {
  if (locale === "en" && event.descriptionEn) return event.descriptionEn;
  if (locale === "ar" && event.descriptionAr) return event.descriptionAr;
  if (event.descriptionFa) return event.descriptionFa;
  const parts: string[] = [];
  if (event.playerName) parts.push(event.playerName);
  if (event.teamName) parts.push(`— ${event.teamName}`);
  return parts.join(" ") || event.type;
}

export async function buildMatchCenterData(matchId: string, locale: Locale) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      events: { orderBy: [{ minute: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!match) return null;

  const displayState = getMatchDisplayState(match);
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { homeScore: true, awayScore: true },
  });
  const stats = buildPredictionStats(predictions, match);

  let analysis: MatchAnalysis | null = null;
  if (displayState === "upcoming") {
    analysis = await getOrCreateMatchAnalysis(match);
  } else if (displayState === "finished_unverified" || displayState === "finished_verified") {
    analysis = await getOrCreateMatchAnalysis(match);
  }

  const crowd = await getCrowdForMatch(match);
  const summary =
    displayState === "finished_unverified" || displayState === "finished_verified"
      ? await buildMatchSummary(match, locale)
      : null;

  const homeName = getHomeTeamName(match, locale);
  const awayName = getAwayTeamName(match, locale);
  const stage = getStageName(match, locale);

  let winnerLabel = "";
  if (match.homeScore !== null && match.awayScore !== null) {
    if (match.homeScore > match.awayScore) winnerLabel = homeName;
    else if (match.awayScore > match.homeScore) winnerLabel = awayName;
    else winnerLabel = locale === "fa" ? "مساوی" : locale === "ar" ? "تعادل" : "Draw";
  }

  const risk = analysis
    ? RISK_LABELS[analysis.riskLevel as keyof typeof RISK_LABELS]
    : RISK_LABELS.medium;
  const riskLabel = locale === "fa" ? risk.fa : locale === "ar" ? risk.ar : risk.en;

  const surpriseLevel =
    hasMatchScore(match) && stats.wrongPct >= 70
      ? "high"
      : hasMatchScore(match) && stats.wrongPct >= 45
        ? "medium"
        : "low";
  const surprise = SURPRISE_LABELS[surpriseLevel];
  const surpriseLabel = locale === "fa" ? surprise.fa : locale === "ar" ? surprise.ar : surprise.en;

  const reasoning = analysis ? getLocalizedReasoning(analysis, locale) : [];
  const lessonLine =
    (displayState === "finished_unverified" || displayState === "finished_verified") &&
    reasoning.length > 4
      ? reasoning[reasoning.length - 1]
      : null;
  const mainReasoning = lessonLine ? reasoning.slice(0, -1) : reasoning;

  const embedUrl = resolveHighlightsEmbed(match.highlightsEmbedUrl, match.highlightsUrl);
  const goalEvents = match.events.filter((e) => e.type === "goal");

  return {
    match,
    displayState,
    homeName,
    awayName,
    stage,
    winnerLabel,
    stats,
    analysis,
    crowd,
    summary,
    riskLabel,
    surpriseLabel,
    reasoning: mainReasoning,
    lessonLine,
    embedUrl,
    goalEvents,
    predictionOpen: isPredictionOpen(match.kickoffAt, match.isFinished, match.predictionLockOverride),
    isVerified: displayState === "finished_verified",
    hasHighlights: Boolean(embedUrl || match.highlightsUrl),
    aiUpdated: Boolean(match.aiRefreshedAt),
  };
}

export type MatchCenterData = NonNullable<Awaited<ReturnType<typeof buildMatchCenterData>>>;
