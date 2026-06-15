const LIVE_DURATION_MS = 2 * 60 * 60 * 1000;

export type MatchStatus = "upcoming" | "live" | "finished";

export type MatchDisplayState =
  | "upcoming"
  | "live_or_needs_result"
  | "finished_unverified"
  | "finished_verified";

export type MatchLike = {
  kickoffAt: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  scoreVerifiedAt?: Date | null;
};

export function hasMatchScore(match: Pick<MatchLike, "homeScore" | "awayScore">): boolean {
  return match.homeScore !== null && match.awayScore !== null;
}

export function isKickedOff(kickoffAt: Date): boolean {
  return Date.now() >= kickoffAt.getTime();
}

export function isWithinLiveWindow(kickoffAt: Date): boolean {
  const kickoff = kickoffAt.getTime();
  const now = Date.now();
  return now >= kickoff && now < kickoff + LIVE_DURATION_MS;
}

/** Legacy tri-state used across lists and AI pipelines. */
export function getMatchStatus(
  kickoffAt: Date,
  isFinished: boolean,
  homeScore: number | null = null,
  awayScore: number | null = null
): MatchStatus {
  if (isFinished && hasMatchScore({ homeScore, awayScore })) return "finished";
  if (isKickedOff(kickoffAt)) return "live";
  return "upcoming";
}

/** Rich UI state for match center and cards. */
export function getMatchDisplayState(match: MatchLike): MatchDisplayState {
  if (!isKickedOff(match.kickoffAt)) return "upcoming";
  if (!hasMatchScore(match) || !match.isFinished) return "live_or_needs_result";
  if (match.scoreVerifiedAt) return "finished_verified";
  return "finished_unverified";
}

export function getCountdownParts(target: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs };
}
