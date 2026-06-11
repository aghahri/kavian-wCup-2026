import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecalculateButton } from "@/components/RecalculateButton";
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

  const [matchCount, predictionCount, userCount, finishedCount] = await Promise.all([
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-white/70">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("statMatches"), value: matchCount },
          { label: t("statFinished"), value: finishedCount },
          { label: t("statPredictions"), value: predictionCount },
          { label: t("statUsers"), value: userCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <p className="text-2xl font-black text-emerald-300">
              {formatNumber(item.value, locale)}
            </p>
            <p className="mt-1 text-sm text-white/70">{item.label}</p>
          </div>
        ))}
      </div>

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
