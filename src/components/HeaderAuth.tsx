"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-20 shrink-0 rounded-lg bg-white/5" aria-hidden />;
  }

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
        title={labels.profile}
      >
        <UserAvatar user={user} size={28} />
        <span className="max-w-[8rem] truncate text-sm text-white/80">{user.name}</span>
      </Link>
      <Link
        href={`/${locale}/profile`}
        className="rounded-lg p-1 transition hover:bg-white/10 md:hidden"
        title={labels.profile}
      >
        <UserAvatar user={user} size={28} />
      </Link>
      {user.isAdmin && (
        <Link
          href={`/${locale}/admin`}
          className="hidden rounded-lg bg-amber-500/20 px-2 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/30 sm:inline"
        >
          {labels.admin}
        </Link>
      )}
      <LogoutButton locale={locale} label={labels.logout} />
    </div>
  );
}
