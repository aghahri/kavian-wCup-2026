import { prisma } from "@/lib/prisma";

export async function getLeagueInviteStats(leagueId: string) {
  const [clicks, joins, members] = await Promise.all([
    prisma.privateLeagueInviteClick.count({ where: { leagueId } }),
    prisma.privateLeagueInviteClick.count({ where: { leagueId, joined: true } }),
    prisma.privateLeagueMember.count({ where: { leagueId } }),
  ]);

  return { clicks, joins, members };
}

export async function markLeagueInviteJoined(leagueId: string, userId: string) {
  await prisma.privateLeagueInviteClick.updateMany({
    where: { leagueId, userId },
    data: { joined: true, registered: true },
  });

  await prisma.privateLeagueInviteClick.updateMany({
    where: { leagueId, joined: false },
    data: { joined: true, registered: true, userId },
  });
}
