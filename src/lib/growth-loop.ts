import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export type GrowthBanner = {
  id: string;
  message: string;
  href: string;
  tone: "amber" | "emerald" | "sky";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getGrowthBanners(
  user: User | null,
  locale: Locale
): Promise<GrowthBanner[]> {
  if (!user) {
    return [
      {
        id: "login",
        message: bannerText("join", locale),
        href: `/${locale}/login`,
        tone: "emerald",
      },
    ];
  }

  const banners: GrowthBanner[] = [];
  const now = Date.now();
  const joinedToday = now - user.createdAt.getTime() < DAY_MS;
  const inactive =
    !user.lastActivityAt || now - user.lastActivityAt.getTime() > DAY_MS;

  const [leagueCount, referralCount, matchesToday] = await Promise.all([
    prisma.privateLeagueMember.count({ where: { userId: user.id } }),
    prisma.user.count({ where: { referredById: user.id } }),
    prisma.match.count({
      where: {
        isFinished: false,
        kickoffAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  if (joinedToday) {
    banners.push({
      id: "second-chance",
      message: bannerText("joinedToday", locale),
      href: `/${locale}/second-chance`,
      tone: "emerald",
    });
  }

  if (inactive && matchesToday > 0) {
    banners.push({
      id: "inactive",
      message: bannerText("inactive", locale, { count: matchesToday }),
      href: `/${locale}/predict`,
      tone: "amber",
    });
  }

  if (leagueCount === 0) {
    banners.push({
      id: "no-league",
      message: bannerText("noLeague", locale),
      href: `/${locale}/leagues/create`,
      tone: "sky",
    });
  }

  if (referralCount === 0) {
    banners.push({
      id: "no-referral",
      message: bannerText("noReferral", locale),
      href: `/${locale}/referrals`,
      tone: "sky",
    });
  }

  return banners.slice(0, 2);
}

function bannerText(
  key: string,
  locale: Locale,
  vars?: Record<string, number>
): string {
  const count = vars?.count ?? 3;
  const fa: Record<string, string> = {
    join: "همین الان وارد مسابقه شو!",
    joinedToday: "از جام جهانی دوم شانس شروع کن.",
    inactive: `${count} بازی مهم امروز را از دست نده.`,
    noLeague: "یک لیگ خانوادگی بساز.",
    noReferral: "یک دوست دعوت کن.",
  };
  const en: Record<string, string> = {
    join: "Join the challenge now!",
    joinedToday: "Start with Second Chance World Cup.",
    inactive: `Don't miss ${count} big matches today.`,
    noLeague: "Create a family league.",
    noReferral: "Invite a friend.",
  };
  const ar: Record<string, string> = {
    join: "انضم للتحدي الآن!",
    joinedToday: "ابدأ مع فرصة كأس العالم الثانية.",
    inactive: `لا تفوت ${count} مباريات مهمة اليوم.`,
    noLeague: "أنشئ دوري عائلي.",
    noReferral: "ادعُ صديقاً.",
  };
  const map = locale === "fa" ? fa : locale === "ar" ? ar : en;
  return map[key] ?? en[key] ?? "";
}
