import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCachedRecap } from "@/lib/home-sections";
import type { Locale } from "@/i18n/routing";

type HomeDailyRecapProps = { locale: Locale };

export async function HomeDailyRecap({ locale }: HomeDailyRecapProps) {
  const t = await getTranslations("home");
  const recap = await getCachedRecap(locale);

  return (
    <Link href={`/${locale}/recap`} className="block rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold text-amber-200">{t("dailyRecap")}</p>
      <p className="mt-2 text-sm text-white/70 line-clamp-2">{recap.funFact}</p>
    </Link>
  );
}
