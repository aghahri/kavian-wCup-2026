import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TeamFlag } from "@/components/TeamFlag";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import {
  buildPredictionStats,
  formatAiPredictionLine,
  getLocalizedReasoning,
  RISK_LABELS,
  SURPRISE_LABELS,
} from "@/lib/ai/football-analysis";
import { deriveMatchState, isStalePrematchAi } from "@/lib/matches/match-state";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchAiPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ai");
  const tc = await getTranslations("matchCenter");

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  const state = deriveMatchState(match);
  const predictions = await prisma.prediction.findMany({
    where: { matchId: id },
    select: { homeScore: true, awayScore: true },
  });
  const stats = buildPredictionStats(predictions, match);
  const analysis = await getOrCreateMatchAnalysis(match);

  if (!analysis || isStalePrematchAi(match)) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Link href={`/${locale}/matches/${id}`} className="text-sm text-emerald-300 hover:underline">
          ← {t("title")}
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm leading-7 text-white/70">{tc("aiFinalAfterResult")}</p>
        </div>
      </div>
    );
  }

  const isFinished = state === "finished_unverified" || state === "finished_verified";
  const isLive = state === "live" || state === "needs_result";

  const risk = RISK_LABELS[analysis.riskLevel as keyof typeof RISK_LABELS];
  const riskLabel = locale === "fa" ? risk.fa : locale === "ar" ? risk.ar : risk.en;
  const reasoning = getLocalizedReasoning(analysis, locale);
  const surpriseLevel = analysis.riskLevel === "high" && isFinished ? "high" : "low";
  const surprise = SURPRISE_LABELS[surpriseLevel as keyof typeof SURPRISE_LABELS];
  const surpriseLabel = locale === "fa" ? surprise.fa : locale === "ar" ? surprise.ar : surprise.en;

  const lessonLine = reasoning.length > 4 ? reasoning[reasoning.length - 1] : null;
  const mainReasoning = lessonLine ? reasoning.slice(0, -1) : reasoning;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/${locale}/matches/${id}`} className="text-sm text-emerald-300 hover:underline">
        ← {t("title")}
      </Link>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center gap-4">
          <TeamFlag teamName={match.homeTeam} size={48} />
          <span className="text-white/40">vs</span>
          <TeamFlag teamName={match.awayTeam} size={48} />
        </div>
        <h1 className="mt-4 text-center text-xl font-black text-white">
          {getHomeTeamName(match, locale)} vs {getAwayTeamName(match, locale)}
        </h1>

        {isLive && (
          <p className="mt-3 text-center text-sm font-semibold text-red-300">● LIVE</p>
        )}

        <p className="mt-6 text-center text-lg font-black text-emerald-300">
          {isFinished ? t("result") : t("prediction")}:{" "}
          {formatAiPredictionLine(
            match,
            locale,
            analysis.suggestedHomeScore,
            analysis.suggestedAwayScore
          )}
        </p>
        <p className="mt-2 text-center text-sm text-white/60">
          {t("risk")}: {riskLabel}
          {isFinished && stats.total > 0 && (
            <> · {t("surpriseStat", { wrong: stats.wrongPct, exact: stats.exactCount })}</>
          )}
        </p>

        {!isFinished && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{analysis.homeWinPct}%</p>
              <p className="text-xs text-white/50">{t("homeWin")}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{analysis.drawPct}%</p>
              <p className="text-xs text-white/50">{t("draw")}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{analysis.awayWinPct}%</p>
              <p className="text-xs text-white/50">{t("awayWin")}</p>
            </div>
          </div>
        )}

        {isFinished && stats.total > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-black text-emerald-300">{stats.exactCount}</p>
              <p className="text-white/50">Exact</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-black text-emerald-300">{stats.wrongPct}%</p>
              <p className="text-white/50">Wrong</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-black text-amber-300">{surpriseLabel}</p>
              <p className="text-white/50">{t("surprise")}</p>
            </div>
          </div>
        )}

        <h2 className="mt-6 text-sm font-bold text-white/80">{t("reasoning")}</h2>
        <ul className="mt-2 space-y-2 text-sm leading-7 text-white/70">
          {mainReasoning.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>

        {lessonLine && isFinished && (
          <div className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3">
            <p className="text-xs font-bold text-amber-200">{t("lesson")}</p>
            <p className="mt-1 text-sm leading-7 text-amber-100">{lessonLine}</p>
          </div>
        )}

        {isFinished && (
          <Link
            href={`/${locale}/matches/${id}/summary`}
            className="mt-6 block text-center text-sm text-emerald-300 hover:underline"
          >
            {t("viewDetail")} →
          </Link>
        )}
      </div>
    </div>
  );
}
