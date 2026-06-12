import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const LEAGUE_TYPES = ["family", "friends", "school", "company", "public"] as const;
export type LeagueType = (typeof LEAGUE_TYPES)[number];

export const LEAGUE_PRIVACY = ["private", "public"] as const;
export type LeaguePrivacy = (typeof LEAGUE_PRIVACY)[number];

export function generateLeagueCode(): string {
  return randomBytes(4).toString("hex");
}

export function getLeagueInviteUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kavianfootball.com";
  return `${base.replace(/\/$/, "")}/l/${code}`;
}

export async function ensureUniqueLeagueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateLeagueCode();
    const exists = await prisma.privateLeague.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("LEAGUE_CODE_FAILED");
}

export async function getLeagueByCode(code: string) {
  return prisma.privateLeague.findUnique({
    where: { code: code.trim().toLowerCase() },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { members: true, inviteClicks: true } },
    },
  });
}

export async function isLeagueMember(leagueId: string, userId: string): Promise<boolean> {
  const row = await prisma.privateLeagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  return Boolean(row);
}

export async function isLeagueOwner(leagueId: string, userId: string): Promise<boolean> {
  const league = await prisma.privateLeague.findUnique({
    where: { id: leagueId },
    select: { ownerId: true },
  });
  return league?.ownerId === userId;
}

export async function buildLeagueLeaderboard(leagueId: string, limit = 50) {
  const members = await prisma.privateLeagueMember.findMany({
    where: { leagueId },
    select: { userId: true, user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const userIds = members.map((m) => m.userId);
  if (userIds.length === 0) return [];

  const predictions = await prisma.prediction.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { points: true },
    _count: { id: true },
  });

  const pointsMap = new Map(predictions.map((p) => [p.userId, p._sum.points ?? 0]));
  const countMap = new Map(predictions.map((p) => [p.userId, p._count.id]));

  return members
    .map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      totalPoints: pointsMap.get(m.userId) ?? 0,
      predictionCount: countMap.get(m.userId) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.predictionCount - a.predictionCount)
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getLeaguePredictionSummary(leagueId: string, matchId: string) {
  const members = await prisma.privateLeagueMember.findMany({
    where: { leagueId },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);
  if (userIds.length === 0) return [];

  return prisma.prediction.findMany({
    where: { matchId, userId: { in: userIds } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
