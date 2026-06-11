"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecalculateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/leaderboard/recalculate", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "خطا در به‌روزرسانی");
        return;
      }

      setMessage(`${data.updated} پیش‌بینی به‌روزرسانی شد`);
      router.refresh();
    } catch {
      setMessage("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        {loading ? "در حال به‌روزرسانی..." : "به‌روزرسانی امتیاز جدول"}
      </button>
      {message && <p className="mt-2 text-sm text-emerald-200">{message}</p>}
    </div>
  );
}
