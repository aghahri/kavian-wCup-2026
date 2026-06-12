import { UserAvatar } from "@/components/UserAvatar";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type Row = {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  predictionCount: number;
};

type LeagueLeaderboardProps = {
  rows: Row[];
  locale: Locale;
  pointsLabel: string;
  emptyLabel: string;
};

export function LeagueLeaderboard({ rows, locale, pointsLabel, emptyLabel }: LeagueLeaderboardProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/60">{emptyLabel}</p>;
  }

  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.userId}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
        >
          <span className="w-8 text-center font-black text-emerald-300">{row.rank}</span>
          <UserAvatar user={{ id: row.userId, name: row.name, avatarUrl: row.avatarUrl }} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-white">{row.name}</p>
            <p className="text-xs text-white/50">
              {formatNumber(row.predictionCount, locale)} preds
            </p>
          </div>
          <span className="font-black text-emerald-300">
            {formatNumber(row.totalPoints, locale)} {pointsLabel}
          </span>
        </li>
      ))}
    </ol>
  );
}
