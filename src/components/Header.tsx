import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { HeaderAuth } from "@/components/HeaderAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCurrentUser } from "@/lib/auth";
import { getNavItemsForSurface } from "@/lib/navigation";
import type { Locale } from "@/i18n/routing";

type HeaderProps = {
  locale: Locale;
};

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();
  const ctx = { isLoggedIn: Boolean(user), isAdmin: Boolean(user?.isAdmin) };

  const desktopNav = getNavItemsForSurface("header", locale, ctx, (key) => t(key));
  const mobileNav = getNavItemsForSurface("mobile", locale, ctx, (key) => t(key));

  const authLabels = {
    login: t("login"),
    logout: t("logout"),
    profile: t("profile"),
    admin: t("admin"),
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1f3a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${locale}`} className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="text-2xl" aria-hidden>
            ⚽
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Kavian</p>
            <p className="truncate text-xs text-emerald-300">WC 2026</p>
          </div>
        </Link>

        <AppNav items={desktopNav} variant="header-desktop" />

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <HeaderAuth locale={locale} labels={authLabels} />
        </div>
      </div>

      <AppNav items={mobileNav} variant="header-mobile" />
    </header>
  );
}
