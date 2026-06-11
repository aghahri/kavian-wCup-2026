"use client";

import { useEffect, useState } from "react";
import { getCountdownParts } from "@/lib/match-status";
import type { Locale } from "@/i18n/routing";

type MatchCountdownProps = {
  targetIso: string;
  locale: Locale;
  labels: { days: string; hours: string; minutes: string; seconds: string; started: string };
  compact?: boolean;
};

export function MatchCountdown({ targetIso, labels, compact = false }: MatchCountdownProps) {
  const [parts, setParts] = useState(() => getCountdownParts(new Date(targetIso)));

  useEffect(() => {
    const target = new Date(targetIso);
    const tick = () => setParts(getCountdownParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (parts.totalMs <= 0) {
    return <p className="text-sm font-medium text-emerald-300">{labels.started}</p>;
  }

  const units = [
    { value: parts.days, label: labels.days },
    { value: parts.hours, label: labels.hours },
    { value: parts.minutes, label: labels.minutes },
    ...(!compact ? [{ value: parts.seconds, label: labels.seconds }] : []),
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
      {units.map((unit) => (
        <div
          key={unit.label}
          className={`flex flex-col items-center rounded-xl border border-white/10 bg-black/30 ${
            compact ? "min-w-[3.5rem] px-2 py-2" : "min-w-[4.5rem] px-3 py-3"
          }`}
        >
          <span className={`font-black tabular-nums text-white ${compact ? "text-xl" : "text-2xl"}`}>
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/50">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
