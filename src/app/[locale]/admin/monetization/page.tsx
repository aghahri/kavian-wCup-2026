import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminMonetizationManager } from "@/components/AdminMonetizationManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminMonetizationPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const [ads, prizes, paymentSettings, tournaments] = await Promise.all([
    prisma.adBanner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] }),
    prisma.prize.findMany({ orderBy: { rankFrom: "asc" } }),
    prisma.paymentSettings.findUnique({ where: { id: "default" } }),
    prisma.tournament.findMany({ select: { id: true, nameEn: true, slug: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("monetization")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("monetizationDesc")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <AdminMonetizationManager
        initialAds={ads}
        initialPrizes={prizes}
        initialSettings={
          paymentSettings ?? {
            id: "default",
            paymentsEnabled: false,
            vipPaymentsEnabled: false,
            providerName: "placeholder",
            currency: "IRR",
            vipPriceLabel: "VIP League Pass",
            notes: null,
            updatedAt: new Date(),
          }
        }
        tournaments={tournaments}
      />
    </div>
  );
}
