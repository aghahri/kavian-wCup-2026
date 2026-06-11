import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShareButtons } from "@/components/ShareButtons";
import { TournamentList } from "@/components/TournamentList";
import { getSiteUrl } from "@/lib/share";
import { getCurrentUser } from "@/lib/auth";
import { getPrizeTitle, getTournamentName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import { userHasVipAccess } from "@/lib/vip";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function TournamentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tournaments");
  const ts = await getTranslations("share");
  const user = await getCurrentUser();

  const tournaments = await prisma.tournament.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      prizes: { where: { isActive: true } },
      ...(user ? { memberships: { where: { userId: user.id } } } : {}),
      _count: { select: { memberships: true } },
    },
  });

  const items = tournaments.map((tournament) => ({
    id: tournament.id,
    slug: tournament.slug,
    name: getTournamentName(tournament, locale),
    isVip: tournament.isVip,
    memberCount: tournament._count.memberships,
    joined: "memberships" in tournament && tournament.memberships.length > 0,
    canJoin: !tournament.isVip || userHasVipAccess(user),
    prizes: tournament.prizes.map((p) => ({
      id: p.id,
      title: getPrizeTitle(p, locale),
      sponsorName: p.sponsorName,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <ShareButtons
          text={t("shareText")}
          url={`${getSiteUrl()}/${locale}/tournaments`}
          labels={{
            share: ts("title"),
            telegram: ts("telegram"),
            whatsapp: ts("whatsapp"),
            x: ts("x"),
            facebook: ts("facebook"),
          }}
        />
      </div>

      <TournamentList locale={locale} tournaments={items} isLoggedIn={!!user} />
    </div>
  );
}
