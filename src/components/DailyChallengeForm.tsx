"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ScoreInput } from "@/components/ScoreInput";
import { TeamFlag } from "@/components/TeamFlag";
import type { Locale } from "@/i18n/routing";

type DailyChallengeFormProps = {
  locale: Locale;
  challengeId: string;
  homeTeam: string;
  awayTeam: string;
  homeName: string;
  awayName: string;
  initial?: {
    homeScore: number;
    awayScore: number;
    firstGoalTeam: string;
    winnerPick: string;
  };
  labels: {
    score: string;
    firstGoal: string;
    winner: string;
    firstHome: string;
    firstAway: string;
    firstNone: string;
    winHome: string;
    winAway: string;
    winDraw: string;
    submit: string;
    submitting: string;
    success: string;
    closed: string;
    versus: string;
  };
  isOpen: boolean;
};

export function DailyChallengeForm({
  challengeId,
  homeTeam,
  awayTeam,
  homeName,
  awayName,
  initial,
  labels,
  isOpen,
}: DailyChallengeFormProps) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initial?.homeScore ?? 1);
  const [awayScore, setAwayScore] = useState(initial?.awayScore ?? 0);
  const [firstGoalTeam, setFirstGoalTeam] = useState(initial?.firstGoalTeam ?? "home");
  const [winnerPick, setWinnerPick] = useState(initial?.winnerPick ?? "home");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isOpen) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, homeScore, awayScore, firstGoalTeam, winnerPick }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(labels.success);
      router.refresh();
    } catch {
      setMessage("Error");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        {labels.closed}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <TeamFlag teamName={homeTeam} size={40} />
          <span className="text-sm font-bold text-white">{homeName}</span>
        </div>
        <span className="text-white/40">{labels.versus}</span>
        <div className="flex flex-col items-center gap-2">
          <TeamFlag teamName={awayTeam} size={40} />
          <span className="text-sm font-bold text-white">{awayName}</span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-white/80">{labels.score}</p>
        <div className="flex items-center justify-center gap-6">
          <ScoreInput label={homeName} value={homeScore} onChange={setHomeScore} />
          <span className="pt-6 text-2xl text-white/40">-</span>
          <ScoreInput label={awayName} value={awayScore} onChange={setAwayScore} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-white/80">{labels.firstGoal}</p>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "home", l: labels.firstHome },
            { v: "away", l: labels.firstAway },
            { v: "none", l: labels.firstNone },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setFirstGoalTeam(o.v)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                firstGoalTeam === o.v ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-white/80">{labels.winner}</p>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "home", l: labels.winHome },
            { v: "draw", l: labels.winDraw },
            { v: "away", l: labels.winAway },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setWinnerPick(o.v)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                winnerPick === o.v ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="rounded-xl bg-emerald-500/20 px-4 py-3 text-center text-sm text-emerald-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
