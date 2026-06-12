"use client";

import { useEffect, useState } from "react";
import { getCountdownParts } from "@/lib/match-status";

type PredictionCloseCountdownProps = {
  kickoffIso: string;
  labels: {
    closesIn: string;
    closed: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
};

export function PredictionCloseCountdown({ kickoffIso, labels }: PredictionCloseCountdownProps) {
  const [parts, setParts] = useState(() => getCountdownParts(new Date(kickoffIso)));

  useEffect(() => {
    const target = new Date(kickoffIso);
    const tick = () => setParts(getCountdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kickoffIso]);

  if (parts.totalMs <= 0) {
    return <p className="text-center text-sm font-medium text-amber-300">{labels.closed}</p>;
  }

  return (
    <div className="rounded-xl bg-black/20 px-4 py-3 text-center">
      <p className="text-xs text-white/50">{labels.closesIn}</p>
      <p className="mt-1 font-mono text-lg font-black tabular-nums text-emerald-300">
        {String(parts.hours + parts.days * 24).padStart(2, "0")}:
        {String(parts.minutes).padStart(2, "0")}:
        {String(parts.seconds).padStart(2, "0")}
      </p>
    </div>
  );
}
