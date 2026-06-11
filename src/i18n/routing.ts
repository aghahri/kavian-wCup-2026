import { defineRouting } from "next-intl/routing";

export const locales = ["fa", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fa";

export const rtlLocales: Locale[] = ["fa", "ar"];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
