import { LOGIN_COUNTRIES } from "@/lib/countries";
import { prisma } from "@/lib/prisma";

export type FanCountryStat = {
  dialCode: string;
  iso: string;
  flagCode: string;
  nameFa: string;
  nameEn: string;
  nameAr: string;
  fanCount: number;
  favoriteTeamCounts: Record<string, number>;
};

export function getCountryFromPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const sorted = [...LOGIN_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) return c;
  }
  return null;
}

export async function buildFanMapStats(): Promise<FanCountryStat[]> {
  const users = await prisma.user.findMany({
    select: { phone: true, favoriteTeam: true },
  });

  const map = new Map<string, FanCountryStat>();

  for (const user of users) {
    const country = getCountryFromPhone(user.phone);
    if (!country) continue;

    const key = country.dialCode;
    let stat = map.get(key);
    if (!stat) {
      stat = {
        dialCode: country.dialCode,
        iso: country.iso,
        flagCode: country.flagCode,
        nameFa: country.nameFa,
        nameEn: country.nameEn,
        nameAr: country.nameAr,
        fanCount: 0,
        favoriteTeamCounts: {},
      };
      map.set(key, stat);
    }
    stat.fanCount++;
    if (user.favoriteTeam) {
      stat.favoriteTeamCounts[user.favoriteTeam] =
        (stat.favoriteTeamCounts[user.favoriteTeam] ?? 0) + 1;
    }
  }

  return [...map.values()].sort((a, b) => b.fanCount - a.fanCount);
}

export function getTopFavoriteTeam(stat: FanCountryStat): string | null {
  const entries = Object.entries(stat.favoriteTeamCounts);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
