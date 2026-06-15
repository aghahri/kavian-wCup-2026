import { cache } from "react";
import { buildEngagementPicks } from "@/lib/ai/engagement-picks";
import { buildCrowdData } from "@/lib/crowd-predictions";
import { getOrGenerateDailyRecap } from "@/lib/daily-recap";
import { buildLeaderboard } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

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

export const getCachedNextMatch = cache(async () => {
  return prisma.match.findFirst({
    where: { isFinished: false },
    orderBy: { kickoffAt: "asc" },
  });
});

export const getCachedTodayMatches = cache(async () => {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  return prisma.match.findMany({
    where: { kickoffAt: { gte: todayStart, lte: todayEnd } },
    orderBy: { kickoffAt: "asc" },
  });
});

export const getCachedRecentFinished = cache(async () => {
  return prisma.match.findMany({
    where: { isFinished: true },
    orderBy: { kickoffAt: "desc" },
    take: 4,
  });
});

export const getCachedEngagement = cache(async (locale: Locale) => {
  return buildEngagementPicks(locale);
});

export const getCachedCrowdPreview = cache(async (locale: Locale) => {
  const crowd = await buildCrowdData(locale);
  return crowd.upcoming[0] ?? null;
});

export const getCachedRecap = cache(async (locale: Locale) => {
  return getOrGenerateDailyRecap(locale);
});

export const getCachedTopPlayers = cache(async () => {
  return buildLeaderboard({ period: "global", limit: 5 });
});

export const getCachedMyLeagues = cache(async (userId: string) => {
  const leagues = await prisma.privateLeagueMember.findMany({
    where: { userId },
    take: 3,
    include: { league: { select: { code: true, title: true } } },
  });
  return leagues.map((l) => l.league);
});

export const getCachedHomeAds = cache(async (locale: Locale) => {
  return prisma.adBanner.findMany({
    where: { isActive: true, placement: "home_top", OR: [{ locale: null }, { locale }] },
    orderBy: { sortOrder: "asc" },
    take: 2,
  });
});
