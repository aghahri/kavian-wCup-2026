import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCachedMyLeagues } from "@/lib/home-sections";
import type { Locale } from "@/i18n/routing";

type HomeMyLeaguesProps = { locale: Locale; userId: string };

export async function HomeMyLeagues({ locale, userId }: HomeMyLeaguesProps) {
  const t = await getTranslations("home");
  const leagues = await getCachedMyLeagues(userId);

  if (leagues.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-white/80">{t("myLeagues")}</h2>
      <div className="flex gap-2 overflow-x-auto">
        {leagues.map((l) => (
          <Link
            key={l.code}
            href={`/${locale}/leagues/${l.code}`}
            className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
          >
            {l.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
