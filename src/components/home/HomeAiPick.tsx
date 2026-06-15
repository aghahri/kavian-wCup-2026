import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatAiPredictionLine } from "@/lib/ai/football-analysis";
import { getCachedEngagement } from "@/lib/home-sections";
import type { Locale } from "@/i18n/routing";

type HomeAiPickProps = { locale: Locale };

export async function HomeAiPick({ locale }: HomeAiPickProps) {
  const t = await getTranslations("home");
  const engagement = await getCachedEngagement(locale);
  const pick = engagement?.pickOfDay;

  if (!pick) return null;

  return (
    <Link
      href={`/${locale}/matches/${pick.match.id}`}
      className="block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
    >
      <p className="text-xs font-semibold text-emerald-300">⭐ {t("aiPick")}</p>
      <p className="mt-1 font-bold text-white">
        {formatAiPredictionLine(
          pick.match,
          locale,
          pick.suggestedHomeScore,
          pick.suggestedAwayScore
        )}
      </p>
    </Link>
  );
}
