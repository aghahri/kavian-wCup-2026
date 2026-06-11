"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Locale } from "@/i18n/routing";

type TournamentItem = {
  id: string;
  slug: string;
  name: string;
  isVip: boolean;
  memberCount: number;
  joined: boolean;
  canJoin: boolean;
  prizes: Array<{ id: string; title: string; sponsorName: string | null }>;
};

type TournamentListProps = {
  locale: Locale;
  tournaments: TournamentItem[];
  isLoggedIn: boolean;
};

export function TournamentList({ locale, tournaments, isLoggedIn }: TournamentListProps) {
  const t = useTranslations("tournaments");
  const te = useTranslations("errors");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function joinTournament(id: string) {
    if (!isLoggedIn) {
      router.push(`/${locale}/login`);
      return;
    }

    setLoadingId(id);
    setError("");

    try {
      const response = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? te("network"));
        return;
      }
      router.refresh();
    } catch {
      setError(te("network"));
    } finally {
      setLoadingId(null);
    }
  }

  if (tournaments.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>
      )}
      {tournaments.map((tournament) => (
        <article
          key={tournament.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{tournament.name}</h2>
              <p className="mt-1 text-xs text-white/50">{tournament.memberCount} members</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tournament.isVip
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              {tournament.isVip ? t("vip") : t("free")}
            </span>
          </div>

          {tournament.prizes.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-amber-200">{t("prizes")}</p>
              <ul className="space-y-1 text-sm text-white/80">
                {tournament.prizes.map((prize) => (
                  <li key={prize.id}>
                    {prize.title}
                    {prize.sponsorName && (
                      <span className="text-white/50"> — {prize.sponsorName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            {tournament.joined ? (
              <span className="text-sm font-medium text-emerald-300">{t("joined")}</span>
            ) : tournament.canJoin ? (
              <button
                type="button"
                onClick={() => joinTournament(tournament.id)}
                disabled={loadingId === tournament.id}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400 disabled:opacity-60"
              >
                {loadingId === tournament.id ? "..." : t("join")}
              </button>
            ) : (
              <span className="text-sm text-amber-200">{t("vipRequired")}</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
