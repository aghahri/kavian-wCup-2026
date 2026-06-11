import type { Match } from "@prisma/client";
import type { Locale } from "@/i18n/routing";

export function getHomeTeamName(match: Match, locale: Locale): string {
  if (locale === "fa") return match.homeTeamFa;
  if (locale === "ar") return match.homeTeamAr ?? match.homeTeamFa;
  return match.homeTeam;
}

export function getAwayTeamName(match: Match, locale: Locale): string {
  if (locale === "fa") return match.awayTeamFa;
  if (locale === "ar") return match.awayTeamAr ?? match.awayTeamFa;
  return match.awayTeam;
}

export function getStageName(match: Match, locale: Locale): string {
  if (locale === "en") return match.stageEn ?? match.stage;
  if (locale === "ar") return match.stageAr ?? match.stage;
  return match.stage;
}

export function getTournamentName(
  tournament: { nameFa: string; nameEn: string; nameAr: string },
  locale: Locale
): string {
  if (locale === "en") return tournament.nameEn;
  if (locale === "ar") return tournament.nameAr;
  return tournament.nameFa;
}

export function getPrizeTitle(
  prize: { titleFa: string; titleEn: string; titleAr: string },
  locale: Locale
): string {
  if (locale === "en") return prize.titleEn;
  if (locale === "ar") return prize.titleAr;
  return prize.titleFa;
}
