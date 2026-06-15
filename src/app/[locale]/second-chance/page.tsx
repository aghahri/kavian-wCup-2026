import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import {
  buildSecondChanceLeaderboard,
  getSecondChanceStats,
  type CompetitionId,
} from "@/lib/second-chance";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

const COMPETITIONS: { id: CompetitionId; labelKey: string }[] = [
  { id: "today", labelKey: "todayChampion" },
  { id: "week", labelKey: "weekChampion" },
  { id: "knockout", labelKey: "knockoutChampion" },
  { id: "final", labelKey: "finalChampion" },
];

export default async function SecondChancePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("secondChance");

  const stats = await getSecondChanceStats();
  const boards = await Promise.all(
    COMPETITIONS.map(async (c) => ({
      ...c,
      rows: await buildSecondChanceLeaderboard(c.id, 5),
    }))
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-[#0b1f3a] to-[#071526] p-6 text-center sm:p-10">
        <p className="text-sm font-semibold text-amber-200">{t("badge")}</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-3 text-lg text-emerald-200">{t("heroSubtitle")}</p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { v: stats.daysLeft, l: t("daysLeft") },
            { v: stats.remainingMatches, l: t("matchesLeft") },
            { v: stats.remainingPoints, l: t("pointsLeft") },
          ].map((item) => (
            <div key={item.l} className="rounded-xl bg-black/30 p-4">
              <p className="text-2xl font-black text-emerald-300">{formatNumber(item.v, locale)}</p>
              <p className="mt-1 text-xs text-white/50">{item.l}</p>
            </div>
          ))}
        </div>
        <Link
          href={`/${locale}/predict`}
          className="mt-8 inline-block rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white hover:bg-emerald-400"
        >
          {t("cta")}
        </Link>
      </section>

      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-6 md:grid-cols-2">
        {boards.map((board) => (
          <section key={board.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-bold text-white">{t(board.labelKey)}</h2>
            {board.rows.length === 0 ? (
              <p className="text-sm text-white/50">{t("emptyBoard")}</p>
            ) : (
              <ul className="space-y-2">
                {board.rows.map((row) => (
                  <li key={row.userId} className="flex justify-between text-sm">
                    <span className="text-white">
                      {formatNumber(row.rank, locale)}. {row.name}
                    </span>
                    <span className="font-bold text-emerald-300">
                      {formatNumber(row.points, locale)} {t("pts")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
