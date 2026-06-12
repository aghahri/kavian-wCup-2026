import { TeamFlag } from "@/components/TeamFlag";
import { ShareButtons } from "@/components/ShareButtons";
import type { MatchSummaryStats } from "@/lib/match-summary";
import type { Locale } from "@/i18n/routing";

type MatchSummaryCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  stats: MatchSummaryStats;
  locale: Locale;
  labels: {
    winner: string;
    exactPredictors: string;
    share: {
      share: string;
      telegram: string;
      whatsapp: string;
      x: string;
      facebook: string;
    };
  };
  shareUrl: string;
  shareText: string;
};

export function MatchSummaryCard({
  homeTeam,
  awayTeam,
  homeName,
  awayName,
  homeScore,
  awayScore,
  stats,
  labels,
  shareUrl,
  shareText,
}: MatchSummaryCardProps) {
  return (
    <div
      id="match-summary-card"
      className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#0b1f3a] via-emerald-950/40 to-[#071526] p-6 shadow-2xl sm:p-8"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-300">
        Kavian Football — WC 2026
      </p>
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <TeamFlag teamName={homeTeam} size={48} />
          <p className="font-bold text-white">{homeName}</p>
          <p className="text-4xl font-black text-emerald-300">{homeScore}</p>
        </div>
        <span className="text-white/40">—</span>
        <div className="flex flex-col items-center gap-2">
          <TeamFlag teamName={awayTeam} size={48} />
          <p className="font-bold text-white">{awayName}</p>
          <p className="text-4xl font-black text-emerald-300">{awayScore}</p>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-white/70">
        {labels.winner}: <span className="font-bold text-white">{stats.winnerLabel}</span>
      </p>
      <p className="mt-4 rounded-xl bg-black/30 px-4 py-3 text-center text-sm leading-7 text-amber-100">
        {stats.funnyLine}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="font-black text-emerald-300">{stats.exactScoreCount}</p>
          <p className="text-white/50">Exact</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="font-black text-emerald-300">{stats.wrongPct}%</p>
          <p className="text-white/50">Wrong</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="font-black text-emerald-300">{stats.totalPredictions}</p>
          <p className="text-white/50">Total</p>
        </div>
      </div>
      {stats.topExactPredictors.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-bold text-white/80">{labels.exactPredictors}</p>
          <ul className="space-y-1 text-sm text-white/70">
            {stats.topExactPredictors.map((p, i) => (
              <li key={i}>
                {p.name} — {p.homeScore}:{p.awayScore}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <ShareButtons text={shareText} url={shareUrl} labels={labels.share} />
      </div>
    </div>
  );
}
