import { regenerateMatchAnalysis } from "@/lib/match-analysis";
import { syncUserBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

async function recalculateMatchPredictions(matchId: string, homeScore: number, awayScore: number) {
  const predictions = await prisma.prediction.findMany({ where: { matchId } });

  await Promise.all(
    predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: { points: calculatePoints(p.homeScore, p.awayScore, homeScore, awayScore) },
      })
    )
  );

  const tournamentPredictions = await prisma.tournamentPrediction.findMany({ where: { matchId } });

  await Promise.all(
    tournamentPredictions.map((p) =>
      prisma.tournamentPrediction.update({
        where: { id: p.id },
        data: { points: calculatePoints(p.homeScore, p.awayScore, homeScore, awayScore) },
      })
    )
  );

  return predictions.map((p) => p.userId);
}

/** Recalculate points, AI analysis, and badges after admin score/status change. */
export async function refreshMatchAfterScoreUpdate(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  let affectedUserIds: string[] = [];

  if (match.isFinished && match.homeScore !== null && match.awayScore !== null) {
    affectedUserIds = await recalculateMatchPredictions(matchId, match.homeScore, match.awayScore);
  }

  await regenerateMatchAnalysis(match);

  const uniqueUsers = [...new Set(affectedUserIds)];
  await Promise.all(uniqueUsers.map((userId) => syncUserBadges(userId)));
}

export async function refreshAllFinishedMatches(): Promise<number> {
  const finished = await prisma.match.findMany({
    where: { isFinished: true, homeScore: { not: null }, awayScore: { not: null } },
    select: { id: true },
  });

  for (const { id } of finished) {
    await refreshMatchAfterScoreUpdate(id);
  }

  return finished.length;
}
