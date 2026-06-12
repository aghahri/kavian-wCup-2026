import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function LeaguesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const [myLeagues, publicLeagues] = await Promise.all([
    prisma.privateLeague.findMany({
      where: { members: { some: { userId: user.id } } },
      include: { _count: { select: { members: true } }, owner: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.privateLeague.findMany({
      where: { privacy: "public", isActive: true },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/leagues/create`}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400"
        >
          {t("create")}
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-emerald-300">{t("myLeagues")}</h2>
        {myLeagues.length === 0 ? (
          <EmptyState icon="👨‍👩‍👧‍👦" title={t("noLeagues")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myLeagues.map((league) => (
              <Link
                key={league.id}
                href={`/${locale}/leagues/${league.code}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-500/40"
              >
                <p className="text-xs text-emerald-300">{t(`type_${league.type}`)}</p>
                <h3 className="mt-1 text-lg font-bold text-white">{league.title}</h3>
                <p className="mt-2 text-sm text-white/50">
                  {league._count.members} {t("members")} · {league.owner.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {publicLeagues.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">{t("publicLeagues")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {publicLeagues.map((league) => (
              <Link
                key={league.id}
                href={`/${locale}/leagues/${league.code}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20"
              >
                <h3 className="font-bold text-white">{league.title}</h3>
                <p className="text-sm text-white/50">{league._count.members} {t("members")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
