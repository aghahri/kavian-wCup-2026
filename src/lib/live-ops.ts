import {
  deriveMatchState,
  needsAiRefresh,
  needsHighlightsReminder,
  needsVerification,
  type MatchState,
} from "@/lib/matches/match-state";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";
import type { Match } from "@prisma/client";

export type LiveOpsMatch = {
  id: string;
  homeLabel: string;
  awayLabel: string;
  kickoffAt: Date;
  state: MatchState;
  homeScore: number | null;
  awayScore: number | null;
  editorHref: string;
};

export type LiveOpsBuckets = {
  upcoming: LiveOpsMatch[];
  needsResult: LiveOpsMatch[];
  needsHighlights: LiveOpsMatch[];
  needsAiRefresh: LiveOpsMatch[];
  needsVerification: LiveOpsMatch[];
};

function toOpsMatch(m: Match, locale: Locale, state: MatchState): LiveOpsMatch {
  return {
    id: m.id,
    homeLabel: getHomeTeamName(m, locale),
    awayLabel: getAwayTeamName(m, locale),
    kickoffAt: m.kickoffAt,
    state,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    editorHref: state === "live" || state === "needs_result"
      ? `/${locale}/admin/results?matchId=${m.id}`
      : state === "finished_unverified"
        ? needsVerification(m)
          ? `/${locale}/admin/match-sources?matchId=${m.id}`
          : `/${locale}/admin/results?matchId=${m.id}`
        : needsHighlightsReminder(m)
          ? `/${locale}/admin/results?matchId=${m.id}`
          : needsAiRefresh(m)
            ? `/${locale}/admin/matches`
            : `/${locale}/admin/matches`,
  };
}

export async function getLiveOpsBuckets(locale: Locale): Promise<LiveOpsBuckets> {
  const matches = await prisma.match.findMany({ orderBy: { kickoffAt: "asc" } });

  const buckets: LiveOpsBuckets = {
    upcoming: [],
    needsResult: [],
    needsHighlights: [],
    needsAiRefresh: [],
    needsVerification: [],
  };

  for (const m of matches) {
    const state = deriveMatchState(m);
    const row = toOpsMatch(m, locale, state);

    if (state === "upcoming") {
      buckets.upcoming.push(row);
      continue;
    }

    if (state === "live" || state === "needs_result") {
      buckets.needsResult.push(row);
      continue;
    }

    if (needsHighlightsReminder(m)) {
      buckets.needsHighlights.push(row);
    }

    if (needsAiRefresh(m)) {
      buckets.needsAiRefresh.push(row);
    }

    if (needsVerification(m)) {
      buckets.needsVerification.push(row);
    }
  }

  return buckets;
}
