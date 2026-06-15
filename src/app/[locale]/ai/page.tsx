import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { RecordActivity } from "@/components/RecordActivity";
import { TeamFlag } from "@/components/TeamFlag";
import { buildEngagementPicks } from "@/lib/ai/engagement-picks";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import {
  formatAiPredictionLine,
  getLocalizedReasoning,
  RISK_LABELS,
  buildPredictionStats,
} from "@/lib/ai/football-analysis";
import { hasHighlights, highlightsWatchUrl } from "@/lib/highlights";
import { deriveMatchState } from "@/lib/matches/match-state";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AiPulsePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ai");
  const tc = await getTranslations("matchCenter");

  const allMatches = await prisma.match.findMany({ orderBy: { kickoffAt: "desc" } });

  const upcoming = allMatches.filter((m) => deriveMatchState(m) === "upcoming");
  const finished = allMatches.filter((m) => {
    const s = deriveMatchState(m);
    return s === "finished_unverified" || s === "finished_verified";
  });

  const upcomingAnalyses = (
    await Promise.all(
      upcoming.slice(0, 8).map(async (match) => ({
        match,
        analysis: await getOrCreateMatchAnalysis(match),
      }))
    )
  ).filter((row): row is { match: (typeof upcoming)[number]; analysis: NonNullable<Awaited<ReturnType<typeof getOrCreateMatchAnalysis>>> } => row.analysis !== null);

  const finishedAnalyses = (
    await Promise.all(
      finished.slice(0, 8).map(async (match) => {
        const predictions = await prisma.prediction.findMany({
          where: { matchId: match.id },
          select: { homeScore: true, awayScore: true },
        });
        const stats = buildPredictionStats(predictions, match);
        return { match, analysis: await getOrCreateMatchAnalysis(match), stats };
      })
    )
  ).filter((row): row is typeof row & { analysis: NonNullable<typeof row.analysis> } => row.analysis !== null);

  const surprises = [...finishedAnalyses]
    .sort((a, b) => b.stats.wrongPct - a.stats.wrongPct)
    .slice(0, 4);

  const engagement = await buildEngagementPicks(locale);

  function riskLabel(level: string) {
    const r = RISK_LABELS[level as keyof typeof RISK_LABELS];
    return locale === "fa" ? r.fa : locale === "ar" ? r.ar : r.en;
  }

  return (
    <div className="space-y-10">
      <RecordActivity type="ai_visit" />
      <PageHeader title={t("title")} subtitle={t("subtitle")} badge={t("badge")} />

      {engagement && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { key: "pickOfDay", pick: engagement.pickOfDay, label: t("pickOfDay"), icon: "⭐" },
            { key: "upsetRisk", pick: engagement.upsetRisk, label: t("upsetRisk"), icon: "⚡" },
            { key: "safest", pick: engagement.safest, label: t("safestPick"), icon: "🛡️" },
          ].map(({ key, pick, label, icon }) => (
            <Link
              key={key}
              href={`/${locale}/matches/${pick.match.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-500/40"
            >
              <p className="text-xs font-semibold text-emerald-300">
                {icon} {label}
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                {getHomeTeamName(pick.match, locale)} vs {getAwayTeamName(pick.match, locale)}
              </p>
              <p className="mt-2 text-lg font-black text-emerald-300">
                {formatAiPredictionLine(
                  pick.match,
                  locale,
                  pick.suggestedHomeScore,
                  pick.suggestedAwayScore
                )}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {t("risk")}: {pick.riskLabel}
              </p>
            </Link>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">{t("upcomingSection")}</h2>
        {upcomingAnalyses.length === 0 ? (
          <EmptyState icon="🤖" title={t("emptyUpcoming")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingAnalyses.map(({ match, analysis }) => (
              <AiCard
                key={match.id}
                match={match}
                analysis={analysis}
                locale={locale}
                t={t}
                tc={tc}
                riskLabel={riskLabel(analysis.riskLevel)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white">{t("finishedSection")}</h2>
        {finishedAnalyses.length === 0 ? (
          <EmptyState icon="🏁" title={t("emptyFinished")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {finishedAnalyses.map(({ match, analysis }) => (
              <AiCard
                key={match.id}
                match={match}
                analysis={analysis}
                locale={locale}
                t={t}
                tc={tc}
                riskLabel={riskLabel(analysis.riskLevel)}
                finished
              />
            ))}
          </div>
        )}
      </section>

      {surprises.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-amber-300">{t("surprisesSection")}</h2>
          <div className="space-y-3">
            {surprises.map(({ match, stats }) => (
              <Link
                key={match.id}
                href={`/${locale}/matches/${match.id}`}
                className="block rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 hover:border-amber-400/40"
              >
                <p className="font-bold text-white">
                  {getHomeTeamName(match, locale)} {match.homeScore} - {match.awayScore}{" "}
                  {getAwayTeamName(match, locale)}
                </p>
                <p className="mt-1 text-sm text-amber-200">
                  {t("surpriseStat", { wrong: stats.wrongPct, exact: stats.exactCount })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AiCard({
  match,
  analysis,
  locale,
  t,
  tc,
  riskLabel,
  finished,
}: {
  match: Parameters<typeof getHomeTeamName>[0] & {
    homeScore: number | null;
    awayScore: number | null;
    scoreVerifiedAt?: Date | null;
    scoreSourceName?: string | null;
    scoreSourceUrl?: string | null;
    highlightsUrl?: string | null;
    highlightsEmbedUrl?: string | null;
    kickoffAt: Date;
    isFinished: boolean;
  };
  analysis: NonNullable<Awaited<ReturnType<typeof getOrCreateMatchAnalysis>>>;
  locale: Locale;
  t: (key: string, values?: Record<string, string | number>) => string;
  tc: (key: string) => string;
  riskLabel: string;
  finished?: boolean;
}) {
  const reasoning = getLocalizedReasoning(analysis, locale);
  const surprise = analysis.riskLevel === "high" && finished;
  const hl = hasHighlights(match.highlightsUrl, match.highlightsEmbedUrl);
  const watchUrl = highlightsWatchUrl(match.highlightsUrl, match.highlightsEmbedUrl);
  const verified = Boolean(match.scoreVerifiedAt);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-center gap-3">
        <TeamFlag teamName={match.homeTeam} size={32} />
        <span className="text-white/40">vs</span>
        <TeamFlag teamName={match.awayTeam} size={32} />
      </div>
      <p className="mt-3 text-center font-bold text-white">
        {getHomeTeamName(match, locale)} vs {getAwayTeamName(match, locale)}
      </p>
      {finished && match.homeScore !== null && match.awayScore !== null && (
        <p className="mt-2 text-center text-2xl font-black text-emerald-300">
          {match.homeScore} - {match.awayScore}
        </p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
        {verified && <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-200">✓ {tc("verifiedResult")}</span>}
        {hl && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">🎬</span>}
      </div>
      {verified && match.scoreSourceUrl && (
        <p className="mt-2 text-center text-xs">
          <a href={match.scoreSourceUrl} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
            {match.scoreSourceName ?? tc("source")}
          </a>
        </p>
      )}
      <p className="mt-4 text-center text-lg font-black text-emerald-300">
        {finished ? t("result") : t("prediction")}:{" "}
        {formatAiPredictionLine(
          match,
          locale,
          analysis.suggestedHomeScore,
          analysis.suggestedAwayScore
        )}
      </p>
      <p className="mt-2 text-center text-sm text-white/60">
        {t("risk")}: {riskLabel}
        {surprise && ` · ${t("surprise")}`}
      </p>
      <ul className="mt-4 space-y-1 text-xs leading-6 text-white/60">
        {reasoning.slice(0, 4).map((line, i) => (
          <li key={i}>• {line}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {finished && hl && watchUrl && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-100"
          >
            {tc("watchHighlights")}
          </a>
        )}
        <Link
          href={`/${locale}/matches/${match.id}`}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-white/10"
        >
          {tc("viewMatch")} →
        </Link>
      </div>
    </article>
  );
}
