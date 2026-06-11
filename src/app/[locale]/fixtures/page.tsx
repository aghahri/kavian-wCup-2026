import { getTranslations, setRequestLocale } from "next-intl/server";
import { MatchCard } from "@/components/MatchCard";
import { getCurrentUser } from "@/lib/auth";
import { getAwayTeamName, getHomeTeamName, getStageName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function FixturesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fixtures");
  const user = await getCurrentUser();

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
  });

  const predictions = user
    ? await prisma.prediction.findMany({ where: { userId: user.id } })
    : [];

  const predictionMap = new Map(predictions.map((p) => [p.matchId, p]));
  const upcoming = matches.filter((m) => !m.isFinished);
  const finished = matches.filter((m) => m.isFinished);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
            {t("noUpcoming")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeamFa={getHomeTeamName(match, locale)}
                awayTeamFa={getAwayTeamName(match, locale)}
                stage={getStageName(match, locale)}
                kickoffAt={match.kickoffAt}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                isFinished={match.isFinished}
                locale={locale}
                userPrediction={predictionMap.get(match.id) ?? null}
                showPredictLink
              />
            ))}
          </div>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white/70">{t("finished")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {finished.map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeamFa={getHomeTeamName(match, locale)}
                awayTeamFa={getAwayTeamName(match, locale)}
                stage={getStageName(match, locale)}
                kickoffAt={match.kickoffAt}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                isFinished={match.isFinished}
                locale={locale}
                userPrediction={predictionMap.get(match.id) ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
