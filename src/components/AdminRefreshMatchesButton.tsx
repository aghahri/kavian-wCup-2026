"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminRefreshMatchesButtonProps = {
  label: string;
};

export function AdminRefreshMatchesButton({ label }: AdminRefreshMatchesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/matches/refresh-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.refreshed} matches refreshed`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "…" : label}
      </button>
      {message && <p className="mt-2 text-sm text-emerald-300">{message}</p>}
    </div>
  );
}
