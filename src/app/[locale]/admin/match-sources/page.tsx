import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminMatchSourcesPanel } from "@/components/AdminMatchSourcesPanel";
import { getMatchSourceOps } from "@/lib/admin-match-sources";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function AdminMatchSourcesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const ops = await getMatchSourceOps();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("matchSourcesTitle")}</h1>
          <p className="mt-1 text-sm text-white/60">{t("matchSourcesSubtitle")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <AdminMatchSourcesPanel
        locale={locale}
        {...ops}
        labels={{
          edit: t("matchSourcesEdit"),
          verify: t("matchSourcesVerify"),
          refresh: t("matchSourcesRefreshAi"),
        }}
      />
    </div>
  );
}
