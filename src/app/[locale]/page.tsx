import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdBannerSlot } from "@/components/AdBannerSlot";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { MatchCard } from "@/components/MatchCard";
import { MatchCountdown } from "@/components/MatchCountdown";
import { ReferralBanner } from "@/components/ReferralBanner";
import { TeamFlag } from "@/components/TeamFlag";
import { getCurrentUser } from "@/lib/auth";
import { buildLeaderboard } from "@/lib/leaderboard";
import { formatNumber } from "@/lib/format";
import { getAwayTeamName, getHomeTeamName, getStageName, getTournamentName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import { ensureUserReferralCode, getReferralUrl } from "@/lib/referral";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const user = await getCurrentUser();

  const [
    nextMatch,
    upcomingMatches,
    topPlayers,
    totalPredictions,
    activeTournaments,
    ads,
    recentWinners,
  ] = await Promise.all([
    prisma.match.findFirst({
      where: { isFinished: false },
      orderBy: { kickoffAt: "asc" },
    }),
    prisma.match.findMany({
      where: { isFinished: false },
      orderBy: { kickoffAt: "asc" },
      take: 3,
      skip: 1,
    }),
    buildLeaderboard({ period: "global", limit: 5 }),
    prisma.prediction.count(),
    prisma.tournament.findMany({
      where: { isActive: true },
      take: 3,
      include: { prizes: { where: { isActive: true }, take: 1 } },
    }),
    prisma.adBanner.findMany({
      where: {
        isActive: true,
        placement: "home_top",
        OR: [{ locale: null }, { locale }],
      },
      orderBy: { sortOrder: "asc" },
      take: 2,
    }),
    buildLeaderboard({ period: "weekly", limit: 3 }),
  ]);

  let referralUrl: string | null = null;
  if (user) {
    const code = await ensureUserReferralCode(user.id);
    referralUrl = getReferralUrl(code);
  }

  const countdownLabels = {
    days: t("countdownDays"),
    hours: t("countdownHours"),
    minutes: t("countdownMinutes"),
    seconds: t("countdownSeconds"),
    started: t("countdownStarted"),
  };

  return (
    <div className="space-y-8">
      <AdBannerSlot ads={ads} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/35 via-[#0b1f3a] to-[#071526] p-6 shadow-2xl sm:p-10">
        <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <p className="mb-2 text-sm font-medium text-emerald-200">{t("welcome")}</p>
        <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">
          {t("title")}
          <span className="block text-emerald-300">{t("subtitle")}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{t("description")}</p>

        {nextMatch && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {t("nextMatch")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-center gap-4">
                <TeamFlag teamName={nextMatch.homeTeam} size={48} />
                <span className="text-lg font-bold text-white/50">{t("vs")}</span>
                <TeamFlag teamName={nextMatch.awayTeam} size={48} />
              </div>
              <div className="text-center sm:text-end">
                <p className="font-bold text-white">
                  {getHomeTeamName(nextMatch, locale)} {t("vs")}{" "}
                  {getAwayTeamName(nextMatch, locale)}
                </p>
                <p className="mt-1 text-xs text-white/50">{getStageName(nextMatch, locale)}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <MatchCountdown
                targetIso={nextMatch.kickoffAt.toISOString()}
                locale={locale}
                labels={countdownLabels}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/predict`}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            {t("startPredict")}
          </Link>
          <Link
            href={`/${locale}/leagues/create`}
            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-400"
          >
            {t("createFamilyLeague")}
          </Link>
          <Link
            href={`/${locale}/leaderboard`}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            {t("viewLeaderboard")}
          </Link>
        </div>
      </section>

      <InstallPwaBanner
        title={t("installTitle")}
        description={t("installDesc")}
        installLabel={t("installCta")}
        dismissLabel={t("installDismiss")}
      />

      {referralUrl && (
        <ReferralBanner
          referralUrl={referralUrl}
          title={t("referralTitle")}
          description={t("referralDesc")}
          copyLabel={t("copyLink")}
          copiedLabel={t("copied")}
        />
      )}

      {/* Stats strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {formatNumber(activeTournaments.length, locale)}
          </p>
          <p className="mt-1 text-sm text-white/70">{t("activeTournaments")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">
            {formatNumber(totalPredictions, locale)}
          </p>
          <p className="mt-1 text-sm text-white/70">{t("statPredictions")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-black text-emerald-300">{user ? "✓" : "?"}</p>
          <p className="mt-1 text-sm text-white/70">
            {user ? t("statLoggedIn", { name: user.name }) : t("statNotLoggedIn")}
          </p>
        </div>
      </section>

      {/* Upcoming matches */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{t("upcoming")}</h2>
            <Link href={`/${locale}/fixtures`} className="text-sm text-emerald-300 hover:underline">
              {t("allFixtures")}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
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
                showPredictLink
              />
            ))}
          </div>
        </section>
      )}

      {/* Top predictors */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t("topPlayers")}</h2>
          <Link href={`/${locale}/leaderboard`} className="text-sm text-emerald-300 hover:underline">
            {t("fullLeaderboard")}
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <LeaderboardTable
            rows={topPlayers}
            locale={locale}
            labels={{
              rank: t("rank"),
              name: t("name"),
              totalPoints: t("pointsLabel"),
              exactScores: t("exactLabel"),
              correctResults: t("correctLabel"),
              predictionCount: t("predictionsLabel"),
              empty: t("noScores"),
            }}
            badgeLabels={{
              early_supporter: "",
              top_predictor: "",
              referral_champion: "",
              world_cup_expert: "",
              perfect_score: "",
              three_exact_scores: "",
              league_founder: "",
              school_captain: "",
            }}
            showProfileLink={false}
          />
        </div>
      </section>

      {/* Active tournaments */}
      {activeTournaments.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{t("activeTournaments")}</h2>
            <Link href={`/${locale}/tournaments`} className="text-sm text-emerald-300 hover:underline">
              {t("allTournaments")}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tr) => (
              <Link
                key={tr.id}
                href={`/${locale}/tournaments`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-500/30"
              >
                <h3 className="font-bold text-white">{getTournamentName(tr, locale)}</h3>
                {tr.prizes[0] && (
                  <p className="mt-2 text-sm text-amber-200">🏆 {tr.prizes[0].titleFa}</p>
                )}
                <span className="mt-3 inline-block text-xs text-emerald-300">{t("joinLeague")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Weekly winners */}
      {recentWinners.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">{t("latestWinners")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {recentWinners.map((winner, i) => (
              <div
                key={winner.id}
                className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4"
              >
                <span className="text-2xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <div>
                  <p className="font-bold text-white">{winner.name}</p>
                  <p className="text-sm text-emerald-300">
                    {t("points", { count: formatNumber(winner.totalPoints, locale) })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
