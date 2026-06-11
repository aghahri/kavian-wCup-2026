"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { ScoreInput } from "@/components/ScoreInput";
type PredictionFormProps = {
  matchId: string;
  homeTeamFa: string;
  awayTeamFa: string;
  stage: string;
  initialHome: number;
  initialAway: number;
};

export function PredictionForm({
  matchId,
  homeTeamFa,
  awayTeamFa,
  stage,
  initialHome,
  initialAway,
}: PredictionFormProps) {
  const t = useTranslations("predict");
  const te = useTranslations("errors");
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initialHome);
  const [awayScore, setAwayScore] = useState(initialAway);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? te("network"));
        return;
      }

      setMessage(t("success"));
      router.refresh();
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8"
    >
      <div className="mb-6 text-center">
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
          {stage}
        </span>
        <h2 className="mt-4 text-xl font-bold text-white">
          {homeTeamFa} <span className="text-white/40">{t("versus")}</span> {awayTeamFa}
        </h2>
      </div>

      <div className="flex items-center justify-center gap-6">
        <ScoreInput label={homeTeamFa} value={homeScore} onChange={setHomeScore} />
        <span className="pt-6 text-2xl font-bold text-white/40">-</span>
        <ScoreInput label={awayTeamFa} value={awayScore} onChange={setAwayScore} />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-500/20 px-4 py-3 text-center text-sm text-red-200">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-3 text-center text-sm text-emerald-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
