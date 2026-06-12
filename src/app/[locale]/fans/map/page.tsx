import { getTranslations, setRequestLocale } from "next-intl/server";
import { FanMapGrid } from "@/components/FanMapGrid";
import { PageHeader } from "@/components/PageHeader";
import { buildFanMapStats } from "@/lib/fan-map";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FanMapPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fans");

  const stats = await buildFanMapStats();
  const totalFans = stats.reduce((s, c) => s + c.fanCount, 0);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-600/10 p-5 text-center">
        <p className="text-3xl font-black text-emerald-300">{totalFans}</p>
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
