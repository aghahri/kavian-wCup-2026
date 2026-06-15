"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { buildShareUrls, SHOKOOFALOO_URL } from "@/lib/share";
import { trackShareShokoofaloo, type ShareAnalyticsSource } from "@/lib/share-analytics";

type ShareButtonsProps = {
  text: string;
  url: string;
  labels: { share: string; telegram: string; whatsapp: string; x: string; facebook: string };
  analyticsSource?: ShareAnalyticsSource;
};

export function ShareButtons({ text, url, labels, analyticsSource = "share_toolbar" }: ShareButtonsProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("share");
  const links = buildShareUrls(text, url);

  function onShokoofalooClick() {
    trackShareShokoofaloo(analyticsSource, pathname, locale);
  }

  const items = [
    { key: "whatsapp" as const, href: links.whatsapp, label: labels.whatsapp, color: "bg-emerald-500/20 text-emerald-200", logo: false },
    { key: "telegram" as const, href: links.telegram, label: labels.telegram, color: "bg-sky-500/20 text-sky-200", logo: false },
    { key: "x" as const, href: links.x, label: labels.x, color: "bg-white/10 text-white/80", logo: false },
    { key: "facebook" as const, href: links.facebook, label: labels.facebook, color: "bg-blue-500/20 text-blue-200", logo: false },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/50">{labels.share}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 2).map((item) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80 ${item.color}`}
          >
            {item.label}
          </a>
        ))}

        <a
          href={SHOKOOFALOO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t("shokoofalooTooltip")}
          onClick={onShokoofalooClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500/20 px-3 py-2 text-xs font-medium text-pink-100 transition hover:opacity-80"
        >
          <Image src="/shokoofaloo-logo.svg" alt="" width={16} height={16} className="shrink-0" />
          {t("shokoofaloo")}
        </a>

        {items.slice(2).map((item) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80 ${item.color}`}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
