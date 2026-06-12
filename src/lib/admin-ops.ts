import { prisma } from "@/lib/prisma";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminOpsStats() {
  const today = startOfToday();

  const [
    needsScore,
    recentlyFinished,
    aiCount,
    leaguesToday,
    otpToday,
    otpSuccessToday,
    referralClicks,
    referralVerified,
  ] = await Promise.all([
    prisma.match.count({
      where: {
        kickoffAt: { lt: new Date() },
        isFinished: false,
      },
    }),
    prisma.match.findMany({
      where: { isFinished: true },
      orderBy: { kickoffAt: "desc" },
      take: 8,
      select: { id: true, homeTeamFa: true, awayTeamFa: true, homeScore: true, awayScore: true },
    }),
    prisma.matchAnalysis.count(),
    prisma.privateLeague.count({ where: { createdAt: { gte: today } } }),
    prisma.otpChallenge.count({ where: { createdAt: { gte: today } } }),
    prisma.otpChallenge.count({
      where: { createdAt: { gte: today }, providerStatus: { contains: "verify:success" } },
    }),
    prisma.referralClick.count(),
    prisma.referralClick.count({ where: { verified: true } }),
  ]);

  return {
    needsScore,
    recentlyFinished,
    aiCount,
    leaguesToday,
    otpToday,
    otpSuccessRate: otpToday > 0 ? Math.round((otpSuccessToday / otpToday) * 100) : 0,
    referralClicks,
    referralVerified,
  };
}
