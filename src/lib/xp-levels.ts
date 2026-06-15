import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700];

export const LEVEL_KEYS = ["rookie", "fan", "analyst", "captain", "legend"] as const;

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, LEVEL_KEYS.length);
}

export function xpToNextLevel(xp: number): { current: number; next: number; progress: number } {
  const level = levelFromXp(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 200;
  const span = nextThreshold - currentThreshold;
  const progress = level >= LEVEL_KEYS.length ? 100 : Math.round(((xp - currentThreshold) / span) * 100);
  return { current: currentThreshold, next: nextThreshold, progress: Math.min(100, progress) };
}

export function levelTitle(level: number, locale: Locale): string {
  const key = LEVEL_KEYS[Math.min(level - 1, LEVEL_KEYS.length - 1)] ?? "rookie";
  const titles: Record<string, Record<Locale, string>> = {
    rookie: { fa: "تازه‌کار", en: "Rookie", ar: "مبتدئ" },
    fan: { fa: "هوادار", en: "Fan", ar: "مشجع" },
    analyst: { fa: "تحلیلگر", en: "Analyst", ar: "محلل" },
    captain: { fa: "کاپیتان", en: "Captain", ar: "قائد" },
    legend: { fa: "افسانه", en: "Legend", ar: "أسطورة" },
  };
  return titles[key]?.[locale] ?? titles.rookie.en;
}

export async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  if (!user) return;
  const xp = user.xp + amount;
  await prisma.user.update({
    where: { id: userId },
    data: { xp, userLevel: levelFromXp(xp) },
  });
}
