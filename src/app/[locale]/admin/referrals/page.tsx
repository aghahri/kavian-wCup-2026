import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getReferralAnalytics } from "@/lib/admin-stats";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getReferralUrl } from "@/lib/referral";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminReferralsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const analytics = await getReferralAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("referrals")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("referralsDesc")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("referralClicks"), value: analytics.clicks },
          { label: t("referralRegistrations"), value: analytics.registrations },
          { label: t("referralVerified"), value: analytics.verified },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-black text-emerald-300">
              {formatNumber(item.value, locale)}
            </p>
            <p className="mt-1 text-sm text-white/70">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white/60">
          {t("topInviters")}
        </div>
        {analytics.topInviters.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/60">{t("referralEmpty")}</p>
        ) : (
          <ul>
            {analytics.topInviters.map((inviter, i) => (
              <li
                key={inviter.id}
                className="flex flex-col gap-1 border-b border-white/5 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-white">
                  {formatNumber(i + 1, locale)}. {inviter.name}
                </span>
                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                  <span>
                    {formatNumber(inviter._count.referrals, locale)} {t("referralsCount")}
                  </span>
                  {inviter.referralCode && (
                    <span dir="ltr" className="font-mono text-emerald-300">
                      {getReferralUrl(inviter.referralCode)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
