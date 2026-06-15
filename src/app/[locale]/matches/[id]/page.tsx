import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MatchCountdown } from "@/components/MatchCountdown";
import { MatchDisplayBadge } from "@/components/MatchDisplayBadge";
import { MatchHighlightReminder } from "@/components/MatchHighlightReminder";
import { MatchResultReminder } from "@/components/MatchResultReminder";
import { ShareButtons } from "@/components/ShareButtons";
import { TeamFlag } from "@/components/TeamFlag";
import { formatAiPredictionLine } from "@/lib/ai/football-analysis";
import { getCurrentUser } from "@/lib/auth";
import { crowdTeamLabels } from "@/lib/crowd-predictions";
import { formatDate } from "@/lib/format";
import {
  buildMatchCenterData,
  EVENT_ICONS,
  eventDescription,
} from "@/lib/match-center";
import { hasMatchScore } from "@/lib/match-status";
import { getSiteUrl } from "@/lib/share";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";

export default async function MatchCenterPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("matchCenter");
  const ts = await getTranslations("share");
  const user = await getCurrentUser();

  const data = await buildMatchCenterData(id, locale);
  if (!data) notFound();

  const {
    match,
    displayState,
    homeName,
    awayName,
    stage,
    winnerLabel,
    stats,
    analysis,
    crowd,
    summary,
    riskLabel,
    surpriseLabel,
    reasoning,
    lessonLine,
    embedUrl,
    goalEvents,
    predictionOpen,
    isVerified,
    hasHighlights,
    aiUpdated,
  } = data;

  const shareUrl = `${getSiteUrl()}/${locale}/matches/${id}`;
  const shareText =
    hasMatchScore(match)
      ? t("shareText", {
          home: homeName,
          away: awayName,
          score: `${match.homeScore}-${match.awayScore}`,
        })
      : t("shareTextUpcoming", { home: homeName, away: awayName });

  const badgeLabels = {
    upcoming: t("statusUpcoming"),
    live: t("statusLive"),
    needsResult: t("needsResult"),
    awaitingVerification: t("awaitingVerification"),
    verified: t("verifiedResult"),
    finished: t("statusFinished"),
  };

  const countdownLabels = {
    days: t("countdownDays"),
    hours: t("countdownHours"),
    minutes: t("countdownMinutes"),
    seconds: t("countdownSeconds"),
    started: t("countdownStarted"),
  };

  const labels = crowdTeamLabels(match, locale);
  const showScores = hasMatchScore(match);
  const isFinishedDisplay =
    displayState === "finished_unverified" || displayState === "finished_verified";

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/fixtures`}
        className="inline-block text-sm text-emerald-300 hover:underline"
      >
        ← {t("backToFixtures")}
      </Link>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
              {stage}
            </span>
            <MatchDisplayBadge match={match} labels={badgeLabels} />
            {hasHighlights && isFinishedDisplay && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                🎬 {t("highlightsAvailable")}
              </span>
            )}
            {aiUpdated && isFinishedDisplay && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                🤖 {t("aiUpdated")}
              </span>
            )}
          </div>
          <span className="text-xs text-white/50">{formatDate(match.kickoffAt, locale)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={match.homeTeam} size={52} />
            <p className="font-bold text-white">{homeName}</p>
            {showScores && (
              <p className="text-4xl font-black text-emerald-300">{match.homeScore}</p>
            )}
          </div>
          <div className="text-sm font-bold text-white/40">{t("vs")}</div>
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={match.awayTeam} size={52} />
            <p className="font-bold text-white">{awayName}</p>
            {showScores && (
              <p className="text-4xl font-black text-emerald-300">{match.awayScore}</p>
            )}
          </div>
        </div>

        {displayState === "upcoming" && (
          <div className="mt-4">
            <MatchCountdown
              targetIso={match.kickoffAt.toISOString()}
              locale={locale}
              labels={countdownLabels}
            />
          </div>
        )}

        {displayState === "live_or_needs_result" && (
          <div className="mt-4 space-y-2">
            <MatchResultReminder match={match} message={t("resultNotRecordedYet")} />
            <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-center">
              <p className="text-sm font-medium text-amber-100">{t("liveStartedMessage")}</p>
              <p className="text-xs text-amber-200/80">{t("awaitingResultVerification")}</p>
              {user?.isAdmin && (
                <Link
                  href={`/${locale}/admin/results?matchId=${match.id}`}
                  className="mt-2 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400"
                >
                  {t("submitResult")}
                </Link>
              )}
            </div>
          </div>
        )}

        {isFinishedDisplay && winnerLabel && (
          <p className="mt-4 text-center text-sm text-white/70">
            {t("winner")}: <span className="font-bold text-emerald-300">{winnerLabel}</span>
          </p>
        )}

        {displayState === "finished_unverified" && (
          <p className="mt-3 text-center text-xs text-amber-200">{t("awaitingSourceVerification")}</p>
        )}

        {isVerified && match.scoreSourceName && (
          <p className="mt-3 text-center text-xs text-white/50">
            {t("source")}:{" "}
            {match.scoreSourceUrl ? (
              <a
                href={match.scoreSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-300 hover:underline"
              >
                {match.scoreSourceName}
              </a>
            ) : (
              match.scoreSourceName
            )}
          </p>
        )}

        <p
          className={`mt-3 text-center text-xs font-medium ${
            predictionOpen && displayState === "upcoming"
              ? "text-emerald-300"
              : "text-amber-300"
          }`}
        >
          {displayState === "upcoming" && predictionOpen
            ? t("predictionsOpen")
            : t("predictionsClosed")}
        </p>
      </section>

      {crowd && crowd.total > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-bold text-sky-300">{t("crowdPredictions")}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{crowd.homePct}%</p>
              <p className="text-xs text-white/50">{labels.home}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{crowd.drawPct}%</p>
              <p className="text-xs text-white/50">{t("draw")}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <p className="font-black text-emerald-300">{crowd.awayPct}%</p>
              <p className="text-xs text-white/50">{labels.away}</p>
            </div>
          </div>
          {crowd.messageKey && isFinishedDisplay && (
            <p className="mt-3 text-center text-sm text-white/70">
              {t(crowd.messageKey, {
                pct: crowd.crowdCorrect ? 100 - crowd.wrongPct : crowd.wrongPct,
              })}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <h2 className="text-sm font-bold text-emerald-300">🤖 {t("aiAnalysis")}</h2>
        {displayState === "live_or_needs_result" ? (
          <p className="mt-3 text-center text-sm leading-7 text-white/70">{t("aiFinalAfterResult")}</p>
        ) : analysis ? (
          <>
            <p className="mt-2 text-center font-bold text-white">
              {formatAiPredictionLine(
                match,
                locale,
                analysis.suggestedHomeScore,
                analysis.suggestedAwayScore
              )}
            </p>
            <p className="mt-1 text-center text-xs text-white/50">
              {t("risk")}: {riskLabel}
              {isFinishedDisplay && stats.total > 0 && (
                <> · {t("exactCount", { count: stats.exactCount, total: stats.total })}</>
              )}
            </p>
            {isFinishedDisplay && (
              <p className="mt-1 text-center text-xs text-amber-200">
                {t("surprise")}: {surpriseLabel}
              </p>
            )}
            <ul className="mt-3 space-y-2 text-sm leading-7 text-white/70">
              {reasoning.map((line, i) => (
                <li key={i}>• {line}</li>
              ))}
            </ul>
            {lessonLine && (
              <div className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                {lessonLine}
              </div>
            )}
          </>
        ) : null}
      </section>

      {isFinishedDisplay && (
        <MatchHighlightReminder match={match} message={t("highlightsNotAddedYet")} className="mt-2" />
      )}

      {isFinishedDisplay && (embedUrl || match.highlightsUrl) && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-bold text-amber-200">🎬 {t("officialHighlights")}</h2>
          {embedUrl && (
            <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={embedUrl}
                title={t("watchHighlights")}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {match.highlightsUrl && (
            <a
              href={match.highlightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-sm font-bold text-amber-300 hover:underline"
            >
              {t("watchHighlights")} →
            </a>
          )}
        </section>
      )}

      {goalEvents.some((g) => g.sourceUrl) && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-bold text-white">{t("goals")}</h2>
          <ul className="mt-3 space-y-2">
            {goalEvents
              .filter((g) => g.sourceUrl)
              .map((g) => (
                <li key={g.id}>
                  <a
                    href={g.sourceUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-300 hover:underline"
                  >
                    <span>{EVENT_ICONS.goal}</span>
                    <span>
                      {g.minute != null ? `${g.minute}'` : ""} {eventDescription(g, locale)}
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      )}

      {match.events.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-bold text-white">{t("timeline")}</h2>
          <ul className="mt-3 space-y-3">
            {match.events.map((ev) => (
              <li key={ev.id} className="flex items-start gap-3 text-sm">
                <span className="text-lg">{EVENT_ICONS[ev.type] ?? "•"}</span>
                <div>
                  <p className="font-medium text-white">
                    {ev.minute != null ? `${ev.minute}'` : "—"} {eventDescription(ev, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary && summary.topExactPredictors.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-bold text-white">{t("topExactPredictors")}</h2>
          <ul className="mt-3 space-y-2">
            {summary.topExactPredictors.map((p, i) => (
              <li key={i} className="flex justify-between text-sm text-white/80">
                <span>{p.name}</span>
                <span className="font-mono text-emerald-300">
                  {p.homeScore}-{p.awayScore}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <ShareButtons
          text={shareText}
          url={shareUrl}
          labels={{
            share: ts("title"),
            telegram: ts("telegram"),
            whatsapp: ts("whatsapp"),
            x: ts("x"),
            facebook: ts("facebook"),
            copy: ts("copy"),
          }}
          analyticsSource="match_center"
        />
      </section>
    </div>
  );
}
