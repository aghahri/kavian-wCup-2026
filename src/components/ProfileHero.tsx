"use client";

import Link from "next/link";
import { useCurrentUser } from "@/contexts/CurrentUserProvider";
import { BadgeList } from "@/components/BadgeList";
import { UserAvatar } from "@/components/UserAvatar";
import type { BadgeId } from "@/lib/badges";
import type { Locale } from "@/i18n/routing";

type ProfileHeroProps = {
  locale: Locale;
  joinedLabel: string;
  countryLabel?: string;
  predictLabel: string;
  badges: BadgeId[];
  badgeLabels: Record<BadgeId, string>;
  fallback: {
    id: string;
    name: string;
    avatarUrl: string | null;
    updatedAt: Date | string;
    createdAt: Date;
  };
};

export function ProfileHero({
  locale,
  joinedLabel,
  countryLabel,
  predictLabel,
  badges,
  badgeLabels,
  fallback,
}: ProfileHeroProps) {
  const { user: clientUser } = useCurrentUser();

  const user = clientUser ?? {
    id: fallback.id,
    name: fallback.name,
    avatarUrl: fallback.avatarUrl,
    isAdmin: false,
    isVip: false,
    updatedAt:
      typeof fallback.updatedAt === "string"
        ? fallback.updatedAt
        : fallback.updatedAt.toISOString(),
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size={80} />
        <div>
          <h1 className="text-2xl font-black text-white">{user.name}</h1>
          {countryLabel && (
            <p className="mt-1 text-sm text-white/70">{countryLabel}</p>
          )}
          <p className="mt-1 text-sm text-white/60">{joinedLabel}</p>
          <div className="mt-2">
            <BadgeList badges={badges} labels={badgeLabels} />
          </div>
        </div>
      </div>
      <Link
        href={`/${locale}/predict`}
        className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400"
      >
        {predictLabel}
      </Link>
    </div>
  );
}
