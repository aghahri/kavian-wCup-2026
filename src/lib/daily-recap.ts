import { todayDateKey } from "@/lib/daily-challenge";
import { buildLeaderboard } from "@/lib/leaderboard";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { buildMatchSummary } from "@/lib/match-summary";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export type RecapData = {
  date: string;
  surprises: string[];
  topPredictor: string | null;
  hardestMatch: string | null;
  mostWrongPct: number;
  bestLeague: string | null;
  funFact: string;
};

function localeFact(exact: number, wrongPct: number, locale: Locale): string {
  if (locale === "fa") {
    return exact > 0
      ? `فقط ${exact} نفر نتیجه دقیق این بازی را حدس زدند.`
      : `${wrongPct}٪ کاربران اشتباه کردند — جام جهانی غافلگیرکننده است!`;
  }
  if (locale === "ar") {
    return exact > 0
      ? `فقط ${exact} أصابوا النتيجة الدقيقة.`
      : `${wrongPct}٪ أخطأوا — كأس العالم مفاجئ!`;
  }
  return exact > 0
    ? `Only ${exact} users nailed the exact score.`
    : `${wrongPct}% got it wrong — World Cup chaos!`;
}

async function generateRecap(locale: Locale): Promise<RecapData> {
  const date = todayDateKey();
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const finishedToday = await prisma.match.findMany({
    where: { isFinished: true, kickoffAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { kickoffAt: "desc" },
  });

  const surprises: string[] = [];
  let hardestMatch: string | null = null;
  let mostWrong = 0;
  let funExact = 0;
  let funWrong = 0;

  for (const match of finishedToday) {
    const summary = await buildMatchSummary(match, locale);
    if (!summary) continue;
    const label = `${getHomeTeamName(match, locale)} ${match.homeScore}-${match.awayScore} ${getAwayTeamName(match, locale)}`;
    if (summary.wrongPct >= 50) {
      surprises.push(
        locale === "fa"
          ? `غافلگیری: ${label} — ${summary.wrongPct}٪ اشتباه`
          : locale === "ar"
            ? `مفاجأة: ${label}`
            : `Upset: ${label} — ${summary.wrongPct}% wrong`
      );
    }
    if (summary.wrongPct > mostWrong) {
      mostWrong = summary.wrongPct;
      hardestMatch = label;
      funExact = summary.exactScoreCount;
      funWrong = summary.wrongPct;
    }
  }

  const weekly = await buildLeaderboard({ period: "daily", limit: 1 });
  const topPredictor = weekly[0]?.name ?? null;

  const bestLeague = await prisma.privateLeague.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    select: { title: true },
  });

  return {
    date,
    surprises: surprises.slice(0, 3),
    topPredictor,
    hardestMatch,
    mostWrongPct: mostWrong,
    bestLeague: bestLeague?.title ?? null,
    funFact: localeFact(funExact, funWrong, locale),
  };
}

export async function getOrGenerateDailyRecap(locale: Locale): Promise<RecapData> {
  const date = todayDateKey();
  const cached = await prisma.dailyRecap.findUnique({ where: { recapDate: date } });
  if (cached) {
    try {
      return JSON.parse(cached.dataJson) as RecapData;
    } catch {
      /* regenerate */
    }
  }

  const data = await generateRecap(locale);
  await prisma.dailyRecap.upsert({
    where: { recapDate: date },
    create: { recapDate: date, dataJson: JSON.stringify(data) },
    update: { dataJson: JSON.stringify(data) },
  });
  return data;
}
