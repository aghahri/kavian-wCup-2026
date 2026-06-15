import Link from "next/link";
import type { GrowthBanner } from "@/lib/growth-loop";

type GrowthLoopBannerProps = {
  banners: GrowthBanner[];
};

const toneClass: Record<GrowthBanner["tone"], string> = {
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-100",
};

export function GrowthLoopBanner({ banners }: GrowthLoopBannerProps) {
  if (banners.length === 0) return null;

  return (
    <div className="space-y-2">
      {banners.map((b) => (
        <Link
          key={b.id}
          href={b.href}
          className={`block rounded-xl border px-4 py-3 text-sm font-semibold transition hover:opacity-90 ${toneClass[b.tone]}`}
        >
          {b.message} →
        </Link>
      ))}
    </div>
  );
}
