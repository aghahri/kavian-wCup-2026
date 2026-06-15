import type { Match } from "@prisma/client";
import type { Locale } from "@/i18n/routing";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { getMatchStatus, type MatchStatus } from "@/lib/match-status";

export type RiskLevel = "low" | "medium" | "high";
export type SurpriseLevel = "low" | "medium" | "high";

export type PredictionStats = {
  total: number;
  exactCount: number;
  correctResultCount: number;
  wrongCount: number;
  wrongPct: number;
  crowdMajorityCorrect?: boolean | null;
  crowdHomePct?: number;
  crowdDrawPct?: number;
  crowdAwayPct?: number;
  topExactNames?: string[];
};

export type FootballAnalysis = {
  phase: MatchStatus;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  riskLevel: RiskLevel;
  suggestedHomeScore: number;
  suggestedAwayScore: number;
  reasoning: string[];
  reasoningEn: string[];
  lesson?: string;
  lessonEn?: string;
  surpriseLevel?: SurpriseLevel;
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

const STRONG_TEAMS = new Set([
  "brazil", "france", "argentina", "england", "spain", "germany", "portugal",
  "netherlands", "belgium", "croatia", "usa", "mexico", "japan", "morocco",
]);

function teamStrength(name: string): number {
  const key = name.toLowerCase();
  if (STRONG_TEAMS.has(key)) return 78;
  if (key.includes("iran")) return 62;
  return 48 + (hashSeed(key) % 25);
}

function correctResult(h: number, a: number, ph: number, pa: number): boolean {
  return Math.sign(h - a) === Math.sign(ph - pa);
}

function winnerLabel(match: Match, locale: Locale): string {
  if (match.homeScore === null || match.awayScore === null) return "";
  if (match.homeScore > match.awayScore) return getHomeTeamName(match, locale);
  if (match.awayScore > match.homeScore) return getAwayTeamName(match, locale);
  return locale === "fa" ? "مساوی" : locale === "ar" ? "تعادل" : "Draw";
}

function surpriseFromStats(stats: PredictionStats): SurpriseLevel {
  if (stats.total < 5) return "low";
  if (stats.wrongPct >= 70) return "high";
  if (stats.wrongPct >= 45) return "medium";
  return "low";
}

function generateUpcomingAnalysis(match: Match): FootballAnalysis {
  const homeStr = teamStrength(match.homeTeam);
  const awayStr = teamStrength(match.awayTeam);
  const diff = homeStr - awayStr;
  const homeAdv = 6;

  let homeWin = 33 + diff + homeAdv;
  let awayWin = 33 - diff;
  let draw = 34;

  homeWin = Math.max(12, Math.min(72, homeWin));
  awayWin = Math.max(12, Math.min(72, awayWin));
  draw = 100 - homeWin - awayWin;
  if (draw < 15) {
    draw = 15;
    const rem = 85;
    homeWin = Math.round((homeWin / (homeWin + awayWin)) * rem);
    awayWin = rem - homeWin;
  }

  const gap = Math.abs(homeWin - awayWin);
  const riskLevel: RiskLevel = gap >= 25 ? "low" : gap >= 12 ? "medium" : "high";
  const favoredHome = homeWin >= awayWin;
  const suggestedHomeScore = favoredHome ? (gap >= 20 ? 2 : 1) : draw >= 30 ? 1 : 0;
  const suggestedAwayScore = !favoredHome ? (gap >= 20 ? 2 : 1) : draw >= 30 ? 1 : 0;

  const reasoning = [
    `فرم اخیر ${match.homeTeamFa} در مدل داخلی امتیاز ${homeStr} گرفته است.`,
    `${match.awayTeamFa} با امتیاز ${awayStr} حریف متعادلی است.`,
    gap < 12
      ? "دو تیم نزدیک به هم هستند؛ پیش‌بینی دقیق ریسک بالاتری دارد."
      : favoredHome
        ? `${match.homeTeamFa} در این تحلیل کمی برتر دیده می‌شود.`
        : `${match.awayTeamFa} در این تحلیل کمی برتر دیده می‌شود.`,
    `احتمال مساوی ${draw}٪ برآورد شده است.`,
  ];

  const reasoningEn = [
    `${match.homeTeam} model strength: ${homeStr}.`,
    `${match.awayTeam} model strength: ${awayStr}.`,
    gap < 12 ? "Close match — exact score is harder." : "One side has a slight edge.",
    `Draw probability: ${draw}%.`,
  ];

  return {
    phase: "upcoming",
    homeWinPct: homeWin,
    drawPct: draw,
    awayWinPct: awayWin,
    riskLevel,
    suggestedHomeScore,
    suggestedAwayScore,
    reasoning,
    reasoningEn,
  };
}

function generateLiveAnalysis(match: Match): FootballAnalysis {
  const base = generateUpcomingAnalysis(match);
  return {
    ...base,
    phase: "live",
    reasoning: [
      "بازی در جریان است — نتیجه هنوز قطعی نیست.",
      ...base.reasoning.slice(0, 2),
      "پیش‌بینی‌های ثبت‌شده ممکن است با تحولات زمین تغییر کند.",
    ],
    reasoningEn: [
      "Match is live — outcome still uncertain.",
      ...base.reasoningEn.slice(0, 2),
      "Registered predictions may shift as the match evolves.",
    ],
  };
}

function generateFinishedAnalysis(match: Match, stats: PredictionStats): FootballAnalysis {
  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;
  const winnerFa = winnerLabel(match, "fa");
  const winnerEn = winnerLabel(match, "en");
  const surpriseLevel = surpriseFromStats(stats);

  const reasoning = [
    `نتیجه نهایی: ${match.homeTeamFa} ${hs} - ${as} ${match.awayTeamFa}`,
    `برنده: ${winnerFa}`,
    `${stats.exactCount} نفر نتیجه دقیق را زدند از ${stats.total} پیش‌بینی.`,
    `${stats.wrongPct}٪ کاربران نتیجه را اشتباه حدس زدند.`,
  ];

  const reasoningEn = [
    `Final score: ${match.homeTeam} ${hs} - ${as} ${match.awayTeam}`,
    `Winner: ${winnerEn}`,
    `${stats.exactCount} exact predictions out of ${stats.total}.`,
    `${stats.wrongPct}% of users predicted the wrong outcome.`,
  ];

  if (stats.crowdMajorityCorrect !== undefined && stats.crowdMajorityCorrect !== null) {
    reasoning.push(
      stats.crowdMajorityCorrect
        ? `اکثریت کاربران (${stats.crowdHomePct ?? 0}٪ / ${stats.crowdDrawPct ?? 0}٪ / ${stats.crowdAwayPct ?? 0}٪) درست پیش‌بینی کردند.`
        : "اکثریت کاربران اشتباه فکر می‌کردند."
    );
    reasoningEn.push(
      stats.crowdMajorityCorrect
        ? "The crowd majority got the result right."
        : "The crowd majority got it wrong."
    );
  }

  if (stats.topExactNames && stats.topExactNames.length > 0) {
    reasoning.push(`بهترین پیش‌بینی‌های دقیق: ${stats.topExactNames.slice(0, 3).join("، ")}`);
    reasoningEn.push(`Top exact predictors: ${stats.topExactNames.slice(0, 3).join(", ")}`);
  }

  const lesson =
    surpriseLevel === "high"
      ? `این بازی نشان داد که جام جهانی غافلگیرکننده است — اکثر کاربران (${stats.wrongPct}٪) اشتباه کردند.`
      : stats.exactCount > 0
        ? `این بازی نشان داد که پیش‌بینی دقیق ممکن است — ${stats.exactCount} نفر نتیجه را درست زدند.`
        : `این بازی نشان داد که حتی نتیجه درست هم ساده نیست — هیچ پیش‌بینی دقیقی ثبت نشد.`;

  const lessonEn =
    surpriseLevel === "high"
      ? `This match showed how unpredictable the World Cup can be — ${stats.wrongPct}% got it wrong.`
      : stats.exactCount > 0
        ? `${stats.exactCount} users nailed the exact score.`
        : `No exact-score predictions — even the right outcome was hard to call.`;

  let homeWinPct = 0;
  let drawPct = 0;
  let awayWinPct = 0;
  if (hs > as) homeWinPct = 100;
  else if (as > hs) awayWinPct = 100;
  else drawPct = 100;

  return {
    phase: "finished",
    homeWinPct,
    drawPct,
    awayWinPct,
    riskLevel: surpriseLevel === "high" ? "high" : "low",
    suggestedHomeScore: hs,
    suggestedAwayScore: as,
    reasoning,
    reasoningEn,
    lesson,
    lessonEn,
    surpriseLevel,
  };
}

export function buildPredictionStats(
  predictions: { homeScore: number; awayScore: number }[],
  match: Match
): PredictionStats {
  if (match.homeScore === null || match.awayScore === null) {
    return { total: predictions.length, exactCount: 0, correctResultCount: 0, wrongCount: 0, wrongPct: 0 };
  }

  let exact = 0;
  let correct = 0;
  for (const p of predictions) {
    if (p.homeScore === match.homeScore && p.awayScore === match.awayScore) exact++;
    else if (correctResult(match.homeScore, match.awayScore, p.homeScore, p.awayScore)) correct++;
  }
  const total = predictions.length;
  const wrong = total - exact - correct;
  return {
    total,
    exactCount: exact,
    correctResultCount: correct + exact,
    wrongCount: wrong,
    wrongPct: total > 0 ? Math.round((wrong / total) * 100) : 0,
  };
}

export function generateFootballAnalysis(
  match: Match,
  stats: PredictionStats = { total: 0, exactCount: 0, correctResultCount: 0, wrongCount: 0, wrongPct: 0 }
): FootballAnalysis {
  const phase = getMatchStatus(match.kickoffAt, match.isFinished, match.homeScore, match.awayScore);
  if (phase === "finished" && match.homeScore !== null && match.awayScore !== null) {
    return generateFinishedAnalysis(match, stats);
  }
  if (phase === "live") return generateLiveAnalysis(match);
  return generateUpcomingAnalysis(match);
}

export function analysisToDbFields(analysis: FootballAnalysis) {
  const reasoningFa = analysis.lesson
    ? [...analysis.reasoning, analysis.lesson]
    : analysis.reasoning;
  const reasoningEn = analysis.lessonEn
    ? [...analysis.reasoningEn, analysis.lessonEn]
    : analysis.reasoningEn;

  return {
    homeWinPct: analysis.homeWinPct,
    drawPct: analysis.drawPct,
    awayWinPct: analysis.awayWinPct,
    riskLevel: analysis.riskLevel,
    suggestedHomeScore: analysis.suggestedHomeScore,
    suggestedAwayScore: analysis.suggestedAwayScore,
    reasoningFa: JSON.stringify(reasoningFa),
    reasoningEn: JSON.stringify(reasoningEn),
    reasoningAr: JSON.stringify(reasoningEn),
  };
}

export function parseReasoning(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [json];
  } catch {
    return [json];
  }
}

export function getLocalizedReasoning(
  row: { reasoningFa: string; reasoningEn: string | null; reasoningAr: string | null },
  locale: Locale
): string[] {
  if (locale === "en" && row.reasoningEn) return parseReasoning(row.reasoningEn);
  if (locale === "ar" && row.reasoningAr) return parseReasoning(row.reasoningAr);
  return parseReasoning(row.reasoningFa);
}

export function formatAiPredictionLine(match: Match, locale: Locale, home: number, away: number): string {
  const h = getHomeTeamName(match, locale);
  const a = getAwayTeamName(match, locale);
  return `${h} ${home} - ${away} ${a}`;
}

export const RISK_LABELS: Record<RiskLevel, { fa: string; en: string; ar: string }> = {
  low: { fa: "کم", en: "Low", ar: "منخفض" },
  medium: { fa: "متوسط", en: "Medium", ar: "متوسط" },
  high: { fa: "بالا", en: "High", ar: "مرتفع" },
};

export const SURPRISE_LABELS: Record<SurpriseLevel, { fa: string; en: string; ar: string }> = {
  low: { fa: "عادی", en: "Expected", ar: "متوقع" },
  medium: { fa: "غافلگیرکننده", en: "Surprising", ar: "مفاجئ" },
  high: { fa: "شگفت‌انگیز", en: "Huge upset", ar: "مفاجأة كبيرة" },
};
