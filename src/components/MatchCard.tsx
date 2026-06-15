import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MatchCountdown } from "@/components/MatchCountdown";
import { MatchStatusBadge } from "@/components/MatchStatusBadge";
import { TeamFlag } from "@/components/TeamFlag";
import { formatDate, isPredictionOpen } from "@/lib/format";
import { hasHighlights, highlightsWatchUrl } from "@/lib/highlights";
import { getMatchStatus } from "@/lib/match-status";
import type { Locale } from "@/i18n/routing";

type MatchCardProps = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFa: string;
  awayTeamFa: string;
  stage: string;
  kickoffAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  locale: Locale;
  userPrediction?: { homeScore: number; awayScore: number; points: number } | null;
  showPredictLink?: boolean;
  featured?: boolean;
  scoreVerifiedAt?: Date | null;
  scoreSourceName?: string | null;
  scoreSourceUrl?: string | null;
  highlightsUrl?: string | null;
  highlightsEmbedUrl?: string | null;
  aiRefreshedAt?: Date | null;
};

export async function MatchCard({
  id,
  homeTeam,
  awayTeam,
  homeTeamFa,
  awayTeamFa,
  stage,
  kickoffAt,
  homeScore,
  awayScore,
  isFinished,
  locale,
  userPrediction,
  showPredictLink = false,
  featured = false,
  scoreVerifiedAt,
  scoreSourceName,
  scoreSourceUrl,
  highlightsUrl,
  highlightsEmbedUrl,
  aiRefreshedAt,
}: MatchCardProps) {
  const t = await getTranslations({ locale, namespace: "match" });
  const tc = await getTranslations({ locale, namespace: "matchCenter" });
  const tp = await getTranslations({ locale, namespace: "predict" });
  const open = isPredictionOpen(kickoffAt, isFinished);
  const status = getMatchStatus(kickoffAt, isFinished);
  const kickedOff = kickoffAt.getTime() < Date.now();
  const missingScore = kickedOff && (homeScore === null || awayScore === null || !isFinished);

  const isVerified = Boolean(scoreVerifiedAt);
  const hl = hasHighlights(highlightsUrl, highlightsEmbedUrl);
  const watchUrl = highlightsWatchUrl(highlightsUrl, highlightsEmbedUrl);
  const aiUpdated = Boolean(aiRefreshedAt);

  const statusLabels = {
    upcoming: t("statusUpcoming"),
    live: t("statusLive"),
    finished: t("statusFinished"),
  };

  const countdownLabels = {
    days: t("countdownDays"),
    hours: t("countdownHours"),
    minutes: t("countdownMinutes"),
    seconds: t("countdownSeconds"),
    started: t("countdownStarted"),
  };

  return (
    <article
      className={`rounded-2xl border bg-white/5 p-4 shadow-lg backdrop-blur-sm transition hover:border-emerald-500/30 ${
        featured ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-white/10"
      } ${status === "live" ? "border-red-500/30" : ""}`}
    >
      <Link href={`/${locale}/matches/${id}`} className="block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
              {stage}
            </span>
            <MatchStatusBadge kickoffAt={kickoffAt} isFinished={isFinished} labels={statusLabels} />
            {isFinished && isVerified && (
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-200">✓</span>
            )}
            {isFinished && hl && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">🎬</span>
            )}
            {isFinished && aiUpdated && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">🤖</span>
            )}
          </div>
          <span className="text-xs text-white/60">{formatDate(kickoffAt, locale)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={homeTeam} size={featured ? 40 : 32} />
            <p className="text-base font-bold text-white">{homeTeamFa}</p>
            {isFinished && homeScore !== null && (
              <p className="text-2xl font-black text-emerald-300">{homeScore}</p>
            )}
          </div>
          <div className="text-sm font-bold text-white/50">{t("vs")}</div>
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={awayTeam} size={featured ? 40 : 32} />
            <p className="text-base font-bold text-white">{awayTeamFa}</p>
            {isFinished && awayScore !== null && (
              <p className="text-2xl font-black text-emerald-300">{awayScore}</p>
            )}
          </div>
        </div>
      </Link>

      {status === "upcoming" && (
        <div className="mt-4">
          <MatchCountdown
            targetIso={kickoffAt.toISOString()}
            locale={locale}
            labels={countdownLabels}
            compact={!featured}
          />
        </div>
      )}

      {kickedOff && missingScore && (
        <p className="mt-2 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-xs text-amber-200">
          {tc("missingScoreWarning")}
        </p>
      )}

      {userPrediction && (
        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-center text-sm text-white/80">
          {tp("yourPrediction", {
            home: userPrediction.homeScore,
            away: userPrediction.awayScore,
          })}
          {isFinished && (
            <span className="ms-2 text-emerald-300">
              {tp("pointsEarned", { points: userPrediction.points })}
            </span>
          )}
        </div>
      )}

      {isFinished && isVerified && scoreSourceUrl && (
        <p className="mt-2 text-center text-xs text-white/50">
          <a href={scoreSourceUrl} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">
            ✓ {tc("verifiedResult")} — {scoreSourceName ?? tc("source")}
          </a>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`text-xs font-medium ${
            isFinished ? "text-white/50" : open ? "text-emerald-300" : "text-amber-300"
          }`}
        >
          {isFinished ? t("finished") : open ? t("open") : t("closed")}
        </span>
        <div className="flex flex-wrap gap-2">
          {isFinished && hl && watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/30"
            >
              {tc("watchHighlights")}
            </a>
          )}
          <Link
            href={`/${locale}/matches/${id}`}
            className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            {tc("viewMatch")}
          </Link>
          {showPredictLink && open && (
            <Link
              href={`/${locale}/predict?match=${id}`}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-400"
            >
              {t("predict")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
