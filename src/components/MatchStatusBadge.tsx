import { getMatchStatus, type MatchStatus } from "@/lib/match-status";

type MatchStatusBadgeProps = {
  kickoffAt: Date;
  isFinished: boolean;
  labels: Record<MatchStatus, string>;
};

const styles: Record<MatchStatus, string> = {
  upcoming: "bg-sky-500/20 text-sky-200",
  live: "bg-red-500/25 text-red-200 animate-pulse",
  finished: "bg-white/10 text-white/60",
};

export function MatchStatusBadge({ kickoffAt, isFinished, labels }: MatchStatusBadgeProps) {
  const status = getMatchStatus(kickoffAt, isFinished);
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status === "live" && <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />}
      {labels[status]}
    </span>
  );
}
