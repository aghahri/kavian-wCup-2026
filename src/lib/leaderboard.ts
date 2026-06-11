import { prisma } from "@/lib/prisma";
import { resolveAvatarUrl } from "@/lib/avatar";

export type LeaderboardPeriod = "global" | "daily" | "weekly" | "tournament";

export type LeaderboardRow = {
  id: string;
  name: string;
  avatarUrl: string;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  predictionCount: number;
  finishedMatches: number;
};

function periodStart(period: "daily" | "weekly"): Date {
  const now = new Date();
  if (period === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function buildLeaderboard(options: {
  period: LeaderboardPeriod;
  tournamentId?: string;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const { period, tournamentId, limit } = options;

  let userIds: string[] | undefined;
  let tournamentRange: { startsAt: Date | null; endsAt: Date | null } | null = null;

  if (period === "tournament" && tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { startsAt: true, endsAt: true, memberships: { select: { userId: true } } },
    });
    if (!tournament) return [];
    userIds = tournament.memberships.map((m) => m.userId);
    tournamentRange = { startsAt: tournament.startsAt, endsAt: tournament.endsAt };
  }

  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      predictions: {
        select: {
          points: true,
          homeScore: true,
          awayScore: true,
          createdAt: true,
          match: {
            select: {
              isFinished: true,
              kickoffAt: true,
              homeScore: true,
              awayScore: true,
            },
          },
        },
      },
    },
  });

  const periodFrom =
    period === "daily" ? periodStart("daily") : period === "weekly" ? periodStart("weekly") : null;

  const rows = users
    .map((user) => {
      let predictions = user.predictions;

      if (periodFrom) {
        predictions = predictions.filter(
          (p) => p.match.isFinished && p.match.kickoffAt >= periodFrom
        );
      } else if (period === "tournament" && tournamentRange) {
        predictions = predictions.filter((p) => {
          const k = p.match.kickoffAt;
          if (tournamentRange!.startsAt && k < tournamentRange!.startsAt) return false;
          if (tournamentRange!.endsAt && k > tournamentRange!.endsAt) return false;
          return true;
        });
      }

      const totalPoints = predictions.reduce((s, p) => s + p.points, 0);
      const exactScores = predictions.filter((p) => p.points === 5).length;
      const correctResults = predictions.filter((p) => p.points >= 2).length;
      const finishedMatches = predictions.filter((p) => p.match.isFinished).length;

      return {
        id: user.id,
        name: user.name,
        avatarUrl: resolveAvatarUrl(user),
        totalPoints,
        exactScores,
        correctResults,
        predictionCount: predictions.length,
        finishedMatches,
      };
    })
    .filter((r) => r.predictionCount > 0 || period === "global")
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.correctResults - a.correctResults
    );

  return limit ? rows.slice(0, limit) : rows;
}

export async function getUserRank(
  userId: string,
  period: LeaderboardPeriod = "global",
  tournamentId?: string
): Promise<number | null> {
  const rows = await buildLeaderboard({ period, tournamentId });
  const index = rows.findIndex((r) => r.id === userId);
  return index >= 0 ? index + 1 : null;
}
