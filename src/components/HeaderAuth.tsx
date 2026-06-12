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
  variant: "desktop" | "mobile";
};

export function HeaderAuth({ locale, labels, variant }: HeaderAuthProps) {
  const { user } = useCurrentUser();

  if (variant === "desktop") {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {user ? (
          <>
            <Link
              href={`/${locale}/profile`}
              className="hidden items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/10 md:flex"
            >
              <UserAvatar user={user} size={28} />
              <span className="max-w-[8rem] truncate text-sm text-white/80">{user.name}</span>
            </Link>
            <LogoutButton locale={locale} label={labels.logout} />
          </>
        ) : (
          <Link
            href={`/${locale}/login`}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
          >
            {labels.login}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {user && (
        <Link
          href={`/${locale}/profile`}
          className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/90"
        >
          {labels.profile}
        </Link>
      )}
      {user?.isAdmin && (
        <Link
          href={`/${locale}/admin`}
          className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-2 text-xs text-amber-200"
        >
          {labels.admin}
        </Link>
      )}
    </>
  );
}

export function HeaderAdminLink({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const { user } = useCurrentUser();
  if (!user?.isAdmin) return null;

  return (
    <Link
      href={`/${locale}/admin`}
      className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30"
    >
      {label}
    </Link>
  );
}
