import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminResultsPanel } from "@/components/AdminResultsPanel";
import { getAdminResultsData } from "@/lib/admin-results";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ matchId?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminResultsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { matchId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const data = await getAdminResultsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{t("resultsTitle")}</h1>
          <p className="mt-1 text-sm text-white/60">{t("resultsSubtitle")}</p>
        </div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          {t("back")}
        </Link>
      </div>

      <AdminResultsPanel
        initialRows={data.matches}
        highlightMatchId={matchId ?? null}
        labels={{
          pasteTitle: t("resultsPasteTitle"),
          pastePlaceholder: t("resultsPastePlaceholder"),
          pasteApply: t("resultsPasteApply"),
          save: t("resultsSave"),
          verify: t("resultsVerify"),
          refreshAi: t("resultsRefreshAi"),
          saved: t("resultsSaved"),
          statusUpcoming: t("resultsStatusUpcoming"),
          statusLive: t("resultsStatusLive"),
          statusFinished: t("resultsStatusFinished"),
          missingScoreWarning: t("resultsMissingScoreWarning"),
          sourceName: t("resultsSourceName"),
          sourceUrl: t("resultsSourceUrl"),
          highlightsUrl: t("resultsHighlightsUrl"),
          embedUrl: t("resultsEmbedUrl"),
          homeScore: t("resultsHomeScore"),
          awayScore: t("resultsAwayScore"),
          kickedOff: t("resultsKickedOff"),
          missingScore: t("resultsMissingScore"),
          missingVerification: t("resultsMissingVerification"),
          missingHighlights: t("resultsMissingHighlights"),
          staleAi: t("resultsStaleAi"),
        }}
      />
    </div>
  );
}
