"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/navigation";

export type NavLinkItem = {
  id: string;
  href: string;
  label: string;
  requiresAuth?: boolean;
  isAdmin?: boolean;
};

type AppNavProps = {
  items: NavLinkItem[];
  variant: "header-desktop" | "header-mobile" | "footer";
};

export function AppNav({ items, variant }: AppNavProps) {
  const pathname = usePathname();

  if (variant === "header-desktop") {
    return (
      <nav className="hidden items-center gap-0.5 lg:flex">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`rounded-lg px-2.5 py-2 text-sm transition ${
                item.isAdmin
                  ? active
                    ? "bg-amber-500/30 text-amber-100"
                    : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  : active
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  if (variant === "header-mobile") {
    return (
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 lg:hidden">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? "bg-emerald-500/25 text-emerald-100"
                  : item.isAdmin
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-white/5 text-white/90"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="text-xs text-white/50 transition hover:text-emerald-300"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
