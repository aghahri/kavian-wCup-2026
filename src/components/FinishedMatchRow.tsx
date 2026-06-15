import Link from "next/link";
import { TeamFlag } from "@/components/TeamFlag";
import { hasHighlights, highlightsWatchUrl } from "@/lib/highlights";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import type { Match } from "@prisma/client";
import type { Locale } from "@/i18n/routing";

type FinishedMatchRowProps = {
  match: Match;
  locale: Locale;
  labels: {
    verified: string;
    watchHighlights: string;
    matchCenter: string;
    source: string;
  };
};

export function FinishedMatchRow({ match, locale, labels }: FinishedMatchRowProps) {
  const home = getHomeTeamName(match, locale);
  const away = getAwayTeamName(match, locale);
  const verified = Boolean(match.scoreVerifiedAt);
  const hl = hasHighlights(match.highlightsUrl, match.highlightsEmbedUrl);
  const watchUrl = highlightsWatchUrl(match.highlightsUrl, match.highlightsEmbedUrl);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TeamFlag teamName={match.homeTeam} size={28} />
          <div>
            <p className="text-sm font-bold text-white">
              {home} {match.homeScore ?? 0}-{match.awayScore ?? 0} {away}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs">
              {verified && (
                <span className="text-sky-300">
                  ✓ {labels.verified}
                  {match.scoreSourceUrl && (
                    <>
                      {" · "}
                      <a
                        href={match.scoreSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {match.scoreSourceName ?? labels.source}
                      </a>
                    </>
                  )}
                </span>
              )}
              {hl && <span className="text-amber-200">🎬</span>}
            </div>
          </div>
          <TeamFlag teamName={match.awayTeam} size={28} />
        </div>
        <div className="flex flex-wrap gap-2">
          {hl && watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/30"
            >
              {labels.watchHighlights}
            </a>
          )}
          <Link
            href={`/${locale}/matches/${match.id}`}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-white/10"
          >
            {labels.matchCenter}
          </Link>
        </div>
      </div>
    </div>
  );
}
