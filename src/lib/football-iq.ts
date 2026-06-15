import type { RiskLevel } from "@/lib/ai/football-analysis";
import { getCountryFromE164 } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export type IqCategory = {
  key: string;
  min: number;
  max: number;
};

export const IQ_CATEGORIES: IqCategory[] = [
  { key: "beginner", min: 0, max: 99 },
  { key: "casual", min: 100, max: 109 },
  { key: "analyst", min: 110, max: 119 },
  { key: "expert", min: 120, max: 129 },
  { key: "elite", min: 130, max: 139 },
  { key: "master", min: 140, max: 200 },
];

export function clampIq(iq: number): number {
  return Math.max(0, Math.min(200, iq));
}

export function getIqCategory(iq: number): IqCategory {
  const c = [...IQ_CATEGORIES].reverse().find((cat) => iq >= cat.min);
  return c ?? IQ_CATEGORIES[0];
}

export function computeIqDelta(
  riskLevel: RiskLevel,
  points: number,
  exact: boolean
): number {
  if (exact) return 8;
  if (points === 2) {
    return riskLevel === "high" ? 5 : riskLevel === "low" ? 1 : 3;
  }
  if (points === 0) {
    return riskLevel === "low" ? -2 : -1;
  }
  return 0;
}

export async function adjustUserFootballIq(userId: string, delta: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { footballIq: true } });
  if (!user) return;
  await prisma.user.update({
    where: { id: userId },
    data: { footballIq: clampIq(user.footballIq + delta) },
  });
}

export async function applyFootballIqForMatch(matchId: string, riskLevel: RiskLevel) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match?.isFinished || match.homeScore === null || match.awayScore === null) return;

  const predictions = await prisma.prediction.findMany({ where: { matchId } });
  await Promise.all(
    predictions.map((p) => {
      const exact = p.homeScore === match.homeScore && p.awayScore === match.awayScore;
      const delta = computeIqDelta(riskLevel, p.points, exact);
      if (delta === 0) return Promise.resolve();
      return adjustUserFootballIq(p.userId, delta);
    })
  );
}

export async function getFootballIqRanks(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { footballIq: true, phone: true },
  });
  if (!user) return null;

  const globalHigher = await prisma.user.count({
    where: { footballIq: { gt: user.footballIq } },
  });
  const globalRank = globalHigher + 1;

  const country = getCountryFromE164(user.phone);
  let nationalRank: number | null = null;
  if (country) {
    const users = await prisma.user.findMany({ select: { id: true, phone: true, footballIq: true } });
    const sameCountry = users
      .filter((u) => getCountryFromE164(u.phone) === country)
      .sort((a, b) => b.footballIq - a.footballIq);
    const idx = sameCountry.findIndex((u) => u.id === userId);
    nationalRank = idx >= 0 ? idx + 1 : null;
  }

  return {
    footballIq: user.footballIq,
    category: getIqCategory(user.footballIq),
    globalRank,
    nationalRank,
    country,
  };
}
