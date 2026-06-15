"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { AdminResultRow } from "@/lib/admin-results";
import { parseResultPaste } from "@/lib/result-import-parser";

type Labels = {
  pasteTitle: string;
  pastePlaceholder: string;
  pasteApply: string;
  save: string;
  verify: string;
  refreshAi: string;
  saved: string;
  statusUpcoming: string;
  statusLive: string;
  statusFinished: string;
  missingScoreWarning: string;
  sourceName: string;
  sourceUrl: string;
  highlightsUrl: string;
  embedUrl: string;
  homeScore: string;
  awayScore: string;
  kickedOff: string;
  missingScore: string;
  missingVerification: string;
  missingHighlights: string;
  staleAi: string;
};

type AdminResultsPanelProps = {
  initialRows: AdminResultRow[];
  highlightMatchId?: string | null;
  labels: Labels;
};

function ResultEditor({
  row,
  labels,
  onToast,
}: {
  row: AdminResultRow;
  labels: Labels;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(row.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(row.awayScore ?? 0);
  const [isFinished, setIsFinished] = useState(row.isFinished);
  const [sourceName, setSourceName] = useState(row.scoreSourceName ?? "");
  const [sourceUrl, setSourceUrl] = useState(row.scoreSourceUrl ?? "");
  const [highlightsUrl, setHighlightsUrl] = useState(row.highlightsUrl ?? "");
  const [embedUrl, setEmbedUrl] = useState(row.highlightsEmbedUrl ?? "");
  const [busy, setBusy] = useState(false);

  const statusLabel =
    row.phase === "live"
      ? labels.statusLive
      : row.phase === "finished"
        ? labels.statusFinished
        : labels.statusUpcoming;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(`/api/admin/matches/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      onToast("Error");
      return false;
    }
    router.refresh();
    onToast(labels.saved);
    return true;
  }

  async function save() {
    await patch({
      homeScore,
      awayScore,
      isFinished: isFinished || (homeScore >= 0 && awayScore >= 0),
      autoFinish: true,
      scoreSourceName: sourceName || null,
      scoreSourceUrl: sourceUrl || null,
      highlightsUrl: highlightsUrl || null,
      highlightsEmbedUrl: embedUrl || null,
    });
  }

  async function verify() {
    await patch({
      homeScore,
      awayScore,
      isFinished: true,
      markVerified: true,
      scoreSourceName: sourceName || "FIFA",
      scoreSourceUrl: sourceUrl || null,
      highlightsUrl: highlightsUrl || null,
      highlightsEmbedUrl: embedUrl || null,
    });
  }

  async function refreshAi() {
    setBusy(true);
    const response = await fetch(`/api/admin/matches/${row.id}/refresh`, { method: "POST" });
    setBusy(false);
    if (response.ok) {
      onToast(labels.saved);
      router.refresh();
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-white">
          {row.homeTeamFa} vs {row.awayTeamFa}
        </h3>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">{statusLabel}</span>
          {row.missingScore && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-200">{labels.missingScore}</span>
          )}
          {row.missingVerification && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-200">{labels.missingVerification}</span>
          )}
          {row.missingHighlights && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">{labels.missingHighlights}</span>
          )}
          {row.staleAi && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">{labels.staleAi}</span>
          )}
        </div>
      </div>

      {row.missingScore && row.kickedOff && (
        <p className="mb-3 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">{labels.missingScoreWarning}</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-white/60">
          {labels.homeScore}
          <input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="text-xs text-white/60">
          {labels.awayScore}
          <input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="text-xs text-white/60">
          {labels.sourceName}
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="FIFA"
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="text-xs text-white/60">
          {labels.sourceUrl}
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="text-xs text-white/60 sm:col-span-2">
          {labels.highlightsUrl}
          <input
            value={highlightsUrl}
            onChange={(e) => setHighlightsUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="text-xs text-white/60 sm:col-span-2">
          {labels.embedUrl}
          <input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-white"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-white/70 sm:col-span-2">
          <input type="checkbox" checked={isFinished} onChange={(e) => setIsFinished(e.target.checked)} />
          {labels.statusFinished}
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {labels.save}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={verify}
          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {labels.verify}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={refreshAi}
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {labels.refreshAi}
        </button>
      </div>
    </article>
  );
}

export function AdminResultsPanel({ initialRows, highlightMatchId, labels }: AdminResultsPanelProps) {
  const router = useRouter();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!highlightMatchId) return;
    const el = document.getElementById(`result-editor-${highlightMatchId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightMatchId]);
  const [paste, setPaste] = useState("");
  const [pasteTarget, setPasteTarget] = useState(initialRows[0]?.id ?? "");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function applyPaste(e: FormEvent) {
    e.preventDefault();
    if (!pasteTarget) return;
    const parsed = parseResultPaste(paste);
    void (async () => {
      const body: Record<string, unknown> = { autoFinish: true, isFinished: true };
      if (parsed.homeScore !== null) body.homeScore = parsed.homeScore;
      if (parsed.awayScore !== null) body.awayScore = parsed.awayScore;
      if (parsed.sourceUrl) body.scoreSourceUrl = parsed.sourceUrl;
      if (parsed.highlightsUrl) body.highlightsUrl = parsed.highlightsUrl;
      const response = await fetch(`/api/admin/matches/${pasteTarget}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        showToast(labels.saved);
        setPaste("");
        router.refresh();
      }
    })();
  }

  const kickedOff = initialRows.filter((r) => r.kickedOff);

  return (
    <div className="space-y-6">
      {toast && (
        <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg">
          {toast}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: labels.kickedOff, count: kickedOff.length },
          { label: labels.missingScore, count: initialRows.filter((r) => r.missingScore).length },
          { label: labels.missingHighlights, count: initialRows.filter((r) => r.missingHighlights).length },
          { label: labels.staleAi, count: initialRows.filter((r) => r.staleAi).length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-black/30 p-3 text-center">
            <p className="text-2xl font-black text-emerald-300">{s.count}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={applyPaste} className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-2 text-sm font-bold text-white">{labels.pasteTitle}</h2>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={labels.pastePlaceholder}
          rows={4}
          className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={pasteTarget}
            onChange={(e) => setPasteTarget(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white"
          >
            {kickedOff.map((r) => (
              <option key={r.id} value={r.id}>
                {r.homeTeamFa} vs {r.awayTeamFa}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">
            {labels.pasteApply}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {kickedOff.map((row) => (
          <div
            key={row.id}
            id={`result-editor-${row.id}`}
            className={highlightMatchId === row.id ? "ring-2 ring-emerald-400/50 rounded-2xl" : ""}
          >
            <ResultEditor row={row} labels={labels} onToast={showToast} />
          </div>
        ))}
      </div>
    </div>
  );
}
