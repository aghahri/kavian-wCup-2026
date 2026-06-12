"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { PredictionCloseCountdown } from "@/components/PredictionCloseCountdown";
import { ScoreInput } from "@/components/ScoreInput";
import { ShareButtons } from "@/components/ShareButtons";
import { TeamFlag } from "@/components/TeamFlag";

type PredictionFormProps = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFa: string;
  awayTeamFa: string;
  stage: string;
  kickoffAt?: string;
  countdownLabels?: {
    closesIn: string;
    closed: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  initialHome: number;
  initialAway: number;
  shareText?: string;
  shareUrl?: string;
  shareLabels?: {
    share: string;
    telegram: string;
    whatsapp: string;
    x: string;
    facebook: string;
  };
};

export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
  homeTeamFa,
  awayTeamFa,
  stage,
  kickoffAt,
  countdownLabels,
  initialHome,
  initialAway,
  shareText,
  shareUrl,
  shareLabels,
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
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={homeTeam} size={40} />
            <span className="text-sm font-bold text-white">{homeTeamFa}</span>
          </div>
          <span className="text-lg font-bold text-white/40">{t("versus")}</span>
          <div className="flex flex-col items-center gap-2">
            <TeamFlag teamName={awayTeam} size={40} />
            <span className="text-sm font-bold text-white">{awayTeamFa}</span>
          </div>
        </div>
      </div>

      {kickoffAt && countdownLabels && (
        <div className="mt-4">
          <PredictionCloseCountdown kickoffIso={kickoffAt} labels={countdownLabels} />
        </div>
      )}

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
        <div className="mt-4 space-y-3">
          <p className="rounded-xl bg-emerald-500/20 px-4 py-3 text-center text-sm text-emerald-200">
            {message}
          </p>
          {shareText && shareUrl && shareLabels && (
            <ShareButtons text={shareText} url={shareUrl} labels={shareLabels} />
          )}
        </div>
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
