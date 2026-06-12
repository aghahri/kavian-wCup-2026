import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminMatchdayActions } from "@/components/AdminMatchdayActions";
import { getMatchdayStats } from "@/lib/admin-matchday";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMatchdayPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const stats = await getMatchdayStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("matchdayTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("matchdaySubtitle")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("matchdayToday"), value: stats.matchesToday.length },
          { label: t("matchdayMissing"), value: stats.missingScores },
          { label: t("matchdayNeedsAi"), value: stats.needsAiRefresh },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">{formatNumber(item.value, locale)}</p>
            <p className="mt-1 text-sm text-white/60">{item.label}</p>
          </div>
        ))}
      </div>

      <AdminMatchdayActions
        closeLabel={t("matchdayClosePredictions")}
        refreshLabel={t("matchdayRefreshSummaries")}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("matchdayTodayList")}</h2>
        {stats.matchesToday.length === 0 ? (
          <p className="text-sm text-white/50">{t("matchdayNoToday")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.matchesToday.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-white">
                  {m.homeTeamFa} vs {m.awayTeamFa}
                </span>
                <span className="text-white/50">{formatDate(m.kickoffAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("opsRecentFinished")}</h2>
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
      </section>
    </div>
  );
}
