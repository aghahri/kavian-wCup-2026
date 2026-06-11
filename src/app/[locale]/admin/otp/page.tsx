import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminOtpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const challenges = await prisma.otpChallenge.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("otp")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("otpDesc")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 border-b border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white/60 md:grid">
          <span>{t("otpPhone")}</span>
          <span>{t("otpCreated")}</span>
          <span>{t("otpExpires")}</span>
          <span>{t("otpProviderStatus")}</span>
          <span>{t("otpServerId")}</span>
          <span>{t("otpAttempts")}</span>
        </div>

        {challenges.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/60">{t("otpEmpty")}</p>
        ) : (
          <ul>
            {challenges.map((challenge) => (
              <li
                key={challenge.id}
                className="grid grid-cols-1 gap-2 border-b border-white/5 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-start md:gap-3"
              >
                <div>
                  <p className="font-medium text-white" dir="ltr">
                    {challenge.phone}
                  </p>
                  {challenge.usedAt && (
                    <p className="mt-1 text-xs text-white/40">
                      used: {formatDate(challenge.usedAt, locale)}
                    </p>
                  )}
                </div>
                <span className="text-white/70 md:text-xs">
                  {formatDate(challenge.createdAt, locale)}
                </span>
                <span className="text-white/70 md:text-xs">
                  {formatDate(challenge.expiresAt, locale)}
                </span>
                <span className="break-all font-mono text-xs text-amber-200">
                  {challenge.providerStatus ?? "—"}
                </span>
                <span className="font-mono text-xs text-emerald-200" dir="ltr">
                  {challenge.serverId ?? "—"}
                </span>
                <span className="text-white/80">
                  {formatNumber(challenge.attempts, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
