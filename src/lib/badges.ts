import { prisma } from "@/lib/prisma";

export const BADGE_IDS = [
  "early_supporter",
  "top_predictor",
  "referral_champion",
  "world_cup_expert",
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

const WC_2026_START = new Date("2026-06-11T00:00:00Z");

export async function computeUserBadges(userId: string): Promise<BadgeId[]> {
  const [user, predictions, verifiedReferrals, topUsers] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.prediction.findMany({
      where: { userId },
      select: { points: true },
    }),
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.findMany({
      select: { id: true, predictions: { select: { points: true } } },
    }),
  ]);

  if (!user) return [];

  const badges: BadgeId[] = [];
  const exactScores = predictions.filter((p) => p.points === 5).length;
  const totalPoints = predictions.reduce((s, p) => s + p.points, 0);

  if (user.createdAt < WC_2026_START) badges.push("early_supporter");
  if (exactScores >= 10) badges.push("world_cup_expert");
  if (verifiedReferrals >= 5) badges.push("referral_champion");

  const ranked = topUsers
    .map((u) => ({
      id: u.id,
      total: u.predictions.reduce((s, p) => s + p.points, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const rank = ranked.findIndex((u) => u.id === userId);
  if (rank >= 0 && rank < 10 && totalPoints > 0) badges.push("top_predictor");

  return badges;
}

export async function syncUserBadges(userId: string): Promise<BadgeId[]> {
  const badges = await computeUserBadges(userId);
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badge: true },
  });
  const existingSet = new Set(existing.map((b) => b.badge));
  const toAdd = badges.filter((b) => !existingSet.has(b));
  if (toAdd.length > 0) {
    await prisma.userBadge.createMany({
      data: toAdd.map((badge) => ({ userId, badge })),
    });
  }
  return badges;
}
