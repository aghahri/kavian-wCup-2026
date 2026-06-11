import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatNumber } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminPredictionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const predictions = await prisma.prediction.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      match: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("predictions")}</h1>
          <p className="mt-1 text-sm text-white/70">
            {formatNumber(predictions.length, locale)} total
          </p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <div className="space-y-3">
        {predictions.map((prediction) => (
          <article
            key={prediction.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">{prediction.user.name}</p>
                <p className="text-xs text-white/50" dir="ltr">
                  {prediction.user.phone}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  prediction.match.isFinished
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-amber-500/20 text-amber-200"
                }`}
              >
                {prediction.match.isFinished ? "Done" : "Pending"}
              </span>
            </div>

            <p className="mt-3 text-sm text-white/80">
              {getHomeTeamName(prediction.match, locale)} -{" "}
              {getAwayTeamName(prediction.match, locale)}
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="text-white">
                Pick:{" "}
                <strong>
                  {prediction.homeScore} - {prediction.awayScore}
                </strong>
              </span>
              {prediction.match.isFinished &&
                prediction.match.homeScore !== null &&
                prediction.match.awayScore !== null && (
                  <>
                    <span className="text-white/60">
                      Result: {prediction.match.homeScore} - {prediction.match.awayScore}
                    </span>
                    <span className="font-bold text-emerald-300">
                      {formatNumber(prediction.points, locale)} pts
                    </span>
                  </>
                )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
