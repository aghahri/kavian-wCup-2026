import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminMatchManager } from "@/components/AdminMatchManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminMatchesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: {
      _count: { select: { predictions: true } },
      events: {
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          minute: true,
          type: true,
          teamName: true,
          playerName: true,
          descriptionFa: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("matches")}</h1>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <AdminMatchManager initialMatches={matches} />
    </div>
  );
}
