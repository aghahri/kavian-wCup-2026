import type { Locale } from "@/i18n/routing";

export type NavVisibility = "public" | "auth" | "admin";

export type NavSurface = "header" | "footer" | "mobile";

export type NavContext = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

export type NavItemDef = {
  id: string;
  path: string;
  labelKey: string;
  visibility: NavVisibility;
  header: boolean;
  footer: boolean;
  mobile: boolean;
};

/** Single source of truth for app navigation. */
export const NAV_ITEMS: NavItemDef[] = [
  { id: "home", path: "", labelKey: "home", visibility: "public", header: true, footer: true, mobile: true },
  { id: "fixtures", path: "fixtures", labelKey: "fixtures", visibility: "public", header: true, footer: true, mobile: true },
  { id: "predict", path: "predict", labelKey: "predict", visibility: "public", header: true, footer: true, mobile: true },
  { id: "daily", path: "daily", labelKey: "daily", visibility: "auth", header: true, footer: true, mobile: true },
  { id: "leaderboard", path: "leaderboard", labelKey: "leaderboard", visibility: "public", header: true, footer: true, mobile: true },
  { id: "leagues", path: "leagues", labelKey: "leagues", visibility: "public", header: true, footer: true, mobile: true },
  { id: "ai", path: "ai", labelKey: "ai", visibility: "public", header: true, footer: true, mobile: true },
  { id: "fans", path: "fans/map", labelKey: "fanMap", visibility: "public", header: true, footer: true, mobile: true },
  { id: "schools", path: "schools", labelKey: "schools", visibility: "public", header: true, footer: true, mobile: true },
  { id: "referrals", path: "referrals", labelKey: "referrals", visibility: "auth", header: true, footer: true, mobile: true },
  { id: "profile", path: "profile", labelKey: "profile", visibility: "auth", header: false, footer: true, mobile: false },
  { id: "admin", path: "admin", labelKey: "admin", visibility: "admin", header: true, footer: false, mobile: false },
];

export function navHref(locale: Locale, path: string): string {
  return path ? `/${locale}/${path}` : `/${locale}`;
}

export function resolveNavHref(item: NavItemDef, locale: Locale, ctx: NavContext): string {
  if (item.visibility === "auth" && !ctx.isLoggedIn) {
    return navHref(locale, "login");
  }
  return navHref(locale, item.path);
}

export function isNavItemVisible(item: NavItemDef, ctx: NavContext): boolean {
  if (item.visibility === "admin" && !ctx.isAdmin) return false;
  return true;
}

export function getNavItemsForSurface(
  surface: NavSurface,
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  const surfaceKey = surface === "header" ? "header" : surface === "footer" ? "footer" : "mobile";

  return NAV_ITEMS.filter((item) => {
    if (!item[surfaceKey]) return false;
    return isNavItemVisible(item, ctx);
  }).map((item) => ({
    id: item.id,
    href: resolveNavHref(item, locale, ctx),
    label: label(item.labelKey),
    requiresAuth: item.visibility === "auth" && !ctx.isLoggedIn,
    isAdmin: item.visibility === "admin",
  }));
}

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (pathname.startsWith(`${href}/`)) return true;
  return false;
}
