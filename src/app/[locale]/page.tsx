import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdBannerSlot } from "@/components/AdBannerSlot";
import { GrowthLoopBanner } from "@/components/GrowthLoopBanner";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { MatchCountdown } from "@/components/MatchCountdown";
import { ReferralBanner } from "@/components/ReferralBanner";
import { TeamFlag } from "@/components/TeamFlag";
import { formatAiPredictionLine } from "@/lib/ai/football-analysis";
import { getCurrentUser } from "@/lib/auth";
import { crowdTeamLabels } from "@/lib/crowd-predictions";
import { formatNumber } from "@/lib/format";
import { getHomeHookData } from "@/lib/hook-home";
import { getAwayTeamName, getHomeTeamName, getStageName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import { ensureUserReferralCode, getReferralUrl } from "@/lib/referral";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const user = await getCurrentUser();

  const [hook, ads] = await Promise.all([
    getHomeHookData(locale, user),
    prisma.adBanner.findMany({
      where: { isActive: true, placement: "home_top", OR: [{ locale: null }, { locale }] },
      orderBy: { sortOrder: "asc" },
      take: 2,
    }),
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

  const nextMatch = hook.nextMatch;

  return (
    <div className="space-y-6">
      <AdBannerSlot ads={ads} />
      <GrowthLoopBanner banners={hook.banners} />

      {/* 1. Next match countdown */}
      {nextMatch && (
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
            <MatchCountdown targetIso={nextMatch.kickoffAt.toISOString()} locale={locale} labels={countdownLabels} compact />
          </div>
          <Link href={`/${locale}/predict?match=${nextMatch.id}`} className="mt-4 block text-center text-sm font-bold text-emerald-300 hover:underline">
            {t("startPredict")} →
          </Link>
        </section>
      )}

      {/* 2. Second Chance */}
      <Link href={`/${locale}/second-chance`} className="block rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 transition hover:bg-amber-400/15">
        <p className="text-lg font-black text-amber-100">{t("secondChanceTitle")}</p>
        <p className="mt-1 text-sm text-white/70">{t("secondChanceDesc")}</p>
        <p className="mt-3 text-xs text-amber-200/80">
          {formatNumber(hook.secondChance.daysLeft, locale)} {t("daysLeft")} · {formatNumber(hook.secondChance.remainingMatches, locale)} {t("matchesLeft")}
        </p>
      </Link>

      {/* 3. Football IQ + streak */}
      {user && hook.footballIq && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/${locale}/football-iq`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">🧠 {t("footballIq")}</p>
            <p className="text-3xl font-black text-emerald-300">{hook.footballIq.footballIq}</p>
            <p className="text-xs text-white/60">#{formatNumber(hook.footballIq.globalRank, locale)} {t("global")}</p>
          </Link>
          {hook.streak && (
            <Link href={`/${locale}/missions`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50">{t("streak")}</p>
              <p className="text-3xl">{hook.streak.flames || "—"}</p>
              <p className="text-xs text-white/60">{formatNumber(hook.streak.current, locale)} {t("daysStreak")}</p>
            </Link>
          )}
        </div>
      )}

      {/* 4. Crowd preview */}
      {hook.crowdPreview && (
        <Link href={`/${locale}/crowd`} className="block rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-sky-300">{t("crowdPick")}</p>
          <p className="mt-2 font-bold text-white">
            {crowdTeamLabels(hook.crowdPreview.match, locale).home} vs {crowdTeamLabels(hook.crowdPreview.match, locale).away}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {hook.crowdPreview.homePct}% · {hook.crowdPreview.drawPct}% · {hook.crowdPreview.awayPct}%
          </p>
        </Link>
      )}

      {/* 5. AI pick */}
      {hook.engagement?.pickOfDay && (
        <Link href={`/${locale}/matches/${hook.engagement.pickOfDay.match.id}/ai`} className="block rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs font-semibold text-emerald-300">⭐ {t("aiPick")}</p>
          <p className="mt-1 font-bold text-white">
            {formatAiPredictionLine(
              hook.engagement.pickOfDay.match,
              locale,
              hook.engagement.pickOfDay.suggestedHomeScore,
              hook.engagement.pickOfDay.suggestedAwayScore
            )}
          </p>
        </Link>
      )}

      {/* 6. My leagues */}
      {hook.myLeagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-white/80">{t("myLeagues")}</h2>
          <div className="flex gap-2 overflow-x-auto">
            {hook.myLeagues.map((l) => (
              <Link key={l.code} href={`/${locale}/leagues/${l.code}`} className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
                {l.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Daily recap */}
      <Link href={`/${locale}/recap`} className="block rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold text-amber-200">{t("dailyRecap")}</p>
        <p className="mt-2 text-sm text-white/70 line-clamp-2">{hook.recap.funFact}</p>
      </Link>

      {/* 8. Missions */}
      {hook.missions && (
        <Link href={`/${locale}/missions`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-sm font-semibold text-white">{t("missions")}</span>
          <span className="text-emerald-300">
            {hook.missions.filter((m) => m.completed).length}/{hook.missions.length}
          </span>
        </Link>
      )}

      {/* 9. Leaderboard */}
      <section>
        <div className="mb-3 flex justify-between">
          <h2 className="text-sm font-bold text-white">{t("topPlayers")}</h2>
          <Link href={`/${locale}/leaderboard`} className="text-xs text-emerald-300">{t("fullLeaderboard")}</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <LeaderboardTable
            rows={hook.topPlayers}
            locale={locale}
            labels={{ rank: t("rank"), name: t("name"), totalPoints: t("pointsLabel"), exactScores: t("exactLabel"), correctResults: t("correctLabel"), predictionCount: t("predictionsLabel"), empty: t("noScores") }}
            badgeLabels={{ early_supporter: "", top_predictor: "", referral_champion: "", world_cup_expert: "", perfect_score: "", three_exact_scores: "", league_founder: "", school_captain: "", daily_streak: "" }}
            showProfileLink={false}
          />
        </div>
      </section>

      {/* 10–12. Fan map, referrals, PWA */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/${locale}/fans/map`} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-emerald-300">
          {t("fanMap")} →
        </Link>
        <Link href={referralUrl ? `/${locale}/referrals` : `/${locale}/login`} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-emerald-300">
          {t("referrals")} →
        </Link>
      </div>

      {referralUrl && (
        <ReferralBanner referralUrl={referralUrl} title={t("referralTitle")} description={t("referralDesc")} copyLabel={t("copyLink")} copiedLabel={t("copied")} />
      )}

      <InstallPwaBanner title={t("installTitle")} description={t("installDesc")} installLabel={t("installCta")} dismissLabel={t("installDismiss")} />
    </div>
  );
}
