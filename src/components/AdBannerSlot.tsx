import Link from "next/link";
import type { AdBanner } from "@prisma/client";

type AdBannerSlotProps = {
  ads: AdBanner[];
};

export function AdBannerSlot({ ads }: AdBannerSlotProps) {
  if (ads.length === 0) return null;

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <div
          key={ad.id}
          className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-200/80">
            Sponsored
          </p>
          {ad.linkUrl ? (
            <Link
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium text-white hover:underline"
            >
              {ad.title}
            </Link>
          ) : (
            <p className="text-sm font-medium text-white">{ad.title}</p>
          )}
          {ad.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.imageUrl} alt={ad.title} className="mt-3 max-h-24 rounded-lg object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}
