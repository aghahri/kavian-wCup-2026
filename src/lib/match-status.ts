const LIVE_DURATION_MS = 2 * 60 * 60 * 1000;

export type MatchStatus = "upcoming" | "live" | "finished";

export function getMatchStatus(kickoffAt: Date, isFinished: boolean): MatchStatus {
  if (isFinished) return "finished";
  const now = Date.now();
  const kickoff = kickoffAt.getTime();
  if (now >= kickoff && now < kickoff + LIVE_DURATION_MS) return "live";
  return "upcoming";
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
