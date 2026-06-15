import { prisma } from "@/lib/prisma";

const STREAK_MS = 24 * 60 * 60 * 1000;

export type ActivityType =
  | "prediction"
  | "league_visit"
  | "daily_challenge"
  | "recap_view"
  | "ai_visit"
  | "mission";

export function streakFlameDisplay(streak: number): string {
  if (streak <= 0) return "";
  if (streak >= 10) return "🔥".repeat(5);
  if (streak >= 5) return "🔥".repeat(3);
  if (streak >= 2) return "🔥".repeat(2);
  return "🔥";
}

export async function recordUserActivity(userId: string, _type?: ActivityType) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activityStreak: true, bestActivityStreak: true, lastActivityAt: true },
  });
  if (!user) return;

  const now = new Date();
  let streak = 1;
  if (user.lastActivityAt) {
    const elapsed = now.getTime() - user.lastActivityAt.getTime();
    if (elapsed <= STREAK_MS) {
      streak = user.activityStreak + 1;
    }
  }

  const best = Math.max(user.bestActivityStreak, streak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      activityStreak: streak,
      bestActivityStreak: best,
      lastActivityAt: now,
    },
  });
}

export async function getUserStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activityStreak: true, bestActivityStreak: true, lastActivityAt: true },
  });
  if (!user) return { current: 0, best: 0, flames: "" };

  let current = user.activityStreak;
  if (user.lastActivityAt) {
    const elapsed = Date.now() - user.lastActivityAt.getTime();
    if (elapsed > STREAK_MS) current = 0;
  }

  return {
    current,
    best: user.bestActivityStreak,
    flames: streakFlameDisplay(current),
  };
}
