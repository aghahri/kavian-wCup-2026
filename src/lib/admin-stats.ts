import { prisma } from "@/lib/prisma";

type InviterRow = {
  id: string;
  name: string;
  referralCode?: string | null;
  _count: { referrals: number };
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminDashboardStats() {
  const today = startOfToday();
  const weekAgo = daysAgo(7);

  const [
    usersToday,
    users7d,
    otpRequestsToday,
    otpSuccessToday,
    activeTournaments,
    predictionsToday,
    referralRegistrations,
    topInviters,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.otpChallenge.count({ where: { createdAt: { gte: today } } }),
    prisma.otpChallenge.count({
      where: {
        createdAt: { gte: today },
        providerStatus: { contains: "verify:success" },
      },
    }),
    prisma.tournament.count({ where: { isActive: true } }),
    prisma.prediction.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { referredById: { not: null }, createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { referrals: true } },
      },
    }),
  ]);

  const otpSuccessRate =
    otpRequestsToday > 0 ? Math.round((otpSuccessToday / otpRequestsToday) * 100) : 0;

  return {
    usersToday,
    users7d,
    otpRequestsToday,
    otpSuccessRate,
    activeTournaments,
    predictionsToday,
    referralRegistrations,
    topInviters: (topInviters as InviterRow[])
      .filter((u) => u._count.referrals > 0)
      .sort((a, b) => b._count.referrals - a._count.referrals)
      .slice(0, 5),
  };
}

export async function getReferralAnalytics() {
  const [clicks, registrations, verified, topInviters] = await Promise.all([
    prisma.referralClick.count(),
    prisma.referralClick.count({ where: { registered: true } }),
    prisma.referralClick.count({ where: { verified: true } }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
    }),
  ]);

  return {
    clicks,
    registrations,
    verified,
    topInviters: (topInviters as InviterRow[])
      .filter((u) => u._count.referrals > 0)
      .sort((a, b) => b._count.referrals - a._count.referrals)
      .slice(0, 20),
  };
}
