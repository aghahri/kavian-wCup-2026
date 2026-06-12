import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeaguesTabs, type LeagueRow } from "@/components/LeaguesTabs";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toRow(
  league: {
    id: string;
    code: string;
    title: string;
    type: string;
    isFeatured: boolean;
    _count: { members: number };
    owner?: { name: string };
  },
  joinedIds: Set<string>,
  typeLabel: string
): LeagueRow {
  return {
    id: league.id,
    code: league.code,
    title: league.title,
    type: league.type,
    typeLabel,
    memberCount: league._count.members,
    creatorName: league.owner?.name,
    isJoined: joinedIds.has(league.id),
    isFeatured: league.isFeatured,
  };
}

export default async function LeaguesPage({ params }: PageProps) {
  noStore();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");
  const user = await getCurrentUser();

  const joinedIds = new Set<string>();
  if (user) {
    const memberships = await prisma.privateLeagueMember.findMany({
      where: { userId: user.id },
      select: { leagueId: true },
    });
    memberships.forEach((m) => joinedIds.add(m.leagueId));
  }

  const leagueInclude = {
    _count: { select: { members: true } },
    owner: { select: { name: true } },
  } as const;

  const [myLeagues, publicLeagues, schoolLeagues, companyLeagues, featuredSchool] =
    await Promise.all([
      user
        ? prisma.privateLeague.findMany({
            where: { isActive: true, members: { some: { userId: user.id } } },
            include: leagueInclude,
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.privateLeague.findMany({
        where: { privacy: "public", isActive: true },
        include: leagueInclude,
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.privateLeague.findMany({
        where: { type: "school", isActive: true },
        include: leagueInclude,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 24,
      }),
      prisma.privateLeague.findMany({
        where: { type: "company", isActive: true },
        include: leagueInclude,
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.privateLeague.findMany({
        where: { type: "school", isActive: true, isFeatured: true },
        include: leagueInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const label = (type: string) => t(`type_${type}` as "type_family");

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Link
            href={user ? `/${locale}/leagues/create` : `/${locale}/login`}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400"
          >
            {t("create")}
          </Link>
        }
      />

      {featuredSchool.length > 0 && (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <h2 className="mb-4 text-lg font-bold text-amber-200">{t("featuredSchool")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredSchool.map((league) => (
              <Link
                key={league.id}
                href={`/${locale}/leagues/${league.code}`}
                className="rounded-xl border border-amber-400/30 bg-black/20 p-4 hover:border-amber-400/50"
              >
                <p className="font-bold text-white">{league.title}</p>
                <p className="mt-1 text-sm text-white/50">
                  {league._count.members} {t("members")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <LeaguesTabs
        locale={locale}
        isLoggedIn={Boolean(user)}
        myLeagues={myLeagues.map((l) => toRow(l, joinedIds, label(l.type)))}
        publicLeagues={publicLeagues.map((l) => toRow(l, joinedIds, label(l.type)))}
        schoolLeagues={schoolLeagues.map((l) => toRow(l, joinedIds, label(l.type)))}
        companyLeagues={companyLeagues.map((l) => toRow(l, joinedIds, label(l.type)))}
        labels={{
          tabMy: t("myLeagues"),
          tabPublic: t("publicLeagues"),
          tabSchool: t("tabSchool"),
          tabCompany: t("tabCompany"),
          emptyMy: t("emptyMy"),
          emptyPublic: t("noLeagues"),
          emptySchool: t("emptySchool"),
          emptyCompany: t("emptyCompany"),
          members: t("members"),
          by: t("by"),
          joined: t("joined"),
          join: t("join"),
          invite: t("invite"),
          featured: t("featured"),
          loginCta: t("loginCta"),
        }}
      />
    </div>
  );
}
