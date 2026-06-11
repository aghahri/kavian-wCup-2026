import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function LeaderboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      predictions: {
        select: { points: true, match: { select: { isFinished: true } } },
      },
    },
  });

  const rows = users
    .map((user) => {
      const totalPoints = user.predictions.reduce((sum, p) => sum + p.points, 0);
      const finishedPredictions = user.predictions.filter((p) => p.match.isFinished).length;
      const exactScores = user.predictions.filter((p) => p.points === 5).length;
      return { id: user.id, name: user.name, totalPoints, finishedPredictions, exactScores };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.exactScores - a.exactScores);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white/60 sm:grid">
          <span>{t("rank")}</span>
          <span>{t("name")}</span>
          <span>{t("totalPoints")}</span>
          <span>{t("exactScores")}</span>
          <span>{t("finishedMatches")}</span>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-center text-white/60">{t("empty")}</p>
        ) : (
          <ul>
            {rows.map((row, index) => (
              <li
                key={row.id}
                className="grid grid-cols-1 gap-2 border-b border-white/5 px-4 py-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:contents">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-amber-400/20 text-amber-200"
                        : index === 1
                          ? "bg-slate-300/20 text-slate-200"
                          : index === 2
                            ? "bg-orange-400/20 text-orange-200"
                            : "bg-white/10 text-white/80"
                    }`}
                  >
                    {formatNumber(index + 1, locale)}
                  </span>
                  <span className="font-bold text-white">{row.name}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm sm:contents">
                  <span className="font-black text-emerald-300 sm:text-center">
                    {formatNumber(row.totalPoints, locale)}
                  </span>
                  <span className="text-white/70 sm:text-center">
                    {formatNumber(row.exactScores, locale)}
                  </span>
                  <span className="text-white/70 sm:text-center">
                    {formatNumber(row.finishedPredictions, locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
