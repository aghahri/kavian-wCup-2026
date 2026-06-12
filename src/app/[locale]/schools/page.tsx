import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function SchoolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("schools");

  const leagues = await prisma.privateLeague.findMany({
    where: { type: "school", isActive: true },
    include: { _count: { select: { members: true } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 24,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/leagues/create?type=school`}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400"
        >
          {t("create")}
        </Link>
      </div>

      {leagues.length === 0 ? (
        <EmptyState icon="🏫" title={t("empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/${locale}/leagues/${league.code}`}
              className={`rounded-2xl border p-5 transition hover:border-emerald-500/40 ${
                league.isFeatured
                  ? "border-amber-400/40 bg-amber-400/5"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {league.isFeatured && (
                <span className="text-xs font-bold text-amber-300">{t("featured")}</span>
              )}
              <h3 className="mt-1 font-bold text-white">{league.title}</h3>
              {league.schoolName && (
                <p className="text-sm text-white/60">{league.schoolName}</p>
              )}
              {league.schoolGrade && (
                <p className="text-xs text-white/40">{league.schoolGrade}</p>
              )}
              <p className="mt-2 text-xs text-emerald-300">
                {league._count.members} {t("students")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
