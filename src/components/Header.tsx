import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderAdminLink, HeaderAuth } from "@/components/HeaderAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/i18n/routing";

type HeaderProps = {
  locale: Locale;
};

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations("nav");

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/fixtures`, label: t("fixtures") },
    { href: `/${locale}/predict`, label: t("predict") },
    { href: `/${locale}/leagues`, label: t("leagues") },
    { href: `/${locale}/leaderboard`, label: t("leaderboard") },
    { href: `/${locale}/ai`, label: t("ai") },
  ];

  const authLabels = {
    login: t("login"),
    logout: t("logout"),
    profile: t("profile"),
    admin: t("admin"),
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1f3a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2">
          <span className="text-2xl" aria-hidden>
            ⚽
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Kavian</p>
            <p className="truncate text-xs text-emerald-300">WC 2026</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <HeaderAdminLink locale={locale} label={t("admin")} />
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <HeaderAuth locale={locale} labels={authLabels} variant="desktop" />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/90"
          >
            {link.label}
          </Link>
        ))}
        <HeaderAuth locale={locale} labels={authLabels} variant="mobile" />
      </nav>
    </header>
  );
}
