import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MatchCard } from "@/components/MatchCard";
import { MatchResultReminder } from "@/components/MatchResultReminder";
import { getCachedTodayMatches } from "@/lib/home-sections";
import { needsResultReminder } from "@/lib/matches/match-state";
import type { Locale } from "@/i18n/routing";

type HomeTodayMatchesProps = { locale: Locale };

export async function HomeTodayMatches({ locale }: HomeTodayMatchesProps) {
  const t = await getTranslations("home");
  const tc = await getTranslations("matchCenter");
  const matches = await getCachedTodayMatches();

  if (matches.length === 0) return null;

  const staleMatch = matches.find((m) => needsResultReminder(m));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{t("todaysMatches")}</h2>
        <Link href={`/${locale}/fixtures`} className="text-xs text-emerald-300">
          {t("allFixtures")} →
        </Link>
      </div>
      {staleMatch && (
        <MatchResultReminder
          match={staleMatch}
          message={tc("resultNotRecordedYet")}
          className="mb-3"
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            id={m.id}
            homeTeam={m.homeTeam}
            awayTeam={m.awayTeam}
            homeTeamFa={m.homeTeamFa}
            awayTeamFa={m.awayTeamFa}
            stage={m.stage}
            kickoffAt={m.kickoffAt}
            homeScore={m.homeScore}
            awayScore={m.awayScore}
            isFinished={m.isFinished}
            locale={locale}
            scoreVerifiedAt={m.scoreVerifiedAt}
            scoreSourceName={m.scoreSourceName}
            scoreSourceUrl={m.scoreSourceUrl}
            highlightsUrl={m.highlightsUrl}
            highlightsEmbedUrl={m.highlightsEmbedUrl}
            aiRefreshedAt={m.aiRefreshedAt}
          />
        ))}
      </div>
    </section>
  );
}
