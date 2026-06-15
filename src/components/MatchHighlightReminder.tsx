import { needsHighlightsReminder } from "@/lib/matches/match-state";
import type { MatchStateInput } from "@/lib/matches/match-state";

type MatchHighlightReminderProps = {
  match: MatchStateInput;
  message: string;
  className?: string;
};

export function MatchHighlightReminder({ match, message, className = "" }: MatchHighlightReminderProps) {
  if (!needsHighlightsReminder(match)) return null;

  return (
    <p
      className={`rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-center text-xs text-violet-200 ${className}`}
      role="status"
    >
      {message}
    </p>
  );
}
