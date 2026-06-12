import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { getCurrentUser } from "@/lib/auth";
import { getNavItemsForSurface } from "@/lib/navigation";
import type { Locale } from "@/i18n/routing";

type FooterProps = {
  locale: Locale;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const user = await getCurrentUser();
  const ctx = { isLoggedIn: Boolean(user), isAdmin: Boolean(user?.isAdmin) };
  const footerNav = getNavItemsForSurface("footer", locale, ctx, (key) => tn(key));

  return (
    <footer className="border-t border-white/10 bg-[#071526] px-4 py-8 text-center">
      <p className="text-sm text-white/60">{t("tagline")}</p>
      <p className="mt-1 text-xs text-white/40">{t("scoring")}</p>
      <AppNav items={footerNav} variant="footer" />
      <p className="mt-4 text-xs text-white/30">
        <Link href={`/${locale}/fans/map`} className="hover:text-emerald-300">
          {tn("fanMap")}
        </Link>
        {" · "}
        <Link href={`/${locale}/schools`} className="hover:text-emerald-300">
          {tn("schools")}
        </Link>
      </p>
    </footer>
  );
}
