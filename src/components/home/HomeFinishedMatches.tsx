import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FinishedMatchRow } from "@/components/FinishedMatchRow";
import { getCachedRecentFinished } from "@/lib/home-sections";
import type { Locale } from "@/i18n/routing";

type HomeFinishedMatchesProps = { locale: Locale };

export async function HomeFinishedMatches({ locale }: HomeFinishedMatchesProps) {
  const t = await getTranslations("home");
  const tc = await getTranslations("matchCenter");
  const matches = await getCachedRecentFinished();

  if (matches.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{t("resultsHighlights")}</h2>
        <Link href={`/${locale}/fixtures`} className="text-xs text-emerald-300">
          {t("allFixtures")} →
        </Link>
      </div>
      <div className="space-y-2">
        {matches.map((m) => (
          <FinishedMatchRow
            key={m.id}
            match={m}
            locale={locale}
            labels={{
              verified: tc("verifiedResult"),
              watchHighlights: tc("watchHighlights"),
              matchCenter: tc("viewMatch"),
              source: tc("source"),
            }}
          />
        ))}
      </div>
    </section>
  );
}
