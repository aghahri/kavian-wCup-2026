import { prisma } from "@/lib/prisma";

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function getOrCreateTodayChallenge() {
  const challengeDate = todayDateKey();
  const existing = await prisma.dailyChallenge.findUnique({
    where: { challengeDate },
    include: { match: true },
  });
  if (existing) return existing;

  const startOfDay = new Date(`${challengeDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${challengeDate}T23:59:59.999Z`);

  const match =
    (await prisma.match.findFirst({
      where: { isFinished: false, kickoffAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { kickoffAt: "asc" },
    })) ??
    (await prisma.match.findFirst({
      where: { isFinished: false, kickoffAt: { gte: new Date() } },
      orderBy: { kickoffAt: "asc" },
    }));

  if (!match) return null;

  return prisma.dailyChallenge.create({
    data: { matchId: match.id, challengeDate },
    include: { match: true },
  });
}

export async function buildDailyLeaderboard(challengeId: string, limit = 20) {
  const entries = await prisma.dailyChallengeEntry.findMany({
    where: { challengeId },
    include: { user: { select: { id: true, name: true, avatarUrl: true, dailyStreak: true } } },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: limit,
  });

  return entries.map((e, i) => ({
    rank: i + 1,
    userId: e.user.id,
    name: e.user.name,
    avatarUrl: e.user.avatarUrl,
    points: e.points,
    streak: e.user.dailyStreak,
  }));
}

export function scoreDailyEntry(
  entry: { homeScore: number; awayScore: number; firstGoalTeam: string; winnerPick: string },
  match: { homeScore: number | null; awayScore: number | null }
): number {
  if (match.homeScore === null || match.awayScore === null) return 0;

  let pts = 0;
  if (entry.homeScore === match.homeScore && entry.awayScore === match.awayScore) pts += 5;
  else {
    const actual = Math.sign(match.homeScore - match.awayScore);
    const pick =
      entry.winnerPick === "draw" ? 0 : entry.winnerPick === "home" ? 1 : -1;
    if (actual === pick) pts += 2;
  }

  const totalGoals = match.homeScore + match.awayScore;
  let actualFirst: string;
  if (totalGoals === 0) actualFirst = "none";
  else if (match.homeScore > 0 && match.awayScore === 0) actualFirst = "home";
  else if (match.awayScore > 0 && match.homeScore === 0) actualFirst = "away";
  else actualFirst = match.homeScore >= match.awayScore ? "home" : "away";

  if (entry.firstGoalTeam === actualFirst) pts += 1;

  return pts;
}

export async function updateUserDailyStreak(userId: string, challengeDate: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastDailyChallengeDate: true, dailyStreak: true },
  });
  if (!user) return;

  const yesterday = yesterdayDateKey();
  let streak = 1;
  if (user.lastDailyChallengeDate === yesterday) {
    streak = user.dailyStreak + 1;
  } else if (user.lastDailyChallengeDate === challengeDate) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { dailyStreak: streak, lastDailyChallengeDate: challengeDate },
  });
}

export async function scoreDailyChallengeForMatch(matchId: string) {
  const challenges = await prisma.dailyChallenge.findMany({
    where: { matchId },
    include: { match: true, entries: true },
  });

  for (const challenge of challenges) {
    if (challenge.match.homeScore === null || challenge.match.awayScore === null) continue;

    for (const entry of challenge.entries) {
      const points = scoreDailyEntry(entry, challenge.match);
      if (points !== entry.points) {
        await prisma.dailyChallengeEntry.update({
          where: { id: entry.id },
          data: { points },
        });
      }
    }
  }
}
