import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeagueInviteScreen } from "@/components/LeagueInviteScreen";
import { getLeagueInviteStats } from "@/lib/league-invite-stats";
import { getLeagueByCode, getLeagueInviteUrl } from "@/lib/private-leagues";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale; code: string }>;
  searchParams: Promise<{ created?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeagueInvitePage({ params, searchParams }: PageProps) {
  const { locale, code } = await params;
  const { created } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");
  const ts = await getTranslations("share");

  const league = await getLeagueByCode(code);
  if (!league) notFound();

  const inviteUrl = getLeagueInviteUrl(league.code);
  const stats = await getLeagueInviteStats(league.id);

  return (
    <LeagueInviteScreen
      locale={locale}
      leagueTitle={league.title}
      leagueCode={league.code}
      inviteUrl={inviteUrl}
      stats={stats}
      created={created === "1"}
      shareText={t("shareLeague", { title: league.title })}
      labels={{
        title: created === "1" ? t("inviteCreatedTitle") : t("inviteTitle"),
        subtitle: t("inviteDesc"),
        reward: t("inviteReward"),
        copyLink: t("copyLink"),
        copied: t("copied"),
        inviteCode: t("inviteCode"),
        statsClicks: t("inviteClicks"),
        statsJoins: t("inviteJoins"),
        statsMembers: t("members"),
        goToLeague: t("goToLeague"),
        share: {
          share: ts("title"),
          telegram: ts("telegram"),
          whatsapp: ts("whatsapp"),
          x: ts("x"),
          facebook: ts("facebook"),
        },
      }}
    />
  );
}
