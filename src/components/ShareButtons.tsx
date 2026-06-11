"use client";

import { buildShareUrls } from "@/lib/share";

type ShareButtonsProps = {
  text: string;
  url: string;
  labels: { share: string; telegram: string; whatsapp: string; x: string; facebook: string };
};

export function ShareButtons({ text, url, labels }: ShareButtonsProps) {
  const links = buildShareUrls(text, url);

  const items = [
    { key: "telegram" as const, href: links.telegram, label: labels.telegram, color: "bg-sky-500/20 text-sky-200" },
    { key: "whatsapp" as const, href: links.whatsapp, label: labels.whatsapp, color: "bg-emerald-500/20 text-emerald-200" },
    { key: "x" as const, href: links.x, label: labels.x, color: "bg-white/10 text-white/80" },
    { key: "facebook" as const, href: links.facebook, label: labels.facebook, color: "bg-blue-500/20 text-blue-200" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-white/50">{labels.share}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
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
