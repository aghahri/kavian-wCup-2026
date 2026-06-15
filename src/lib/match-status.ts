import {
  deriveMatchState,
  isKickedOff as stateIsKickedOff,
  isWithinLiveWindow as stateIsWithinLiveWindow,
  LIVE_DURATION_MS,
  type MatchStateInput,
} from "@/lib/matches/match-state";

export { LIVE_DURATION_MS };

export type MatchStatus = "upcoming" | "live" | "finished";

export type MatchDisplayState =
  | "upcoming"
  | "live_or_needs_result"
  | "finished_unverified"
  | "finished_verified";

export type MatchLike = MatchStateInput;

export function hasMatchScore(match: Pick<MatchLike, "homeScore" | "awayScore">): boolean {
  return match.homeScore !== null && match.awayScore !== null;
}

export function isKickedOff(kickoffAt: Date): boolean {
  return stateIsKickedOff(kickoffAt);
}

export function isWithinLiveWindow(kickoffAt: Date): boolean {
  return stateIsWithinLiveWindow(kickoffAt);
}

/** Legacy tri-state used across lists and AI pipelines. */
export function getMatchStatus(
  kickoffAt: Date,
  isFinished: boolean,
  homeScore: number | null = null,
  awayScore: number | null = null
): MatchStatus {
  const state = deriveMatchState({ kickoffAt, isFinished, homeScore, awayScore });
  if (state === "finished_unverified" || state === "finished_verified") return "finished";
  if (state === "live" || state === "needs_result") return "live";
  return "upcoming";
}

/** Rich UI state for match center and cards — bridges to deriveMatchState. */
export function getMatchDisplayState(match: MatchLike): MatchDisplayState {
  const state = deriveMatchState(match);
  if (state === "live" || state === "needs_result") return "live_or_needs_result";
  return state;
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
