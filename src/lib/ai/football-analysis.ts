import type { Match } from "@prisma/client";
import type { Locale } from "@/i18n/routing";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";

export type RiskLevel = "low" | "medium" | "high";

export type FootballAnalysis = {
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  riskLevel: RiskLevel;
  suggestedHomeScore: number;
  suggestedAwayScore: number;
  reasoning: string[];
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

export function generateFootballAnalysis(match: Match): FootballAnalysis {
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
  if (suggestedHomeScore === suggestedAwayScore && suggestedHomeScore === 1) {
    // nudge draw suggestion
  }

  const homeFa = match.homeTeamFa;
  const awayFa = match.awayTeamFa;

  const reasoning = [
    `فرم اخیر ${homeFa} در محاسبات داخلی امتیاز ${homeStr} گرفته است.`,
    `${awayFa} با امتیاز ${awayStr} حریف متعادلی است.`,
    gap < 12
      ? "دو تیم نزدیک به هم هستند؛ پیش‌بینی دقیق ریسک بالاتری دارد."
      : favoredHome
        ? `${homeFa} در این تحلیل کمی برتر دیده می‌شود.`
        : `${awayFa} در این تحلیل کمی برتر دیده می‌شود.`,
    `احتمال مساوی ${draw}٪ برآورد شده است.`,
  ];

  return {
    homeWinPct: homeWin,
    drawPct: draw,
    awayWinPct: awayWin,
    riskLevel,
    suggestedHomeScore,
    suggestedAwayScore,
    reasoning,
  };
}

export function analysisToDbFields(match: Match, analysis: FootballAnalysis) {
  const reasoningEn = [
    `${match.homeTeam} strength score: ${teamStrength(match.homeTeam)}.`,
    `${match.awayTeam} strength score: ${teamStrength(match.awayTeam)}.`,
    analysis.riskLevel === "high"
      ? "Close match — exact score is harder to predict."
      : "One side has a slight edge in this model.",
    `Draw probability estimated at ${analysis.drawPct}%.`,
  ];

  return {
    homeWinPct: analysis.homeWinPct,
    drawPct: analysis.drawPct,
    awayWinPct: analysis.awayWinPct,
    riskLevel: analysis.riskLevel,
    suggestedHomeScore: analysis.suggestedHomeScore,
    suggestedAwayScore: analysis.suggestedAwayScore,
    reasoningFa: JSON.stringify(analysis.reasoning),
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
