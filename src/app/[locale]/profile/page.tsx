import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeList } from "@/components/BadgeList";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ReferralBanner } from "@/components/ReferralBanner";
import { ShareButtons } from "@/components/ShareButtons";
import { UserAvatar } from "@/components/UserAvatar";
import { syncUserBadges } from "@/lib/badges";
import { formatDate, formatNumber } from "@/lib/format";
import { getUserRank } from "@/lib/leaderboard";
import { getTournamentName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ensureUserReferralCode, getReferralUrl } from "@/lib/referral";
import { getSiteUrl } from "@/lib/share";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");
  const tb = await getTranslations("badges");
  const ts = await getTranslations("share");

  const session = await getCurrentUser();
  if (!session) redirect(`/${locale}/login`);

  const [user, rank, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      include: {
        tournamentMemberships: { include: { tournament: true } },
        _count: { select: { referrals: true, predictions: true } },
        predictions: { select: { points: true } },
      },
    }),
    getUserRank(session.id, "global"),
    syncUserBadges(session.id),
  ]);

  if (!user) redirect(`/${locale}/login`);

  const referralCode = await ensureUserReferralCode(user.id);
  const referralUrl = getReferralUrl(referralCode);
  const totalPoints = user.predictions.reduce((s, p) => s + p.points, 0);
  const profileUrl = `${getSiteUrl()}/${locale}/profile`;

  const badgeLabels = {
    early_supporter: tb("earlySupporter"),
    top_predictor: tb("topPredictor"),
    referral_champion: tb("referralChampion"),
    world_cup_expert: tb("worldCupExpert"),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size={80} />
          <div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <p className="mt-1 text-sm text-white/60">
              {t("joined", { date: formatDate(user.createdAt, locale) })}
            </p>
            <div className="mt-2">
              <BadgeList badges={badges} labels={badgeLabels} />
            </div>
          </div>
        </div>
        <Link
          href={`/${locale}/predict`}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-center text-sm font-bold text-white hover:bg-emerald-400"
        >
          {t("predictNow")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("totalPoints"), value: totalPoints },
          { label: t("rank"), value: rank ?? "—" },
          { label: t("referrals"), value: user._count.referrals },
          { label: t("predictions"), value: user._count.predictions },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">
              {typeof stat.value === "number" ? formatNumber(stat.value, locale) : stat.value}
            </p>
            <p className="mt-1 text-sm text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-bold text-white">{t("tournaments")}</h2>
        {user.tournamentMemberships.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">{t("noTournaments")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.tournamentMemberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-white">{getTournamentName(m.tournament, locale)}</span>
                <span className="text-white/50">{formatDate(m.joinedAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/${locale}/tournaments`} className="mt-3 inline-block text-sm text-emerald-300 hover:underline">
          {t("browseTournaments")}
        </Link>
      </section>

      <ReferralBanner
        referralUrl={referralUrl}
        title={t("referralTitle")}
        description={t("referralDesc")}
        copyLabel={t("copyLink")}
        copiedLabel={t("copied")}
      />

      <ShareButtons
        text={t("shareProfileText", { name: user.name })}
        url={profileUrl}
        labels={{
          share: ts("title"),
          telegram: ts("telegram"),
          whatsapp: ts("whatsapp"),
          x: ts("x"),
          facebook: ts("facebook"),
        }}
      />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("editProfile")}</h2>
        <ProfileEditor
          user={user}
          labels={{
            name: t("name"),
            avatar: t("avatar"),
            save: t("save"),
            saving: t("saving"),
            success: t("saveSuccess"),
            error: t("saveError"),
          }}
        />
      </section>
    </div>
  );
}
