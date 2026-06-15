import type { Locale } from "@/i18n/routing";

export type NavVisibility = "public" | "auth" | "admin";

export type NavSurface = "header" | "footer" | "mobile" | "more";

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
  more: boolean;
};

/** Single source of truth for app navigation. */
export const NAV_ITEMS: NavItemDef[] = [
  { id: "home", path: "", labelKey: "home", visibility: "public", header: true, footer: true, mobile: true, more: false },
  { id: "fixtures", path: "fixtures", labelKey: "fixtures", visibility: "public", header: true, footer: true, mobile: true, more: false },
  { id: "predict", path: "predict", labelKey: "predict", visibility: "public", header: true, footer: true, mobile: true, more: false },
  { id: "leagues", path: "leagues", labelKey: "leagues", visibility: "public", header: true, footer: true, mobile: true, more: false },
  { id: "ai", path: "ai", labelKey: "ai", visibility: "public", header: true, footer: true, mobile: true, more: false },
  { id: "second-chance", path: "second-chance", labelKey: "secondChance", visibility: "public", header: true, footer: false, mobile: true, more: false },
  { id: "profile", path: "profile", labelKey: "profile", visibility: "auth", header: true, footer: false, mobile: false, more: false },
  { id: "daily", path: "daily", labelKey: "daily", visibility: "auth", header: false, footer: false, mobile: false, more: true },
  { id: "missions", path: "missions", labelKey: "missions", visibility: "auth", header: false, footer: false, mobile: false, more: true },
  { id: "fans", path: "fans/map", labelKey: "fanMap", visibility: "public", header: false, footer: false, mobile: false, more: true },
  { id: "schools", path: "schools", labelKey: "schools", visibility: "public", header: false, footer: false, mobile: false, more: true },
  { id: "referrals", path: "referrals", labelKey: "referrals", visibility: "auth", header: false, footer: false, mobile: false, more: true },
  { id: "crowd", path: "crowd", labelKey: "crowd", visibility: "public", header: false, footer: false, mobile: false, more: false },
  { id: "recap", path: "recap", labelKey: "recap", visibility: "public", header: false, footer: false, mobile: false, more: false },
  { id: "leaderboard", path: "leaderboard", labelKey: "leaderboard", visibility: "public", header: false, footer: false, mobile: false, more: false },
  { id: "admin", path: "admin", labelKey: "admin", visibility: "admin", header: false, footer: false, mobile: false, more: false },
];

export const HEADER_MAIN_IDS = [
  "home",
  "fixtures",
  "predict",
  "leagues",
  "ai",
  "second-chance",
  "profile",
] as const;

export const MORE_DRAWER_IDS = ["daily", "missions", "fans", "schools", "referrals"] as const;

export const FOOTER_COMPACT_IDS = ["home", "fixtures", "predict", "leagues", "ai"] as const;

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

function mapNavItem(
  item: NavItemDef,
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  return {
    id: item.id,
    href: resolveNavHref(item, locale, ctx),
    label: label(item.labelKey),
    requiresAuth: item.visibility === "auth" && !ctx.isLoggedIn,
    isAdmin: item.visibility === "admin",
  };
}

export function getNavItemsForSurface(
  surface: NavSurface,
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  const surfaceKey =
    surface === "header"
      ? "header"
      : surface === "footer"
        ? "footer"
        : surface === "more"
          ? "more"
          : "mobile";

  return NAV_ITEMS.filter((item) => {
    if (!item[surfaceKey]) return false;
    return isNavItemVisible(item, ctx);
  }).map((item) => mapNavItem(item, locale, ctx, label));
}

export function getHeaderMainNavItems(
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  return NAV_ITEMS.filter((item) =>
    HEADER_MAIN_IDS.includes(item.id as (typeof HEADER_MAIN_IDS)[number])
  )
    .filter((item) => isNavItemVisible(item, ctx))
    .map((item) => mapNavItem(item, locale, ctx, label));
}

export function getMoreDrawerNavItems(
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  return NAV_ITEMS.filter((item) =>
    MORE_DRAWER_IDS.includes(item.id as (typeof MORE_DRAWER_IDS)[number])
  )
    .filter((item) => isNavItemVisible(item, ctx))
    .map((item) => mapNavItem(item, locale, ctx, label));
}

/** Compact footer links — avoid duplicating full header nav on mobile. */
export function getCompactFooterNavItems(
  locale: Locale,
  ctx: NavContext,
  label: (key: string) => string
) {
  return NAV_ITEMS.filter((item) =>
    FOOTER_COMPACT_IDS.includes(item.id as (typeof FOOTER_COMPACT_IDS)[number])
  )
    .filter((item) => isNavItemVisible(item, ctx))
    .map((item) => mapNavItem(item, locale, ctx, label));
}

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (pathname.startsWith(`${href}/`)) return true;
  return false;
}
