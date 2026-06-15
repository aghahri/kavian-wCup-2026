import { TeamFlag } from "@/components/TeamFlag";
import { ShareButtons } from "@/components/ShareButtons";
import { SURPRISE_LABELS } from "@/lib/ai/football-analysis";
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
    surprise: string;
    exact: string;
    wrong: string;
    total: string;
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

function surpriseLevel(wrongPct: number): "low" | "medium" | "high" {
  if (wrongPct >= 70) return "high";
  if (wrongPct >= 45) return "medium";
  return "low";
}

export function MatchSummaryCard({
  homeTeam,
  awayTeam,
  homeName,
  awayName,
  homeScore,
  awayScore,
  stats,
  locale,
  labels,
  shareUrl,
  shareText,
}: MatchSummaryCardProps) {
  const level = surpriseLevel(stats.wrongPct);
  const surprise = SURPRISE_LABELS[level];
  const surpriseLabel = locale === "fa" ? surprise.fa : locale === "ar" ? surprise.ar : surprise.en;

  return (
    <div
      id="match-summary-card"
      className="relative overflow-hidden rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-[#0a1628] via-emerald-950/50 to-[#051018] p-6 shadow-[0_20px_60px_rgba(16,185,129,0.15)] sm:p-8"
    >
      <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">
        Kavian Football — WC 2026
      </p>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <TeamFlag teamName={homeTeam} size={56} />
          </div>
          <p className="text-sm font-bold text-white sm:text-base">{homeName}</p>
          <p className="text-5xl font-black tabular-nums text-emerald-300">{homeScore}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-black text-white/30">:</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            {surpriseLabel}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <TeamFlag teamName={awayTeam} size={56} />
          </div>
          <p className="text-sm font-bold text-white sm:text-base">{awayName}</p>
          <p className="text-5xl font-black tabular-nums text-emerald-300">{awayScore}</p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-white/70">
        {labels.winner}: <span className="font-bold text-white">{stats.winnerLabel}</span>
      </p>

      <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center text-sm leading-7 text-amber-100">
        {stats.funnyLine}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
          <p className="text-xl font-black text-emerald-300">{stats.exactScoreCount}</p>
          <p className="text-white/50">{labels.exact}</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
          <p className="text-xl font-black text-amber-300">{stats.wrongPct}%</p>
          <p className="text-white/50">{labels.wrong}</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
          <p className="text-xl font-black text-white/90">{stats.totalPredictions}</p>
          <p className="text-white/50">{labels.total}</p>
        </div>
      </div>

      {stats.topExactPredictors.length > 0 && (
        <div className="mt-5 rounded-2xl bg-black/25 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-emerald-200/80">
            {labels.exactPredictors}
          </p>
          <ul className="space-y-2">
            {stats.topExactPredictors.map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/90">{p.name}</span>
                <span className="font-mono font-bold text-emerald-300">
                  {p.homeScore}:{p.awayScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-5">
        <ShareButtons text={shareText} url={shareUrl} labels={labels.share} analyticsSource="match_summary" />
      </div>
    </div>
  );
}
