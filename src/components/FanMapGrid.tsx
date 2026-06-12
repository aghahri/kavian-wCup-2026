import Image from "next/image";
import { buildFlagcdnUrl } from "@/lib/teams";
import type { FanCountryStat } from "@/lib/fan-map";
import { getTopFavoriteTeam } from "@/lib/fan-map";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type FanMapGridProps = {
  stats: FanCountryStat[];
  locale: Locale;
  fanLabel: string;
  favoriteLabel: string;
  emptyLabel: string;
};

function countryName(stat: FanCountryStat, locale: Locale): string {
  if (locale === "fa") return stat.nameFa;
  if (locale === "ar") return stat.nameAr;
  return stat.nameEn;
}

export function FanMapGrid({ stats, locale, fanLabel, favoriteLabel, emptyLabel }: FanMapGridProps) {
  if (stats.length === 0) {
    return <p className="text-center text-white/60">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const topTeam = getTopFavoriteTeam(stat);
        return (
          <article
            key={stat.dialCode}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-500/30"
          >
            <div className="flex items-center gap-3">
              <Image
                src={buildFlagcdnUrl(stat.flagCode, 80)}
                alt=""
                width={40}
                height={30}
                className="rounded-sm ring-1 ring-white/20"
              />
              <div>
                <h3 className="font-bold text-white">{countryName(stat, locale)}</h3>
                <p className="text-sm text-emerald-300">
                  {formatNumber(stat.fanCount, locale)} {fanLabel}
                </p>
              </div>
            </div>
            {topTeam && (
              <p className="mt-3 text-xs text-white/50">
                {favoriteLabel}: <span className="text-white/80">{topTeam}</span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
