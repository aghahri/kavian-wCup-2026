"use client";

import Link from "next/link";
import { useCurrentUser } from "@/contexts/CurrentUserProvider";
import { LogoutButton } from "@/components/LogoutButton";
import { UserAvatar } from "@/components/UserAvatar";
import type { Locale } from "@/i18n/routing";

type HeaderAuthProps = {
  locale: Locale;
  labels: {
    login: string;
    logout: string;
    profile: string;
    admin: string;
  };
};

export function HeaderAuth({ locale, labels }: HeaderAuthProps) {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
      >
        {labels.login}
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/${locale}/profile`}
        className="hidden items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/10 md:flex"
      >
        <UserAvatar user={user} size={28} />
        <span className="max-w-[8rem] truncate text-sm text-white/80">{user.name}</span>
      </Link>
      <LogoutButton locale={locale} label={labels.logout} />
    </div>
  );
}
