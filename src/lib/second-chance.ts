import { prisma } from "@/lib/prisma";

export type CompetitionId = "today" | "week" | "knockout" | "final";

const WC_FINAL = new Date("2026-07-19T23:59:59.999Z");

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCompetitionStart(id: CompetitionId): Date {
  if (id === "today") return startOfToday();
  if (id === "week") return startOfWeek();
  return startOfToday();
}

function matchInCompetition(
  stage: string,
  stageEn: string | null,
  id: CompetitionId
): boolean {
  const s = `${stage} ${stageEn ?? ""}`.toLowerCase();
  if (id === "knockout") {
    return /knockout|round of|one-eighth|quarter|semi|یک‌هشتم|یک چهارم|نیمه/.test(s);
  }
  if (id === "final") {
    return /final|فینال|نهایی/.test(s);
  }
  return true;
}

export async function buildSecondChanceLeaderboard(competitionId: CompetitionId, limit = 10) {
  const since = getCompetitionStart(competitionId);
  const matches = await prisma.match.findMany({
    where: { kickoffAt: { gte: since } },
    select: { id: true, stage: true, stageEn: true },
  });

  const matchIds = matches
    .filter((m) => matchInCompetition(m.stage, m.stageEn, competitionId))
    .map((m) => m.id);

  if (matchIds.length === 0) return [];

  const predictions = await prisma.prediction.findMany({
    where: { matchId: { in: matchIds }, match: { isFinished: true } },
    include: { user: { select: { id: true, name: true } } },
  });

  const map = new Map<string, { name: string; points: number; count: number }>();
  for (const p of predictions) {
    const row = map.get(p.userId) ?? { name: p.user.name, points: 0, count: 0 };
    row.points += p.points;
    row.count += 1;
    map.set(p.userId, row);
  }

  return [...map.entries()]
    .map(([userId, row]) => ({ userId, ...row }))
    .sort((a, b) => b.points - a.points || b.count - a.count)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function getSecondChanceStats() {
  const now = new Date();
  const [remainingMatches, upcoming] = await Promise.all([
    prisma.match.count({ where: { isFinished: false, kickoffAt: { gte: now } } }),
    prisma.match.findMany({
      where: { isFinished: false, kickoffAt: { gte: startOfToday() } },
      select: { id: true },
    }),
  ]);

  const maxPoints = upcoming.length * 5;
  const daysLeft = Math.max(0, Math.ceil((WC_FINAL.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  return { daysLeft, remainingMatches, remainingPoints: maxPoints };
}
