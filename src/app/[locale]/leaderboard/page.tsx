import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";
import { ShareButtons } from "@/components/ShareButtons";
import { buildLeaderboard, type LeaderboardPeriod } from "@/lib/leaderboard";
import { getTournamentName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/share";
import { syncUserBadges } from "@/lib/badges";
import type { BadgeId } from "@/lib/badges";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ period?: string; tournament?: string }>;
};

export default async function LeaderboardPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { period: periodParam, tournament: tournamentParam } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("leaderboard");
  const tb = await getTranslations("badges");
  const ts = await getTranslations("share");

  const period = (["global", "daily", "weekly", "tournament"].includes(periodParam ?? "")
    ? periodParam
    : "global") as LeaderboardPeriod;

  const tournaments = await prisma.tournament.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const tournamentId =
    period === "tournament"
      ? tournamentParam ?? tournaments[0]?.id
      : undefined;

  const rows = await buildLeaderboard({ period, tournamentId });

  const topIds = rows.slice(0, 10).map((r) => r.id);
  const userBadges: Record<string, BadgeId[]> = {};
  await Promise.all(
    topIds.map(async (id) => {
      userBadges[id] = await syncUserBadges(id);
    })
  );

  const badgeLabels = {
    early_supporter: tb("earlySupporter"),
    top_predictor: tb("topPredictor"),
    referral_champion: tb("referralChampion"),
    world_cup_expert: tb("worldCupExpert"),
    perfect_score: tb("perfectScore"),
    three_exact_scores: tb("threeExactScores"),
    league_founder: tb("leagueFounder"),
    school_captain: tb("schoolCaptain"),
  };

  const periodLabels = {
    global: t("periodGlobal"),
    daily: t("periodDaily"),
    weekly: t("periodWeekly"),
    tournament: t("periodTournament"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <ShareButtons
          text={t("shareText")}
          url={`${getSiteUrl()}/${locale}/leaderboard`}
          labels={{
            share: ts("title"),
            telegram: ts("telegram"),
            whatsapp: ts("whatsapp"),
            x: ts("x"),
            facebook: ts("facebook"),
          }}
        />
      </div>

      <Suspense fallback={null}>
        <LeaderboardTabs
          locale={locale}
          labels={periodLabels}
          tournaments={tournaments.map((tr) => ({
            id: tr.id,
            name: getTournamentName(tr, locale),
          }))}
        />
      </Suspense>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="hidden grid-cols-[auto_1fr_repeat(4,minmax(0,auto))] gap-4 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white/60 sm:grid">
          <span>{t("rank")}</span>
          <span>{t("name")}</span>
          <span>{t("totalPoints")}</span>
          <span>{t("exactScores")}</span>
          <span>{t("correctResults")}</span>
          <span>{t("predictionCount")}</span>
        </div>
        <LeaderboardTable
          rows={rows}
          locale={locale}
          labels={{
            rank: t("rank"),
            name: t("name"),
            totalPoints: t("totalPoints"),
            exactScores: t("exactScores"),
            correctResults: t("correctResults"),
            predictionCount: t("predictionCount"),
            empty: t("empty"),
          }}
          badgeLabels={badgeLabels}
          userBadges={userBadges}
          showProfileLink={false}
        />
      </div>
    </div>
  );
}
