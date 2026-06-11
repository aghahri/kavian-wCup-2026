import Link from "next/link";
import { formatPersianDate, isPredictionOpen } from "@/lib/format";

type MatchCardProps = {
  id: string;
  homeTeamFa: string;
  awayTeamFa: string;
  stage: string;
  kickoffAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  userPrediction?: { homeScore: number; awayScore: number; points: number } | null;
  showPredictLink?: boolean;
};

export function MatchCard({
  id,
  homeTeamFa,
  awayTeamFa,
  stage,
  kickoffAt,
  homeScore,
  awayScore,
  isFinished,
  userPrediction,
  showPredictLink = false,
}: MatchCardProps) {
  const open = isPredictionOpen(kickoffAt, isFinished);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
          {stage}
        </span>
        <span className="text-xs text-white/60">{formatPersianDate(kickoffAt)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div>
          <p className="text-base font-bold text-white">{homeTeamFa}</p>
          {isFinished && homeScore !== null && (
            <p className="mt-1 text-2xl font-black text-emerald-300">{homeScore}</p>
          )}
        </div>
        <div className="text-sm font-bold text-white/50">VS</div>
        <div>
          <p className="text-base font-bold text-white">{awayTeamFa}</p>
          {isFinished && awayScore !== null && (
            <p className="mt-1 text-2xl font-black text-emerald-300">{awayScore}</p>
          )}
        </div>
      </div>

      {userPrediction && (
        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-center text-sm text-white/80">
          پیش‌بینی شما: {userPrediction.homeScore} - {userPrediction.awayScore}
          {isFinished && (
            <span className="mr-2 text-emerald-300">
              ({userPrediction.points} امتیاز)
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={`text-xs font-medium ${
            isFinished
              ? "text-white/50"
              : open
                ? "text-emerald-300"
                : "text-amber-300"
          }`}
        >
          {isFinished ? "پایان یافته" : open ? "پیش‌بینی باز است" : "پیش‌بینی بسته شد"}
        </span>
        {showPredictLink && open && (
          <Link
            href={`/predict?match=${id}`}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-400"
          >
            پیش‌بینی کن
          </Link>
        )}
      </div>
    </article>
  );
}
