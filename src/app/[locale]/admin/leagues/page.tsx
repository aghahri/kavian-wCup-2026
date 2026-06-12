import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminLeagueToggle } from "@/components/AdminLeagueToggle";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const leagues = await prisma.privateLeague.findMany({
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true, inviteClicks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const predictionCounts = await Promise.all(
    leagues.map(async (league) => {
      const memberIds = (
        await prisma.privateLeagueMember.findMany({
          where: { leagueId: league.id },
          select: { userId: true },
        })
      ).map((m) => m.userId);
      if (memberIds.length === 0) return 0;
      return prisma.prediction.count({ where: { userId: { in: memberIds } } });
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">{t("leagues")}</h1>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>
      <div className="space-y-3">
        {leagues.map((league, i) => (
          <article
            key={league.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{league.title}</h3>
                <p className="text-sm text-white/50">
                  {league.type} · {league.owner.name} · {formatDate(league.createdAt, locale)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {league._count.members} members · {predictionCounts[i]} predictions ·{" "}
                  {league._count.inviteClicks} clicks
                </p>
              </div>
              <AdminLeagueToggle
                leagueId={league.id}
                isActive={league.isActive}
                isFeatured={league.isFeatured}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
