"use client";

import Link from "next/link";
import { useState } from "react";
import { ShareButtons } from "@/components/ShareButtons";
import type { Locale } from "@/i18n/routing";

type LeagueInviteScreenProps = {
  locale: Locale;
  leagueTitle: string;
  leagueCode: string;
  inviteUrl: string;
  stats: { clicks: number; joins: number; members: number };
  shareText: string;
  labels: {
    title: string;
    subtitle: string;
    reward: string;
    copyLink: string;
    copied: string;
    inviteCode: string;
    statsClicks: string;
    statsJoins: string;
    statsMembers: string;
    goToLeague: string;
    share: { share: string; telegram: string; whatsapp: string; x: string; facebook: string };
  };
  created?: boolean;
};

export function LeagueInviteScreen({
  locale,
  leagueTitle,
  leagueCode,
  inviteUrl,
  stats,
  shareText,
  labels,
  created,
}: LeagueInviteScreenProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/25 via-[#0b1f3a] to-[#071526] p-6 text-center shadow-2xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
          {created ? "🎉" : "🔗"} Kavian Football
        </p>
        <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">{labels.title}</h1>
        <p className="mt-2 text-lg font-bold text-emerald-200">{leagueTitle}</p>
        <p className="mt-3 text-sm leading-7 text-white/70">{labels.subtitle}</p>
        <p className="mt-4 rounded-xl bg-amber-400/15 px-4 py-3 text-sm font-semibold text-amber-100">
          {labels.reward}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xl font-black text-emerald-300">{stats.clicks}</p>
            <p className="text-white/50">{labels.statsClicks}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xl font-black text-emerald-300">{stats.joins}</p>
            <p className="text-white/50">{labels.statsJoins}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-3">
            <p className="text-xl font-black text-emerald-300">{stats.members}</p>
            <p className="text-white/50">{labels.statsMembers}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="mt-6 w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white hover:bg-emerald-400"
        >
          {copied ? labels.copied : labels.copyLink}
        </button>
        <p className="mt-2 break-all text-xs text-white/40">{inviteUrl}</p>
        <p className="mt-2 text-xs text-white/40">
          {labels.inviteCode}: {leagueCode}
        </p>
      </div>

      <ShareButtons text={shareText} url={inviteUrl} labels={labels.share} />

      <Link
        href={`/${locale}/leagues/${leagueCode}`}
        className="block rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-emerald-300 hover:bg-white/10"
      >
        {labels.goToLeague} →
      </Link>
    </div>
  );
}
