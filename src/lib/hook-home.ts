import { buildEngagementPicks } from "@/lib/ai/engagement-picks";
import { buildCrowdData } from "@/lib/crowd-predictions";
import { getOrGenerateDailyRecap } from "@/lib/daily-recap";
import { getFootballIqRanks } from "@/lib/football-iq";
import { getGrowthBanners } from "@/lib/growth-loop";
import { getMissionProgress } from "@/lib/missions";
import { getSecondChanceStats } from "@/lib/second-chance";
import { getUserStreak } from "@/lib/streak-engine";
import { levelTitle } from "@/lib/xp-levels";
import { buildLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";
import type { User } from "@prisma/client";

export async function getHomeHookData(locale: Locale, user: User | null) {
  const [
    nextMatch,
    secondChance,
    engagement,
    crowd,
    recap,
    topPlayers,
    banners,
    recentFinished,
  ] = await Promise.all([
    prisma.match.findFirst({
      where: { isFinished: false },
      orderBy: { kickoffAt: "asc" },
    }),
    getSecondChanceStats(),
    buildEngagementPicks(locale),
    buildCrowdData(locale),
    getOrGenerateDailyRecap(locale),
    buildLeaderboard({ period: "global", limit: 5 }),
    getGrowthBanners(user, locale),
    prisma.match.findMany({
      where: { isFinished: true },
      orderBy: { kickoffAt: "desc" },
      take: 4,
    }),
  ]);

  let footballIq = null;
  let streak = null;
  let missions = null;
  let myLeagues: { code: string; title: string }[] = [];
  let userLevel = null;

  if (user) {
    const [iq, st, ms, leagues] = await Promise.all([
      getFootballIqRanks(user.id),
      getUserStreak(user.id),
      getMissionProgress(user.id),
      prisma.privateLeagueMember.findMany({
        where: { userId: user.id },
        take: 3,
        include: { league: { select: { code: true, title: true } } },
      }),
    ]);
    footballIq = iq;
    streak = st;
    missions = ms;
    myLeagues = leagues.map((l) => l.league);
    userLevel = {
      level: user.userLevel,
      xp: user.xp,
      title: levelTitle(user.userLevel, locale),
    };
  }

  return {
    nextMatch,
    secondChance,
    engagement,
    crowdPreview: crowd.upcoming[0] ?? null,
    recap,
    topPlayers,
    banners,
    footballIq,
    streak,
    missions,
    myLeagues,
    userLevel,
    recentFinished,
  };
}
