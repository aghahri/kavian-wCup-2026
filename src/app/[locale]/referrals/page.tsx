import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReferralBanner } from "@/components/ReferralBanner";
import { UserAvatar } from "@/components/UserAvatar";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { buildReferralLeaderboard, ensureUserReferralCode, getReferralStats, getReferralUrl } from "@/lib/referral";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function ReferralsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("referrals");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const [code, stats, leaderboard] = await Promise.all([
    ensureUserReferralCode(user.id),
    getReferralStats(user.id),
    buildReferralLeaderboard(20),
  ]);

  const referralUrl = getReferralUrl(code);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      <ReferralBanner
        referralUrl={referralUrl}
        title={t("yourLink")}
        description={t("yourLinkDesc")}
        copyLabel={t("copy")}
        copiedLabel={t("copied")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("clicks"), value: stats.clicks },
          { label: t("registrations"), value: stats.registrations },
          { label: t("verified"), value: stats.verified },
          { label: t("inviteScore"), value: stats.inviteScore },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">
              {formatNumber(item.value, locale)}
            </p>
            <p className="mt-1 text-sm text-white/60">{item.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white">{t("leaderboard")}</h2>
        <ol className="space-y-2">
          {leaderboard.map((row) => (
            <li
              key={row.userId}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="w-8 text-center font-black text-emerald-300">{row.rank}</span>
              <UserAvatar user={{ id: row.userId, name: row.name, avatarUrl: row.avatarUrl }} size={32} />
              <span className="flex-1 font-bold text-white">{row.name}</span>
              <span className="text-emerald-300">{formatNumber(row.inviteScore, locale)}</span>
            </li>
          ))}
        </ol>
      </section>

      <Link href={`/${locale}/profile`} className="text-sm text-emerald-300 hover:underline">
        ← {t("backProfile")}
      </Link>
    </div>
  );
}
