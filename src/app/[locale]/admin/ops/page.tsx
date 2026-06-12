import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminRefreshMatchesButton } from "@/components/AdminRefreshMatchesButton";
import { getAdminOpsStats } from "@/lib/admin-ops";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOpsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const stats = await getAdminOpsStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("opsTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("opsSubtitle")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("opsNeedsScore"), value: stats.needsScore },
          { label: t("opsAiGenerated"), value: stats.aiCount },
          { label: t("opsLeaguesToday"), value: stats.leaguesToday },
          { label: t("opsOtpSuccess"), value: `${stats.otpSuccessRate}%` },
          { label: t("referralClicks"), value: stats.referralClicks },
          { label: t("referralVerified"), value: stats.referralVerified },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">{item.value}</p>
            <p className="mt-1 text-sm text-white/60">{item.label}</p>
          </div>
        ))}
      </div>

      <AdminRefreshMatchesButton label={t("opsRefreshAll")} />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("opsRecentFinished")}</h2>
        {stats.recentlyFinished.length === 0 ? (
          <p className="text-sm text-white/50">{t("opsNoFinished")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.recentlyFinished.map((m) => (
              <li key={m.id} className="flex justify-between text-sm">
                <span className="text-white">
                  {m.homeTeamFa} vs {m.awayTeamFa}
                </span>
                <span className="text-emerald-300">
                  {m.homeScore} - {m.awayScore}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
