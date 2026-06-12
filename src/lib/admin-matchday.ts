import { prisma } from "@/lib/prisma";
import { getMatchStatus } from "@/lib/match-status";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getMatchdayStats() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const now = new Date();

  const [matchesToday, missingScores, recentlyFinished, allToday] = await Promise.all([
    prisma.match.findMany({
      where: { kickoffAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { kickoffAt: "asc" },
      select: {
        id: true,
        homeTeamFa: true,
        awayTeamFa: true,
        kickoffAt: true,
        homeScore: true,
        awayScore: true,
        isFinished: true,
        predictionLockOverride: true,
      },
    }),
    prisma.match.count({
      where: { kickoffAt: { lt: now }, isFinished: false },
    }),
    prisma.match.findMany({
      where: { isFinished: true },
      orderBy: { kickoffAt: "desc" },
      take: 8,
      select: { id: true, homeTeamFa: true, awayTeamFa: true, homeScore: true, awayScore: true },
    }),
    prisma.match.findMany({
      where: { kickoffAt: { gte: todayStart, lte: todayEnd } },
      select: { id: true, kickoffAt: true, isFinished: true },
    }),
  ]);

  const needsAiRefresh: string[] = [];
  for (const m of allToday) {
    const status = getMatchStatus(m.kickoffAt, m.isFinished);
    if (status === "finished" || status === "live") {
      const analysis = await prisma.matchAnalysis.findUnique({ where: { matchId: m.id } });
      if (!analysis) needsAiRefresh.push(m.id);
    }
  }

  const startedUnlocked = await prisma.match.findMany({
    where: {
      kickoffAt: { lte: now },
      isFinished: false,
      OR: [{ predictionLockOverride: null }, { predictionLockOverride: "open" }],
    },
    select: { id: true, homeTeamFa: true, awayTeamFa: true },
  });

  return {
    matchesToday,
    missingScores,
    recentlyFinished,
    needsAiRefresh: needsAiRefresh.length,
    needsAiRefreshIds: needsAiRefresh,
    startedUnlocked,
  };
}

export async function closePredictionsForStartedMatches(): Promise<number> {
  const now = new Date();
  const result = await prisma.match.updateMany({
    where: {
      kickoffAt: { lte: now },
      isFinished: false,
      OR: [{ predictionLockOverride: null }, { predictionLockOverride: "open" }],
    },
    data: { predictionLockOverride: "closed" },
  });
  return result.count;
}
