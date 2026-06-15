import {
  deriveMatchState,
  needsAiRefresh,
  needsHighlightsReminder,
  needsResultReminder,
  needsVerification,
  RESULT_REMINDER_MS,
} from "@/lib/matches/match-state";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

export type HealthMatchRow = {
  id: string;
  homeLabel: string;
  awayLabel: string;
  kickoffAt: Date;
  state: ReturnType<typeof deriveMatchState>;
  editorHref: string;
};

export type SystemHealthReport = {
  needsResult: HealthMatchRow[];
  needsAi: HealthMatchRow[];
  needsVerification: HealthMatchRow[];
  needsHighlights: HealthMatchRow[];
  stalePages: HealthMatchRow[];
  orphans: { type: string; id: string; detail: string }[];
  counts: {
    needsResult: number;
    needsAi: number;
    needsVerification: number;
    needsHighlights: number;
    stalePages: number;
    orphans: number;
  };
};

function rowFromMatch(
  m: Parameters<typeof getHomeTeamName>[0] & { id: string; kickoffAt: Date },
  locale: Locale
): HealthMatchRow {
  const state = deriveMatchState(m);
  return {
    id: m.id,
    homeLabel: getHomeTeamName(m, locale),
    awayLabel: getAwayTeamName(m, locale),
    kickoffAt: m.kickoffAt,
    state,
    editorHref:
      state === "live" || state === "needs_result"
        ? `/${locale}/admin/results?matchId=${m.id}`
        : state === "finished_unverified"
          ? `/${locale}/admin/match-sources?matchId=${m.id}`
          : `/${locale}/admin/matches`,
  };
}

export async function getSystemHealthReport(locale: Locale): Promise<SystemHealthReport> {
  const now = Date.now();
  const matches = await prisma.match.findMany({ orderBy: { kickoffAt: "asc" } });

  const needsResult: HealthMatchRow[] = [];
  const needsAi: HealthMatchRow[] = [];
  const needsVerificationList: HealthMatchRow[] = [];
  const needsHighlights: HealthMatchRow[] = [];
  const stalePages: HealthMatchRow[] = [];

  for (const m of matches) {
    const state = deriveMatchState(m, now);
    const row = rowFromMatch(m, locale);

    if (state === "live" || state === "needs_result") {
      if (needsResultReminder(m, now)) needsResult.push(row);
    }

    if (needsAiRefresh(m, now)) needsAi.push(row);
    if (needsVerification(m, now)) needsVerificationList.push(row);
    if (needsHighlightsReminder(m, now)) needsHighlights.push(row);

    // Stale: kickoff passed reminder threshold but still marked upcoming pathologically
    if (state === "needs_result" && now - m.kickoffAt.getTime() > RESULT_REMINDER_MS * 4) {
      stalePages.push(row);
    }
  }

  const orphans: SystemHealthReport["orphans"] = [];

  const analyses = await prisma.matchAnalysis.findMany({
    select: { id: true, matchId: true, match: { select: { id: true } } },
  });
  for (const a of analyses) {
    if (!a.match) {
      orphans.push({ type: "analysis", id: a.id, detail: `matchId=${a.matchId}` });
    }
  }

  const events = await prisma.matchEvent.groupBy({
    by: ["matchId"],
    _count: { id: true },
  });
  const matchIds = new Set(matches.map((m) => m.id));
  for (const e of events) {
    if (!matchIds.has(e.matchId)) {
      orphans.push({
        type: "events",
        id: e.matchId,
        detail: `${e._count.id} events`,
      });
    }
  }

  return {
    needsResult,
    needsAi,
    needsVerification: needsVerificationList,
    needsHighlights,
    stalePages,
    orphans,
    counts: {
      needsResult: needsResult.length,
      needsAi: needsAi.length,
      needsVerification: needsVerificationList.length,
      needsHighlights: needsHighlights.length,
      stalePages: stalePages.length,
      orphans: orphans.length,
    },
  };
}
