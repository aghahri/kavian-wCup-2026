import Link from "next/link";
import { BadgeList } from "@/components/BadgeList";
import { UserAvatar } from "@/components/UserAvatar";
import { formatNumber } from "@/lib/format";
import type { BadgeId } from "@/lib/badges";
import type { LeaderboardRow } from "@/lib/leaderboard";
import type { Locale } from "@/i18n/routing";

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  locale: Locale;
  labels: {
    rank: string;
    name: string;
    totalPoints: string;
    exactScores: string;
    correctResults: string;
    predictionCount: string;
    empty: string;
  };
  badgeLabels: Record<BadgeId, string>;
  userBadges?: Record<string, BadgeId[]>;
  showProfileLink?: boolean;
};

function rankStyle(index: number): string {
  if (index === 0) return "bg-amber-400/20 text-amber-200";
  if (index === 1) return "bg-slate-300/20 text-slate-200";
  if (index === 2) return "bg-orange-400/20 text-orange-200";
  return "bg-white/10 text-white/80";
}

export function LeaderboardTable({
  rows,
  locale,
  labels,
  badgeLabels,
  userBadges = {},
  showProfileLink = true,
}: LeaderboardTableProps) {
  if (rows.length === 0) {
    return <p className="p-6 text-center text-white/60">{labels.empty}</p>;
  }

  return (
    <ul>
      {rows.map((row, index) => (
        <li
          key={row.id}
          className="grid grid-cols-1 gap-3 border-b border-white/5 px-4 py-4 last:border-b-0 sm:grid-cols-[auto_1fr_repeat(4,minmax(0,auto))] sm:items-center sm:gap-4"
        >
          <div className="flex items-center gap-3 sm:contents">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankStyle(index)}`}
            >
              {formatNumber(index + 1, locale)}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar user={{ id: row.id, name: row.name, avatarUrl: row.avatarUrl }} size={36} />
              <div className="min-w-0">
                {showProfileLink ? (
                  <Link href={`/${locale}/profile`} className="font-bold text-white hover:text-emerald-300">
                    {row.name}
                  </Link>
                ) : (
                  <span className="font-bold text-white">{row.name}</span>
                )}
                {userBadges[row.id] && (
                  <div className="mt-1">
                    <BadgeList badges={userBadges[row.id]} labels={badgeLabels} size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:contents">
            <span className="font-black text-emerald-300 sm:text-center">{formatNumber(row.totalPoints, locale)}</span>
            <span className="text-white/70 sm:text-center">{formatNumber(row.exactScores, locale)}</span>
            <span className="text-white/70 sm:text-center">{formatNumber(row.correctResults, locale)}</span>
            <span className="text-white/60 sm:text-center">{formatNumber(row.predictionCount, locale)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
