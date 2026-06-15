import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { TeamFlag } from "@/components/TeamFlag";
import { buildCrowdData, crowdTeamLabels } from "@/lib/crowd-predictions";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function CrowdPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("crowd");

  const { upcoming, surprises } = await buildCrowdData(locale);

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">{t("upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-white/50">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            {upcoming.map((row) => {
              const teams = crowdTeamLabels(row.match, locale);
              return (
                <article key={row.match.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-center gap-3">
                    <TeamFlag teamName={row.match.homeTeam} size={28} />
                    <span className="font-bold text-white">
                      {teams.home} vs {teams.away}
                    </span>
                    <TeamFlag teamName={row.match.awayTeam} size={28} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-emerald-500/20 p-2">
                      <p className="font-black text-emerald-200">{row.homePct}%</p>
                      <p className="text-white/50">{teams.home}</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2">
                      <p className="font-black text-white">{row.drawPct}%</p>
                      <p className="text-white/50">{t("draw")}</p>
                    </div>
                    <div className="rounded-lg bg-sky-500/20 p-2">
                      <p className="font-black text-sky-200">{row.awayPct}%</p>
                      <p className="text-white/50">{teams.away}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-white/40">
                    {t("basedOn", { count: row.total })}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {surprises.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-amber-300">{t("surprises")}</h2>
          <div className="space-y-3">
            {surprises.map((row) => (
              <Link
                key={row.match.id}
                href={`/${locale}/matches/${row.match.id}/summary`}
                className="block rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"
              >
                <p className="font-bold text-white">
                  {getHomeTeamName(row.match, locale)} {row.match.homeScore}-{row.match.awayScore}{" "}
                  {getAwayTeamName(row.match, locale)}
                </p>
                <p className="mt-1 text-sm text-amber-200">
                  {row.messageKey === "crowdWrong" ? t("crowdWrong") : t("crowdRight", { pct: 100 - row.wrongPct })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
