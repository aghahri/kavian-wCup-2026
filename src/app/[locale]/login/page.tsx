"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/routing";

export default function LoginPage() {
  const t = useTranslations("login");
  const te = useTranslations("errors");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) ?? "fa";

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
        setError(data.error ?? te("network"));
        return;
      }

      router.push(data.user?.isAdmin ? `/${locale}/admin` : `/${locale}/predict`);
      router.refresh();
    } catch {
      setError(te("network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-black text-white">{t("title")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/70">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-white/80">{t("name")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              minLength={2}
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/80">{t("phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              required
              dir="ltr"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-start text-white outline-none focus:border-emerald-400"
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
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/50">{t("adminHint")}</p>
      </div>
    </div>
  );
}
