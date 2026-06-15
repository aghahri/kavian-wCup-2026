"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type MatchEventRow = {
  id: string;
  minute: number | null;
  type: string;
  teamName: string | null;
  playerName: string | null;
  descriptionFa: string | null;
};

type AdminMatchEventsProps = {
  matchId: string;
  initialEvents: MatchEventRow[];
};

const EVENT_TYPES = [
  "goal",
  "yellow_card",
  "red_card",
  "substitution",
  "var",
  "kickoff",
  "halftime",
  "fulltime",
];

export function AdminMatchEvents({ matchId, initialEvents }: AdminMatchEventsProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    minute: "",
    type: "goal",
    teamName: "",
    playerName: "",
    descriptionFa: "",
    sourceUrl: "",
  });

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    setError("");
    const response = await fetch(`/api/admin/matches/${matchId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        minute: form.minute === "" ? null : Number(form.minute),
        type: form.type,
        teamName: form.teamName || null,
        playerName: form.playerName || null,
        descriptionFa: form.descriptionFa || null,
        sourceUrl: form.sourceUrl || null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    setEvents((prev) => [...prev, data.event]);
    setForm({ minute: "", type: "goal", teamName: "", playerName: "", descriptionFa: "", sourceUrl: "" });
    router.refresh();
  }

  async function removeEvent(eventId: string) {
    if (!confirm("حذف این رویداد؟")) return;
    const response = await fetch(`/api/admin/matches/${matchId}/events/${eventId}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="mb-2 text-sm font-medium text-white/80">رویدادها / گل‌ها</p>
      {events.length > 0 && (
        <ul className="mb-3 space-y-1 text-xs text-white/70">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between gap-2">
              <span>
                {ev.minute != null ? `${ev.minute}'` : "—"} {ev.type}{" "}
                {ev.playerName ?? ""} {ev.teamName ? `— ${ev.teamName}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeEvent(ev.id)}
                className="text-red-300 hover:underline"
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={addEvent} className="grid gap-2 sm:grid-cols-2">
        <input
          type="number"
          placeholder="دقیقه"
          value={form.minute}
          onChange={(e) => setForm({ ...form, minute: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          placeholder="بازیکن"
          value={form.playerName}
          onChange={(e) => setForm({ ...form, playerName: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
        />
        <input
          placeholder="تیم"
          value={form.teamName}
          onChange={(e) => setForm({ ...form, teamName: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
        />
        <input
          placeholder="توضیح (FA)"
          value={form.descriptionFa}
          onChange={(e) => setForm({ ...form, descriptionFa: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white sm:col-span-2"
        />
        <input
          placeholder="لینک منبع (اختیاری)"
          value={form.sourceUrl}
          onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white sm:col-span-2"
        >
          افزودن رویداد
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
