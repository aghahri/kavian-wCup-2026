"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, type Locale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  locale: Locale;
};

const labels: Record<Locale, string> = {
  fa: "فا",
  en: "EN",
  ar: "ع",
};

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();

  function hrefFor(target: Locale) {
    const segments = pathname.split("/");
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {locales.map((code) => (
        <Link
          key={code}
          href={hrefFor(code)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition ${
            code === locale
              ? "bg-emerald-500 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {labels[code]}
        </Link>
      ))}
    </div>
  );
}
