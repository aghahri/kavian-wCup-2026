import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FanMapGrid } from "@/components/FanMapGrid";
import { getCurrentUser } from "@/lib/auth";
import { buildFanMapStats } from "@/lib/fan-map";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function AdminFansPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const stats = await buildFanMapStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">{t("fans")}</h1>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>
      <FanMapGrid
        stats={stats}
        locale={locale}
        fanLabel="fans"
        favoriteLabel="Favorite"
        emptyLabel="No data"
      />
    </div>
  );
}
