import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecalculateButton } from "@/components/RecalculateButton";
import { getAdminDashboardStats } from "@/lib/admin-stats";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const [stats, matchCount, predictionCount, userCount, finishedCount] = await Promise.all([
    getAdminDashboardStats(),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.user.count(),
    prisma.match.count({ where: { isFinished: true } }),
  ]);

  const cards = [
    { href: `/${locale}/admin/matches`, title: t("matches"), desc: t("matchesDesc") },
    { href: `/${locale}/admin/predictions`, title: t("predictions"), desc: t("predictionsDesc") },
    { href: `/${locale}/admin/languages`, title: t("languages"), desc: t("languagesDesc") },
    { href: `/${locale}/admin/monetization`, title: t("monetization"), desc: t("monetizationDesc") },
    { href: `/${locale}/admin/tournaments`, title: t("tournaments"), desc: t("tournamentsDesc") },
    { href: `/${locale}/admin/otp`, title: t("otp"), desc: t("otpDesc") },
    { href: `/${locale}/admin/referrals`, title: t("referrals"), desc: t("referralsDesc") },
  ];

  const v2Stats = [
    { label: t("statUsersToday"), value: stats.usersToday },
    { label: t("statUsers7d"), value: stats.users7d },
    { label: t("statOtpToday"), value: stats.otpRequestsToday },
    { label: t("statOtpSuccess"), value: `${stats.otpSuccessRate}%` },
    { label: t("statActiveTournaments"), value: stats.activeTournaments },
    { label: t("statPredictionsToday"), value: stats.predictionsToday },
    { label: t("statReferralRegs"), value: stats.referralRegistrations },
    { label: t("statMatches"), value: matchCount },
    { label: t("statFinished"), value: finishedCount },
    { label: t("statPredictions"), value: predictionCount },
    { label: t("statUsers"), value: userCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {v2Stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <p className="text-2xl font-black text-emerald-300">
              {typeof item.value === "number" ? formatNumber(item.value, locale) : item.value}
            </p>
            <p className="mt-1 text-sm text-white/70">{item.label}</p>
          </div>
        ))}
      </div>

      {stats.topInviters.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">{t("topInviters")}</h2>
          <ul className="mt-3 space-y-2">
            {stats.topInviters.map((inviter, i) => (
              <li key={inviter.id} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  {formatNumber(i + 1, locale)}. {inviter.name}
                </span>
                <span className="text-emerald-300">
                  {formatNumber(inviter._count.referrals, locale)} {t("referralsCount")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 transition hover:bg-emerald-500/20"
          >
            <h2 className="text-lg font-bold text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-white/70">{card.desc}</p>
          </Link>
        ))}
      </div>

      <RecalculateButton />
    </div>
  );
}
