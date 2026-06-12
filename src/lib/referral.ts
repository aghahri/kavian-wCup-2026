import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const REFERRAL_COOKIE = "kavian_ref";
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function generateReferralCode(): string {
  return randomBytes(4).toString("hex");
}

export function getReferralUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kavianfootball.com";
  return `${base.replace(/\/$/, "")}/r/${code}`;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function getReferralCookieCode(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(REFERRAL_COOKIE)?.value?.trim();
  return value || null;
}

export async function attachReferralToNewUser(userId: string): Promise<void> {
  const code = await getReferralCookieCode();
  if (!code) return;

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer || referrer.id === userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { referredById: referrer.id },
  });

  await prisma.referralClick.updateMany({
    where: { referralCode: code, registered: false },
    data: { registered: true, verified: true },
  });

  await prisma.user.update({
    where: { id: referrer.id },
    data: { referralPoints: { increment: 10 } },
  });
}

export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralPoints: true },
  });
  if (!user?.referralCode) {
    return { clicks: 0, registrations: 0, verified: 0, referralPoints: 0, inviteScore: 0 };
  }

  const [clicks, registrations, verified, referrals] = await Promise.all([
    prisma.referralClick.count({ where: { referralCode: user.referralCode } }),
    prisma.referralClick.count({
      where: { referralCode: user.referralCode, registered: true },
    }),
    prisma.referralClick.count({
      where: { referralCode: user.referralCode, verified: true },
    }),
    prisma.user.count({ where: { referredById: userId } }),
  ]);

  const inviteScore = user.referralPoints + verified * 5 + referrals * 10;

  return {
    clicks,
    registrations,
    verified,
    referrals,
    referralPoints: user.referralPoints,
    inviteScore,
  };
}

export async function buildReferralLeaderboard(limit = 20) {
  const users = await prisma.user.findMany({
    where: { referralCode: { not: null } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      referralPoints: true,
      referralCode: true,
      _count: { select: { referrals: true } },
    },
  });

  const withScores = await Promise.all(
    users.map(async (u) => {
      const stats = await getReferralStats(u.id);
      return {
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        inviteScore: stats.inviteScore,
        verified: stats.verified,
        referrals: u._count.referrals,
      };
    })
  );

  return withScores
    .filter((u) => u.inviteScore > 0 || u.referrals > 0)
    .sort((a, b) => b.inviteScore - a.inviteScore || b.referrals - a.referrals)
    .slice(0, limit)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (user?.referralCode) return user.referralCode;

  let code = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      code = generateReferralCode();
    }
  }
  throw new Error("REFERRAL_CODE_FAILED");
}
