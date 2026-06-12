"use client";

import { useState } from "react";
import { LeagueCard } from "@/components/LeagueCard";
import { EmptyState } from "@/components/EmptyState";
import type { Locale } from "@/i18n/routing";

export type LeagueRow = {
  id: string;
  code: string;
  title: string;
  type: string;
  typeLabel: string;
  memberCount: number;
  creatorName?: string;
  isJoined: boolean;
  isFeatured?: boolean;
};

type LeaguesTabsProps = {
  locale: Locale;
  myLeagues: LeagueRow[];
  publicLeagues: LeagueRow[];
  schoolLeagues: LeagueRow[];
  companyLeagues: LeagueRow[];
  isLoggedIn: boolean;
  labels: {
    tabMy: string;
    tabPublic: string;
    tabSchool: string;
    tabCompany: string;
    emptyMy: string;
    emptyPublic: string;
    emptySchool: string;
    emptyCompany: string;
    members: string;
    by: string;
    joined: string;
    join: string;
    invite: string;
    featured: string;
    loginCta: string;
  };
};

type Tab = "my" | "public" | "school" | "company";

export function LeaguesTabs({
  locale,
  myLeagues,
  publicLeagues,
  schoolLeagues,
  companyLeagues,
  isLoggedIn,
  labels,
}: LeaguesTabsProps) {
  const [tab, setTab] = useState<Tab>(isLoggedIn && myLeagues.length > 0 ? "my" : "public");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "my", label: labels.tabMy, count: myLeagues.length },
    { id: "public", label: labels.tabPublic, count: publicLeagues.length },
    { id: "school", label: labels.tabSchool, count: schoolLeagues.length },
    { id: "company", label: labels.tabCompany, count: companyLeagues.length },
  ];

  function renderList(leagues: LeagueRow[], empty: string) {
    if (!isLoggedIn && tab === "my") {
      return <EmptyState icon="🔐" title={labels.loginCta} />;
    }
    if (leagues.length === 0) {
      return <EmptyState icon="👨‍👩‍👧‍👦" title={empty} />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {leagues.map((league) => (
          <LeagueCard
            key={league.id}
            locale={locale}
            code={league.code}
            title={league.title}
            type={league.type}
            typeLabel={league.typeLabel}
            memberCount={league.memberCount}
            creatorName={league.creatorName}
            isJoined={league.isJoined}
            featured={league.isFeatured}
            showInvite={league.isJoined}
            labels={{
              members: labels.members,
              by: labels.by,
              joined: labels.joined,
              join: labels.join,
              invite: labels.invite,
              featured: labels.featured,
            }}
          />
        ))}
      </div>
    );
  }

  const activeList =
    tab === "my"
      ? myLeagues
      : tab === "school"
        ? schoolLeagues
        : tab === "company"
          ? companyLeagues
          : publicLeagues;

  const emptyMsg =
    tab === "my"
      ? labels.emptyMy
      : tab === "school"
        ? labels.emptySchool
        : tab === "company"
          ? labels.emptyCompany
          : labels.emptyPublic;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-500 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ms-1.5 rounded-full bg-black/20 px-1.5 text-xs">{t.count}</span>
            )}
          </button>
        ))}
      </div>
      {renderList(activeList, emptyMsg)}
    </div>
  );
}
