import { todayDateKey } from "@/lib/daily-challenge";
import { awardXp } from "@/lib/xp-levels";
import { recordUserActivity } from "@/lib/streak-engine";
import { prisma } from "@/lib/prisma";

export const DAILY_MISSION_KEYS = [
  "predict_3",
  "invite_friend",
  "visit_ai",
  "join_league",
  "share_result",
] as const;

export type MissionKey = (typeof DAILY_MISSION_KEYS)[number];

export const MISSION_XP: Record<MissionKey, number> = {
  predict_3: 15,
  invite_friend: 20,
  visit_ai: 5,
  join_league: 10,
  share_result: 8,
};

export async function completeMission(userId: string, missionKey: MissionKey) {
  const missionDate = todayDateKey();
  const existing = await prisma.userMissionProgress.findUnique({
    where: { userId_missionDate_missionKey: { userId, missionDate, missionKey } },
  });
  if (existing) return false;

  await prisma.userMissionProgress.create({
    data: { userId, missionDate, missionKey, completed: true },
  });
  await awardXp(userId, MISSION_XP[missionKey]);
  await recordUserActivity(userId, "mission");
  return true;
}

export async function getMissionProgress(userId: string) {
  const missionDate = todayDateKey();
  const [completed, predictionCount, leagueCount, referralCount] = await Promise.all([
    prisma.userMissionProgress.findMany({ where: { userId, missionDate } }),
    prisma.prediction.count({
      where: { userId, createdAt: { gte: new Date(`${missionDate}T00:00:00.000Z`) } },
    }),
    prisma.privateLeagueMember.count({ where: { userId } }),
    prisma.user.count({ where: { referredById: userId } }),
  ]);

  const done = new Set(completed.map((c) => c.missionKey));

  const missions = DAILY_MISSION_KEYS.map((key) => {
    let autoDone = done.has(key);
    if (key === "predict_3" && predictionCount >= 3) autoDone = true;
    if (key === "join_league" && leagueCount > 0) autoDone = true;
    if (key === "invite_friend" && referralCount > 0) autoDone = true;
    return { key, completed: autoDone, xp: MISSION_XP[key] };
  });

  for (const m of missions) {
    if (m.completed && !done.has(m.key)) {
      await completeMission(userId, m.key);
    }
  }

  return missions;
}
