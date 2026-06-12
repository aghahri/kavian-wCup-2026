"use client";

import { useState } from "react";

type NotificationPrefsFormProps = {
  initial: { matchReminders: boolean; leagueUpdates: boolean; predictionResults: boolean };
  labels: {
    title: string;
    subtitle: string;
    matchReminders: string;
    leagueUpdates: string;
    predictionResults: string;
    save: string;
    saving: string;
    saved: string;
    comingSoon: string;
  };
};

export function NotificationPrefsForm({ initial, labels }: NotificationPrefsFormProps) {
  const [prefs, setPrefs] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      setMessage(labels.saved);
    } catch {
      setMessage("Error");
    } finally {
      setLoading(false);
    }
  }

  const items = [
    { key: "matchReminders" as const, label: labels.matchReminders },
    { key: "leagueUpdates" as const, label: labels.leagueUpdates },
    { key: "predictionResults" as const, label: labels.predictionResults },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-bold text-white">{labels.title}</h2>
      <p className="mt-1 text-sm text-white/60">{labels.subtitle}</p>
      <p className="mt-2 text-xs text-amber-200/80">{labels.comingSoon}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/80">{item.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
              className={`relative h-7 w-12 rounded-full transition ${
                prefs[item.key] ? "bg-emerald-500" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                  prefs[item.key] ? "start-5" : "start-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-60"
      >
        {loading ? labels.saving : labels.save}
      </button>
    </section>
  );
}
