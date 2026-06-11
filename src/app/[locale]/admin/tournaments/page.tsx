import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminTournamentManager } from "@/components/AdminTournamentManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminTournamentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true, prizes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("tournaments")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("tournamentsDesc")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <AdminTournamentManager initialTournaments={tournaments} />
    </div>
  );
}
