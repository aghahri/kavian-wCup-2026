import type { Match } from "@prisma/client";
import type { Locale } from "@/i18n/routing";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";

export type MatchSummaryStats = {
  totalPredictions: number;
  correctResultCount: number;
  exactScoreCount: number;
  wrongCount: number;
  correctResultPct: number;
  wrongPct: number;
  topExactPredictors: { name: string; homeScore: number; awayScore: number }[];
  winnerLabel: string;
  funnyLine: string;
};

function correctResult(h: number, a: number, ph: number, pa: number): boolean {
  const r = Math.sign(h - a);
  const pr = Math.sign(ph - pa);
  return r === pr;
}

const FUNNY_LINES_FA = [
  "۷۳٪ کاربران نتیجه را اشتباه حدس زدند؛ فقط {exact} نفر نتیجه دقیق را زدند.",
  "این بازی همه را غافلگیر کرد! {wrong}٪ پیش‌بینی‌ها اشتباه بود.",
  "فقط {exact} نفر جادوگر بودند و نتیجه دقیق را زدند!",
  "جام جهانی پیش‌بینی‌پذیر نیست — {wrong}٪ این بار اشتباه کردند.",
];

export async function buildMatchSummary(match: Match, locale: Locale): Promise<MatchSummaryStats | null> {
  if (!match.isFinished || match.homeScore === null || match.awayScore === null) {
    return null;
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId: match.id },
    include: { user: { select: { name: true } } },
  });

  const total = predictions.length;
  let exact = 0;
  let correct = 0;

  const exactList: { name: string; homeScore: number; awayScore: number }[] = [];

  for (const p of predictions) {
    if (p.homeScore === match.homeScore && p.awayScore === match.awayScore) {
      exact++;
      exactList.push({ name: p.user.name, homeScore: p.homeScore, awayScore: p.awayScore });
    } else if (correctResult(match.homeScore, match.awayScore, p.homeScore, p.awayScore)) {
      correct++;
    }
  }

  const wrong = total - exact - correct;
  const wrongPct = total > 0 ? Math.round((wrong / total) * 100) : 0;
  const correctResultPct = total > 0 ? Math.round(((exact + correct) / total) * 100) : 0;

  const homeName = getHomeTeamName(match, locale);
  const awayName = getAwayTeamName(match, locale);

  let winnerLabel: string;
  if (match.homeScore > match.awayScore) {
    winnerLabel = homeName;
  } else if (match.awayScore > match.homeScore) {
    winnerLabel = awayName;
  } else {
    winnerLabel = locale === "fa" ? "مساوی" : locale === "ar" ? "تعادل" : "Draw";
  }

  const lineTemplate = FUNNY_LINES_FA[match.id.charCodeAt(0) % FUNNY_LINES_FA.length];
  const funnyLine = lineTemplate
    .replace("{exact}", String(exact))
    .replace("{wrong}", String(wrongPct));

  return {
    totalPredictions: total,
    correctResultCount: correct + exact,
    exactScoreCount: exact,
    wrongCount: wrong,
    correctResultPct,
    wrongPct,
    topExactPredictors: exactList.slice(0, 5),
    winnerLabel,
    funnyLine,
  };
}
