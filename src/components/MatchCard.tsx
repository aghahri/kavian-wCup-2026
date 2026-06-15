import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MatchCountdown } from "@/components/MatchCountdown";
import { MatchDisplayBadge } from "@/components/MatchDisplayBadge";
import { MatchHighlightReminder } from "@/components/MatchHighlightReminder";
import { MatchResultReminder } from "@/components/MatchResultReminder";
import { TeamFlag } from "@/components/TeamFlag";
import { formatDate, isPredictionOpen } from "@/lib/format";
import { hasHighlights, highlightsWatchUrl } from "@/lib/highlights";
import { getMatchDisplayState } from "@/lib/match-status";
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

  const matchLike = {
    kickoffAt,
    isFinished,
    homeScore,
    awayScore,
    scoreVerifiedAt,
  };
  const displayState = getMatchDisplayState(matchLike);
  const open = isPredictionOpen(kickoffAt, isFinished);
  const isFinishedDisplay =
    displayState === "finished_unverified" || displayState === "finished_verified";

  const hl = hasHighlights(highlightsUrl, highlightsEmbedUrl);
  const watchUrl = highlightsWatchUrl(highlightsUrl, highlightsEmbedUrl);
  const aiUpdated = Boolean(aiRefreshedAt);

  const badgeLabels = {
    upcoming: t("statusUpcoming"),
    live: t("statusLive"),
    needsResult: tc("scoreNotRecorded"),
    awaitingVerification: tc("awaitingVerification"),
    verified: tc("verifiedResult"),
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
      } ${displayState === "live_or_needs_result" ? "border-amber-500/25" : ""}`}
    >
      <Link href={`/${locale}/matches/${id}`} className="block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
              {stage}
            </span>
            <MatchDisplayBadge match={matchLike} labels={badgeLabels} />
            {isFinishedDisplay && hl && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">🎬</span>
            )}
            {isFinishedDisplay && aiUpdated && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">🤖</span>
            )}
          </div>
          <span className="text-xs text-white/60">{formatDate(kickoffAt, locale)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={homeTeam} size={featured ? 40 : 32} />
            <p className="text-base font-bold text-white">{homeTeamFa}</p>
            {homeScore !== null && isFinishedDisplay && (
              <p className="text-2xl font-black text-emerald-300">{homeScore}</p>
            )}
          </div>
          <div className="text-sm font-bold text-white/50">{t("vs")}</div>
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={awayTeam} size={featured ? 40 : 32} />
            <p className="text-base font-bold text-white">{awayTeamFa}</p>
            {awayScore !== null && isFinishedDisplay && (
              <p className="text-2xl font-black text-emerald-300">{awayScore}</p>
            )}
          </div>
        </div>
      </Link>

      {displayState === "upcoming" && (
        <div className="mt-4">
          <MatchCountdown
            targetIso={kickoffAt.toISOString()}
            locale={locale}
            labels={countdownLabels}
            compact={!featured}
          />
        </div>
      )}

      {displayState === "live_or_needs_result" && (
        <MatchResultReminder match={matchLike} message={tc("resultNotRecordedYet")} className="mt-3" />
      )}

      {isFinishedDisplay && (
        <MatchHighlightReminder match={matchLike} message={tc("highlightsNotAddedYet")} className="mt-3" />
      )}

      {userPrediction && (
        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-center text-sm text-white/80">
          {tp("yourPrediction", {
            home: userPrediction.homeScore,
            away: userPrediction.awayScore,
          })}
          {isFinishedDisplay && (
            <span className="ms-2 text-emerald-300">
              {tp("pointsEarned", { points: userPrediction.points })}
            </span>
          )}
        </div>
      )}

      {isFinishedDisplay && scoreSourceUrl && (
        <p className="mt-2 text-center text-xs">
          <a
            href={scoreSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:underline"
          >
            {scoreSourceName ?? tc("source")}
          </a>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`text-xs font-medium ${
            displayState === "upcoming" && open
              ? "text-emerald-300"
              : "text-white/50"
          }`}
        >
          {displayState === "upcoming" && open
            ? t("open")
            : isFinishedDisplay
              ? t("finished")
              : t("closed")}
        </span>
        <div className="flex flex-wrap gap-2">
          {isFinishedDisplay && hl && watchUrl && (
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
          {showPredictLink && open && displayState === "upcoming" && (
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
