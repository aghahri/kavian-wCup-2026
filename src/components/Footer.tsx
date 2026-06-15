import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { getCurrentUser } from "@/lib/auth";
import { getCompactFooterNavItems } from "@/lib/navigation";
import type { Locale } from "@/i18n/routing";

type FooterProps = {
  locale: Locale;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const user = await getCurrentUser();
  const ctx = { isLoggedIn: Boolean(user), isAdmin: Boolean(user?.isAdmin) };
  const footerNav = getCompactFooterNavItems(locale, ctx, (key) => tn(key));

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#071526] px-4 py-5 text-center">
      <p className="text-xs text-white/50">{t("tagline")}</p>
      <AppNav items={footerNav} variant="footer" />
      {user?.isAdmin && (
        <p className="mt-3 text-xs">
          <Link href={`/${locale}/admin`} className="text-amber-300/80 hover:text-amber-200">
            {tn("admin")}
          </Link>
        </p>
      )}
    </footer>
  );
}
