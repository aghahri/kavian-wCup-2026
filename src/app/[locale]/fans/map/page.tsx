import { getTranslations, setRequestLocale } from "next-intl/server";
import { FanMapGrid } from "@/components/FanMapGrid";
import { buildFanMapStats } from "@/lib/fan-map";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function FanMapPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fans");

  const stats = await buildFanMapStats();
  const totalFans = stats.reduce((s, c) => s + c.fanCount, 0);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-[#0b1f3a] p-6 sm:p-8">
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        <p className="mt-4 text-3xl font-black text-emerald-300">{totalFans}</p>
        <p className="text-sm text-white/50">{t("totalFans")}</p>
      </div>
      <FanMapGrid
        stats={stats}
        locale={locale}
        fanLabel={t("fans")}
        favoriteLabel={t("favoriteTeam")}
        emptyLabel={t("empty")}
      />
    </div>
  );
}
