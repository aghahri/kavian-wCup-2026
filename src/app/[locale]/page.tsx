import Link from "next/link";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdBannerSlot } from "@/components/AdBannerSlot";
import { GrowthLoopBanner } from "@/components/GrowthLoopBanner";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { MatchCountdown } from "@/components/MatchCountdown";
import { MatchResultReminder } from "@/components/MatchResultReminder";
import { ReferralBanner } from "@/components/ReferralBanner";
import { TeamFlag } from "@/components/TeamFlag";
import { HomeAiPick } from "@/components/home/HomeAiPick";
import { HomeDailyRecap } from "@/components/home/HomeDailyRecap";
import { HomeFinishedMatches } from "@/components/home/HomeFinishedMatches";
import { HomeMyLeagues } from "@/components/home/HomeMyLeagues";
import { HomeTodayMatches } from "@/components/home/HomeTodayMatches";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getGrowthBanners } from "@/lib/growth-loop";
import { getCachedHomeAds, getCachedNextMatch, getCachedTopPlayers } from "@/lib/home-sections";
import { getFootballIqRanks } from "@/lib/football-iq";
import { getMissionProgress } from "@/lib/missions";
import { getSecondChanceStats } from "@/lib/second-chance";
import { getUserStreak } from "@/lib/streak-engine";
import { getAwayTeamName, getHomeTeamName, getStageName } from "@/lib/match-i18n";
import { needsResultReminder } from "@/lib/matches/match-state";
import { ensureUserReferralCode, getReferralUrl } from "@/lib/referral";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

function SectionSkeleton() {
  return <div className="h-24 animate-pulse rounded-2xl bg-white/5" />;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("matchCenter");
  const user = await getCurrentUser();

  const [nextMatch, ads, secondChance, topPlayers, banners] = await Promise.all([
    getCachedNextMatch(),
    getCachedHomeAds(locale),
    getSecondChanceStats(),
    getCachedTopPlayers(),
    getGrowthBanners(user, locale),
  ]);

  let referralUrl: string | null = null;
  let footballIq = null;
  let streak = null;
  let missions = null;

  if (user) {
    const [code, iq, st, ms] = await Promise.all([
      ensureUserReferralCode(user.id).then(getReferralUrl),
      getFootballIqRanks(user.id),
      getUserStreak(user.id),
      getMissionProgress(user.id),
    ]);
    referralUrl = code;
    footballIq = iq;
    streak = st;
    missions = ms;
  }

  const countdownLabels = {
    days: t("countdownDays"),
    hours: t("countdownHours"),
    minutes: t("countdownMinutes"),
    seconds: t("countdownSeconds"),
    started: t("countdownStarted"),
  };

  const showNextReminder = nextMatch && needsResultReminder(nextMatch);

  return (
    <div className="space-y-6">
      <AdBannerSlot ads={ads} />
      <GrowthLoopBanner banners={banners} />

      {showNextReminder && (
        <MatchResultReminder match={nextMatch} message={tc("resultNotRecordedYet")} />
      )}

      {/* 1. Countdown */}
      {nextMatch && !showNextReminder && (
        <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/25 to-[#071526] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{t("nextMatch")}</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <TeamFlag teamName={nextMatch.homeTeam} size={44} />
            <div className="text-center">
              <p className="font-bold text-white">
                {getHomeTeamName(nextMatch, locale)} {t("vs")} {getAwayTeamName(nextMatch, locale)}
              </p>
              <p className="text-xs text-white/50">{getStageName(nextMatch, locale)}</p>
            </div>
            <TeamFlag teamName={nextMatch.awayTeam} size={44} />
          </div>
          <div className="mt-4 flex justify-center">
            <MatchCountdown
              targetIso={nextMatch.kickoffAt.toISOString()}
              locale={locale}
              labels={countdownLabels}
              compact
            />
          </div>
          <Link
            href={`/${locale}/predict?match=${nextMatch.id}`}
            className="mt-4 block text-center text-sm font-bold text-emerald-300 hover:underline"
          >
            {t("startPredict")} →
          </Link>
        </section>
      )}

      {/* 2. Today's matches */}
      <Suspense fallback={<SectionSkeleton />}>
        <HomeTodayMatches locale={locale} />
      </Suspense>

      {/* 3. Finished matches */}
      <Suspense fallback={<SectionSkeleton />}>
        <HomeFinishedMatches locale={locale} />
      </Suspense>

      {/* 4. AI pick */}
      <Suspense fallback={<SectionSkeleton />}>
        <HomeAiPick locale={locale} />
      </Suspense>

      {/* 5. My leagues */}
      {user && (
        <Suspense fallback={<SectionSkeleton />}>
          <HomeMyLeagues locale={locale} userId={user.id} />
        </Suspense>
      )}

      {/* 6. Daily recap */}
      <Suspense fallback={<SectionSkeleton />}>
        <HomeDailyRecap locale={locale} />
      </Suspense>

      {/* 7. Missions */}
      {missions && (
        <Link
          href={`/${locale}/missions`}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <span className="text-sm font-semibold text-white">{t("missions")}</span>
          <span className="text-emerald-300">
            {missions.filter((m) => m.completed).length}/{missions.length}
          </span>
        </Link>
      )}

      {/* 8. Leaderboard */}
      <section>
        <div className="mb-3 flex justify-between">
          <h2 className="text-sm font-bold text-white">{t("topPlayers")}</h2>
          <Link href={`/${locale}/leaderboard`} className="text-xs text-emerald-300">
            {t("fullLeaderboard")} →
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
              daily_streak: "",
            }}
            showProfileLink={false}
          />
        </div>
      </section>

      {/* Lower priority */}
      <Link
        href={`/${locale}/second-chance`}
        className="block rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 transition hover:bg-amber-400/15"
      >
        <p className="text-lg font-black text-amber-100">{t("secondChanceTitle")}</p>
        <p className="mt-1 text-sm text-white/70">{t("secondChanceDesc")}</p>
        <p className="mt-3 text-xs text-amber-200/80">
          {formatNumber(secondChance.daysLeft, locale)} {t("daysLeft")} ·{" "}
          {formatNumber(secondChance.remainingMatches, locale)} {t("matchesLeft")}
        </p>
      </Link>

      {user && footballIq && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/${locale}/football-iq`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">🧠 {t("footballIq")}</p>
            <p className="text-3xl font-black text-emerald-300">{footballIq.footballIq}</p>
            <p className="text-xs text-white/60">
              #{formatNumber(footballIq.globalRank, locale)} {t("global")}
            </p>
          </Link>
          {streak && (
            <Link href={`/${locale}/missions`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">{t("streak")}</p>
              <p className="text-3xl">{streak.flames || "—"}</p>
              <p className="text-xs text-white/60">
                {formatNumber(streak.current, locale)} {t("daysStreak")}
              </p>
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/${locale}/fans/map`}
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-emerald-300"
        >
          {t("fanMap")} →
        </Link>
        <Link
          href={referralUrl ? `/${locale}/referrals` : `/${locale}/login`}
          className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-emerald-300"
        >
          {t("referrals")} →
        </Link>
      </div>

      {referralUrl && (
        <ReferralBanner
          referralUrl={referralUrl}
          title={t("referralTitle")}
          description={t("referralDesc")}
          copyLabel={t("copyLink")}
          copiedLabel={t("copied")}
        />
      )}

      <InstallPwaBanner
        title={t("installTitle")}
        description={t("installDesc")}
        installLabel={t("installCta")}
        dismissLabel={t("installDismiss")}
      />
    </div>
  );
}
