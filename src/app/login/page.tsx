"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "خطا در ورود");
        return;
      }

      router.push(data.user?.isAdmin ? "/admin" : "/predict");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-black text-white">ورود</h1>
        <p className="mt-2 text-sm leading-7 text-white/70">
          فقط نام و شماره موبایل کافی است. اگر اولین بار است، حساب شما ساخته می‌شود.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-white/80">نام شما</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: علی"
              required
              minLength={2}
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/80">شماره موبایل</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              required
              dir="ltr"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-left text-white outline-none focus:border-emerald-400"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "در حال ورود..." : "ورود / ثبت‌نام"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/50">
          مدیر سایت: کاویان — شماره نمونه: ۰۹۱۲۰۰۰۰۰۰۰
        </p>
      </div>
    </div>
  );
}
