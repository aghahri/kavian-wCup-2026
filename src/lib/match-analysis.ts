import {
  analysisToDbFields,
  buildPredictionStats,
  generateFootballAnalysis,
} from "@/lib/ai/football-analysis";
import { getMatchStatus } from "@/lib/match-status";
import type { Match } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function fetchPredictionStats(match: Match) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId: match.id },
    select: { homeScore: true, awayScore: true },
  });
  return buildPredictionStats(predictions, match);
}

export async function regenerateMatchAnalysis(match: Match) {
  const stats = await fetchPredictionStats(match);
  const generated = generateFootballAnalysis(match, stats);
  const fields = analysisToDbFields(generated);

  return prisma.matchAnalysis.upsert({
    where: { matchId: match.id },
    create: { matchId: match.id, ...fields },
    update: fields,
  });
}

export async function getOrCreateMatchAnalysis(match: Match) {
  const phase = getMatchStatus(match.kickoffAt, match.isFinished);

  if (phase === "finished" || phase === "live") {
    return regenerateMatchAnalysis(match);
  }

  const existing = await prisma.matchAnalysis.findUnique({ where: { matchId: match.id } });
  if (existing) return existing;

  return regenerateMatchAnalysis(match);
}
