"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LeaderboardPeriod } from "@/lib/leaderboard";
import type { Locale } from "@/i18n/routing";

type LeaderboardTabsProps = {
  locale: Locale;
  labels: Record<LeaderboardPeriod, string>;
  tournaments?: { id: string; name: string }[];
};

const periods: LeaderboardPeriod[] = ["global", "daily", "weekly", "tournament"];

export function LeaderboardTabs({ locale, labels, tournaments = [] }: LeaderboardTabsProps) {
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as LeaderboardPeriod) || "global";
  const tournamentId = searchParams.get("tournament") ?? tournaments[0]?.id;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/${locale}/leaderboard?period=${p}${p === "tournament" && tournamentId ? `&tournament=${tournamentId}` : ""}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              period === p
                ? "bg-emerald-500 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {labels[p]}
          </Link>
        ))}
      </div>
      {period === "tournament" && tournaments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/${locale}/leaderboard?period=tournament&tournament=${t.id}`}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                tournamentId === t.id
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
