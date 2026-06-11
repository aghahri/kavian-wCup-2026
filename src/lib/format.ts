import type { Locale } from "@/i18n/routing";

const localeMap: Record<Locale, string> = {
  fa: "fa-IR",
  en: "en-US",
  ar: "ar-SA",
};

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeMap[locale], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeMap[locale]).format(value);
}

export function isPredictionOpen(kickoffAt: Date, isFinished: boolean): boolean {
  if (isFinished) return false;
  return new Date() < kickoffAt;
}
