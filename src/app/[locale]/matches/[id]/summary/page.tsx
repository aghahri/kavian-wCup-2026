import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MatchSummaryCard } from "@/components/MatchSummaryCard";
import { buildMatchSummary } from "@/lib/match-summary";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { getSiteUrl } from "@/lib/share";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchSummaryPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("summary");
  const ts = await getTranslations("share");

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  const stats = await buildMatchSummary(match, locale);
  if (!stats || match.homeScore === null || match.awayScore === null) {
    notFound();
  }

  const shareUrl = `${getSiteUrl()}/${locale}/matches/${id}/summary`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/${locale}/fixtures`} className="text-sm text-emerald-300 hover:underline">
        ← {t("back")}
      </Link>
      <MatchSummaryCard
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeName={getHomeTeamName(match, locale)}
        awayName={getAwayTeamName(match, locale)}
        homeScore={match.homeScore}
        awayScore={match.awayScore}
        stats={stats}
        locale={locale}
        labels={{
          winner: t("winner"),
          exactPredictors: t("exactPredictors"),
          surprise: t("surprise"),
          exact: t("exact"),
          wrong: t("wrong"),
          total: t("total"),
          share: {
            share: t("shareResult"),
            telegram: ts("telegram"),
            whatsapp: ts("whatsapp"),
            x: ts("x"),
            facebook: ts("facebook"),
          },
        }}
        shareUrl={shareUrl}
        shareText={t("shareText", {
          home: getHomeTeamName(match, locale),
          away: getAwayTeamName(match, locale),
          score: `${match.homeScore}-${match.awayScore}`,
        })}
      />
    </div>
  );
}
