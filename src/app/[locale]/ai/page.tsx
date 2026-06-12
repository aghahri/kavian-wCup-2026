import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/EmptyState";
import { TeamFlag } from "@/components/TeamFlag";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import {
  formatAiPredictionLine,
  getLocalizedReasoning,
  RISK_LABELS,
} from "@/lib/ai/football-analysis";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function AiPulsePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ai");

  const matches = await prisma.match.findMany({
    where: { isFinished: false },
    orderBy: { kickoffAt: "asc" },
    take: 12,
  });

  const analyses = await Promise.all(
    matches.map(async (match) => ({
      match,
      analysis: await getOrCreateMatchAnalysis(match),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      {analyses.length === 0 ? (
        <EmptyState icon="🤖" title={t("empty")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {analyses.map(({ match, analysis }) => {
            const risk = RISK_LABELS[analysis.riskLevel as keyof typeof RISK_LABELS];
            const riskLabel = locale === "fa" ? risk.fa : locale === "ar" ? risk.ar : risk.en;
            const reasoning = getLocalizedReasoning(analysis, locale);
            return (
              <article
                key={match.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center justify-center gap-3">
                  <TeamFlag teamName={match.homeTeam} size={32} />
                  <span className="text-white/40">vs</span>
                  <TeamFlag teamName={match.awayTeam} size={32} />
                </div>
                <p className="mt-3 text-center font-bold text-white">
                  {getHomeTeamName(match, locale)} vs {getAwayTeamName(match, locale)}
                </p>
                <p className="mt-4 text-center text-lg font-black text-emerald-300">
                  {t("prediction")}:{" "}
                  {formatAiPredictionLine(
                    match,
                    locale,
                    analysis.suggestedHomeScore,
                    analysis.suggestedAwayScore
                  )}
                </p>
                <p className="mt-2 text-center text-sm text-white/60">
                  {t("risk")}: {riskLabel}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="font-bold text-white">{analysis.homeWinPct}%</p>
                    <p className="text-white/50">{getHomeTeamName(match, locale)}</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="font-bold text-white">{analysis.drawPct}%</p>
                    <p className="text-white/50">{t("draw")}</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <p className="font-bold text-white">{analysis.awayWinPct}%</p>
                    <p className="text-white/50">{getAwayTeamName(match, locale)}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 text-xs leading-6 text-white/60">
                  {reasoning.slice(0, 3).map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/matches/${match.id}/ai`}
                  className="mt-4 block text-center text-sm text-emerald-300 hover:underline"
                >
                  {t("viewDetail")} →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
