import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TeamFlag } from "@/components/TeamFlag";
import { getOrCreateMatchAnalysis } from "@/lib/match-analysis";
import {
  formatAiPredictionLine,
  getLocalizedReasoning,
  RISK_LABELS,
} from "@/lib/ai/football-analysis";
import { getAwayTeamName, getHomeTeamName } from "@/lib/match-i18n";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; id: string }> };

export const dynamic = "force-dynamic";

export default async function MatchAiPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ai");

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) notFound();

  const analysis = await getOrCreateMatchAnalysis(match);
  const risk = RISK_LABELS[analysis.riskLevel as keyof typeof RISK_LABELS];
  const riskLabel = locale === "fa" ? risk.fa : locale === "ar" ? risk.ar : risk.en;
  const reasoning = getLocalizedReasoning(analysis, locale);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/${locale}/ai`} className="text-sm text-emerald-300 hover:underline">
        ← {t("title")}
      </Link>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center gap-4">
          <TeamFlag teamName={match.homeTeam} size={48} />
          <span className="text-white/40">vs</span>
          <TeamFlag teamName={match.awayTeam} size={48} />
        </div>
        <h1 className="mt-4 text-center text-xl font-black text-white">
          {getHomeTeamName(match, locale)} vs {getAwayTeamName(match, locale)}
        </h1>
        <p className="mt-6 text-center text-lg font-black text-emerald-300">
          {t("prediction")}:{" "}
          {formatAiPredictionLine(
            match,
            locale,
            analysis.suggestedHomeScore,
            analysis.suggestedAwayScore
          )}
        </p>
        <p className="mt-2 text-center text-sm text-white/60">
          {t("risk")}: {riskLabel}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-black text-emerald-300">{analysis.homeWinPct}%</p>
            <p className="text-xs text-white/50">{t("homeWin")}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-black text-emerald-300">{analysis.drawPct}%</p>
            <p className="text-xs text-white/50">{t("draw")}</p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-black text-emerald-300">{analysis.awayWinPct}%</p>
            <p className="text-xs text-white/50">{t("awayWin")}</p>
          </div>
        </div>
        <h2 className="mt-6 text-sm font-bold text-white/80">{t("reasoning")}</h2>
        <ul className="mt-2 space-y-2 text-sm leading-7 text-white/70">
          {reasoning.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
