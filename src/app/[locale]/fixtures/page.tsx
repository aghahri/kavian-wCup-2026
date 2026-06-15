import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/EmptyState";
import { MatchCard } from "@/components/MatchCard";
import { ShareButtons } from "@/components/ShareButtons";
import { getSiteUrl } from "@/lib/share";
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
  const ts = await getTranslations("share");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <ShareButtons
          text={t("shareText")}
          url={`${getSiteUrl()}/${locale}/fixtures`}
          labels={{
            share: ts("title"),
            telegram: ts("telegram"),
            whatsapp: ts("whatsapp"),
            x: ts("x"),
            facebook: ts("facebook"),
          }}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title={t("noUpcoming")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
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
                scoreVerifiedAt={match.scoreVerifiedAt}
                scoreSourceName={match.scoreSourceName}
                scoreSourceUrl={match.scoreSourceUrl}
                highlightsUrl={match.highlightsUrl}
                highlightsEmbedUrl={match.highlightsEmbedUrl}
                aiRefreshedAt={match.aiRefreshedAt}
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
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                homeTeamFa={getHomeTeamName(match, locale)}
                awayTeamFa={getAwayTeamName(match, locale)}
                stage={getStageName(match, locale)}
                kickoffAt={match.kickoffAt}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                isFinished={match.isFinished}
                locale={locale}
                userPrediction={predictionMap.get(match.id) ?? null}
                scoreVerifiedAt={match.scoreVerifiedAt}
                scoreSourceName={match.scoreSourceName}
                scoreSourceUrl={match.scoreSourceUrl}
                highlightsUrl={match.highlightsUrl}
                highlightsEmbedUrl={match.highlightsEmbedUrl}
                aiRefreshedAt={match.aiRefreshedAt}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
