import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { crowdTeamLabels } from "@/lib/crowd-predictions";
import { getCachedCrowdPreview } from "@/lib/home-sections";
import type { Locale } from "@/i18n/routing";

type HomeCrowdPreviewProps = { locale: Locale };

export async function HomeCrowdPreview({ locale }: HomeCrowdPreviewProps) {
  const t = await getTranslations("home");
  const crowdPreview = await getCachedCrowdPreview(locale);

  if (!crowdPreview) return null;

  return (
    <Link href={`/${locale}/crowd`} className="block rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold text-sky-300">{t("crowdPick")}</p>
      <p className="mt-2 font-bold text-white">
        {crowdTeamLabels(crowdPreview.match, locale).home} vs{" "}
        {crowdTeamLabels(crowdPreview.match, locale).away}
      </p>
      <p className="mt-2 text-sm text-white/60">
        {crowdPreview.homePct}% · {crowdPreview.drawPct}% · {crowdPreview.awayPct}%
      </p>
    </Link>
  );
}
