/** Single source of truth for match lifecycle state. */

export const LIVE_DURATION_MS = 2 * 60 * 60 * 1000;
export const RESULT_REMINDER_MS = 30 * 60 * 1000;

export type MatchState =
  | "upcoming"
  | "live"
  | "needs_result"
  | "finished_unverified"
  | "finished_verified";

export type MatchStateInput = {
  kickoffAt: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  scoreVerifiedAt?: Date | null;
  highlightsUrl?: string | null;
  highlightsEmbedUrl?: string | null;
  aiRefreshedAt?: Date | null;
};

export function hasScore(match: Pick<MatchStateInput, "homeScore" | "awayScore">): boolean {
  return match.homeScore !== null && match.awayScore !== null;
}

export function isKickedOff(kickoffAt: Date, now = Date.now()): boolean {
  return now >= kickoffAt.getTime();
}

export function isWithinLiveWindow(kickoffAt: Date, now = Date.now()): boolean {
  const kickoff = kickoffAt.getTime();
  return now >= kickoff && now < kickoff + LIVE_DURATION_MS;
}

/**
 * Derive match state from kickoff, scores, and verification — never from static labels.
 */
export function deriveMatchState(match: MatchStateInput, now = Date.now()): MatchState {
  const kickoff = match.kickoffAt.getTime();

  if (now < kickoff) return "upcoming";

  if (!hasScore(match)) {
    if (now < kickoff + LIVE_DURATION_MS) return "live";
    return "needs_result";
  }

  if (match.scoreVerifiedAt) return "finished_verified";
  return "finished_unverified";
}

export function needsResultReminder(match: MatchStateInput, now = Date.now()): boolean {
  const state = deriveMatchState(match, now);
  if (state !== "live" && state !== "needs_result") return false;
  return now - match.kickoffAt.getTime() >= RESULT_REMINDER_MS;
}

export function needsHighlightsReminder(match: MatchStateInput, now = Date.now()): boolean {
  const state = deriveMatchState(match, now);
  if (state !== "finished_unverified" && state !== "finished_verified") return false;
  return !match.highlightsUrl && !match.highlightsEmbedUrl;
}

export function needsAiRefresh(match: MatchStateInput, now = Date.now()): boolean {
  const state = deriveMatchState(match, now);
  if (state === "finished_unverified" || state === "finished_verified") {
    return !match.aiRefreshedAt;
  }
  return false;
}

export function needsVerification(match: MatchStateInput, now = Date.now()): boolean {
  return deriveMatchState(match, now) === "finished_unverified";
}

export function shouldShowPrematchAi(match: MatchStateInput, now = Date.now()): boolean {
  return deriveMatchState(match, now) === "upcoming";
}

export function shouldShowPostmatchAi(match: MatchStateInput, now = Date.now()): boolean {
  const s = deriveMatchState(match, now);
  return s === "finished_unverified" || s === "finished_verified";
}

export function isStalePrematchAi(match: MatchStateInput, now = Date.now()): boolean {
  const s = deriveMatchState(match, now);
  return s === "live" || s === "needs_result";
}

export function liveOpsEditorHref(
  locale: string,
  matchId: string,
  state: MatchState
): string {
  switch (state) {
    case "upcoming":
      return `/${locale}/admin/matches`;
    case "live":
    case "needs_result":
      return `/${locale}/admin/results?matchId=${matchId}`;
    case "finished_unverified":
      return `/${locale}/admin/match-sources?matchId=${matchId}`;
    case "finished_verified":
      return `/${locale}/admin/matches`;
    default:
      return `/${locale}/admin/results?matchId=${matchId}`;
  }
}
