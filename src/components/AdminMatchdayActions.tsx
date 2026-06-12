"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminMatchdayActionsProps = {
  closeLabel: string;
  refreshLabel: string;
};

export function AdminMatchdayActions({ closeLabel, refreshLabel }: AdminMatchdayActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"close" | "refresh" | null>(null);
  const [message, setMessage] = useState("");

  async function run(action: "close" | "refresh") {
    setLoading(action);
    setMessage("");
    try {
      const path =
        action === "close"
          ? "/api/admin/matchday/close-predictions"
          : "/api/admin/matchday/refresh-summaries";
      const res = await fetch(path, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.count ?? data.refreshed ?? 0} updated`);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => run("close")}
        disabled={loading !== null}
        className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white hover:bg-amber-400 disabled:opacity-60"
      >
        {loading === "close" ? "…" : closeLabel}
      </button>
      <button
        type="button"
        onClick={() => run("refresh")}
        disabled={loading !== null}
        className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading === "refresh" ? "…" : refreshLabel}
      </button>
      {message && <p className="w-full text-sm text-emerald-300">{message}</p>}
    </div>
  );
}
