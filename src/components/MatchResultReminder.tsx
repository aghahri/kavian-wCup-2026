import { needsResultReminder } from "@/lib/matches/match-state";
import type { MatchStateInput } from "@/lib/matches/match-state";

type MatchResultReminderProps = {
  match: MatchStateInput;
  message: string;
  className?: string;
};

export function MatchResultReminder({ match, message, className = "" }: MatchResultReminderProps) {
  if (!needsResultReminder(match)) return null;

  return (
    <p
      className={`rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-center text-xs font-medium text-amber-100 ${className}`}
      role="status"
    >
      ⚠️ {message}
    </p>
  );
}
