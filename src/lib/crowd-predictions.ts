import type { Match } from "@prisma/client";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export type CrowdMatchRow = {
  match: Match;
  homePct: number;
  drawPct: number;
  awayPct: number;
  total: number;
  crowdCorrect: boolean | null;
  messageKey: "crowdWrong" | "crowdRight" | null;
  wrongPct: number;
};

function winnerPick(h: number, a: number): "home" | "away" | "draw" {
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
}

export async function buildCrowdData(_locale: Locale): Promise<{
  upcoming: CrowdMatchRow[];
  surprises: CrowdMatchRow[];
}> {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    take: 40,
  });

  const rows: CrowdMatchRow[] = [];

  for (const match of matches) {
    const predictions = await prisma.prediction.findMany({
      where: { matchId: match.id },
      select: { homeScore: true, awayScore: true },
    });
    if (predictions.length === 0) continue;

    let home = 0;
    let draw = 0;
    let away = 0;
    let correct = 0;

    for (const p of predictions) {
      const w = winnerPick(p.homeScore, p.awayScore);
      if (w === "home") home++;
      else if (w === "away") away++;
      else draw++;

      if (match.isFinished && match.homeScore !== null && match.awayScore !== null) {
        const aw = winnerPick(match.homeScore, match.awayScore);
        if (w === aw) correct++;
      }
    }

    const total = predictions.length;
    const homePct = Math.round((home / total) * 100);
    const drawPct = Math.round((draw / total) * 100);
    const awayPct = Math.round((away / total) * 100);
    const wrongPct = match.isFinished ? Math.round(((total - correct) / total) * 100) : 0;

    let crowdCorrect: boolean | null = null;
    let messageKey: CrowdMatchRow["messageKey"] = null;
    if (match.isFinished && total > 0) {
      const majorityCorrect = correct / total >= 0.5;
      crowdCorrect = majorityCorrect;
      messageKey = majorityCorrect ? "crowdRight" : "crowdWrong";
    }

    rows.push({
      match,
      homePct,
      drawPct,
      awayPct,
      total,
      crowdCorrect,
      messageKey,
      wrongPct,
    });
  }

  const upcoming = rows.filter((r) => !r.match.isFinished).slice(0, 8);
  const surprises = rows
    .filter((r) => r.match.isFinished && r.wrongPct >= 50)
    .sort((a, b) => b.wrongPct - a.wrongPct)
    .slice(0, 5);

  return { upcoming, surprises };
}

export function crowdTeamLabels(match: Match, locale: Locale) {
  return {
    home: getHomeTeamName(match, locale),
    away: getAwayTeamName(match, locale),
  };
}
