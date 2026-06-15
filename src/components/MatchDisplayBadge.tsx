import { getMatchDisplayState, isWithinLiveWindow } from "@/lib/match-status";
import { deriveMatchState } from "@/lib/matches/match-state";

type MatchDisplayBadgeProps = {
  match: Parameters<typeof getMatchDisplayState>[0];
  labels: {
    upcoming: string;
    live: string;
    needsResult: string;
    awaitingVerification: string;
    verified: string;
    finished: string;
  };
};

export function MatchDisplayBadge({ match, labels }: MatchDisplayBadgeProps) {
  const state = getMatchDisplayState(match);

  if (state === "upcoming") {
    return (
      <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-200">
        {labels.upcoming}
      </span>
    );
  }

  if (state === "live_or_needs_result") {
    const derived = deriveMatchState(match);
    const live = derived === "live" || isWithinLiveWindow(match.kickoffAt);
    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          live ? "animate-pulse bg-red-500/25 text-red-200" : "bg-amber-500/20 text-amber-200"
        }`}
      >
        {live && <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />}
        {live ? labels.live : labels.needsResult}
      </span>
    );
  }

  if (state === "finished_unverified") {
    return (
      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
        {labels.awaitingVerification}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-200">
      ✓ {labels.verified}
    </span>
  );
}
