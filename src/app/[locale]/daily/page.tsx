import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailyChallengeForm } from "@/components/DailyChallengeForm";
import { EmptyState } from "@/components/EmptyState";
import { MatchCountdown } from "@/components/MatchCountdown";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { buildDailyLeaderboard, getOrCreateTodayChallenge } from "@/lib/daily-challenge";
import { formatNumber, isPredictionOpen } from "@/lib/format";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DailyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("daily");
  const tm = await getTranslations("match");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const challenge = await getOrCreateTodayChallenge();
  if (!challenge) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} subtitle={t("subtitle")} badge={t("badge")} />
        <EmptyState icon="📅" title={t("empty")} />
      </div>
    );
  }

  const [entry, leaderboard] = await Promise.all([
    prisma.dailyChallengeEntry.findUnique({
      where: { challengeId_userId: { challengeId: challenge.id, userId: user.id } },
    }),
    buildDailyLeaderboard(challenge.id),
  ]);

  const match = challenge.match;
  const open = isPredictionOpen(match.kickoffAt, match.isFinished, match.predictionLockOverride);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        badge={t("badge")}
        action={
          user.dailyStreak > 0 ? (
            <span className="rounded-full bg-amber-500/20 px-4 py-2 text-sm font-bold text-amber-200">
              🔥 {t("streak", { count: user.dailyStreak })}
            </span>
          ) : undefined
        }
      />

      {open && (
        <MatchCountdown
          targetIso={match.kickoffAt.toISOString()}
          locale={locale}
          labels={{
            days: tm("countdownDays"),
            hours: tm("countdownHours"),
            minutes: tm("countdownMinutes"),
            seconds: tm("countdownSeconds"),
            started: tm("countdownStarted"),
          }}
          compact
        />
      )}

      <DailyChallengeForm
        locale={locale}
        challengeId={challenge.id}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeName={getHomeTeamName(match, locale)}
        awayName={getAwayTeamName(match, locale)}
        isOpen={open}
        initial={
          entry
            ? {
                homeScore: entry.homeScore,
                awayScore: entry.awayScore,
                firstGoalTeam: entry.firstGoalTeam,
                winnerPick: entry.winnerPick,
              }
            : undefined
        }
        labels={{
          score: t("score"),
          firstGoal: t("firstGoal"),
          winner: t("winner"),
          firstHome: t("firstHome"),
          firstAway: t("firstAway"),
          firstNone: t("firstNone"),
          winHome: getHomeTeamName(match, locale),
          winAway: getAwayTeamName(match, locale),
          winDraw: t("winDraw"),
          submit: t("submit"),
          submitting: t("submitting"),
          success: t("success"),
          closed: t("closed"),
          versus: t("versus"),
        }}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("leaderboard")}</h2>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-white/50">{t("leaderboardEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {leaderboard.map((row) => (
              <li key={row.userId} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  {formatNumber(row.rank, locale)}. {row.name}
                  {row.streak >= 3 && <span className="ms-2 text-amber-300">🔥{row.streak}</span>}
                </span>
                <span className="font-bold text-emerald-300">
                  {formatNumber(row.points, locale)} {t("pts")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`/${locale}/leaderboard`} className="block text-center text-sm text-emerald-300 hover:underline">
        {t("viewGlobal")} →
      </Link>
    </div>
  );
}
