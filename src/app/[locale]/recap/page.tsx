import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { RecordActivity } from "@/components/RecordActivity";
import { ShareButtons } from "@/components/ShareButtons";
import { getOrGenerateDailyRecap } from "@/lib/daily-recap";
import { getSiteUrl } from "@/lib/share";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function RecapPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recap");
  const ts = await getTranslations("share");

  const recap = await getOrGenerateDailyRecap(locale);
  const shareUrl = `${getSiteUrl()}/${locale}/recap`;

  return (
    <div className="space-y-8">
      <RecordActivity type="recap_view" />
      <PageHeader title={t("title")} subtitle={t("subtitle")} badge={t("badge")} />

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-bold text-amber-300">{t("surprises")}</h2>
        {recap.surprises.length === 0 ? (
          <p className="text-sm text-white/50">{t("noSurprises")}</p>
        ) : (
          <ul className="space-y-2 text-sm text-white/80">
            {recap.surprises.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-black/25 p-4">
            <p className="text-xs text-white/50">{t("topPredictor")}</p>
            <p className="mt-1 font-bold text-emerald-300">{recap.topPredictor ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <p className="text-xs text-white/50">{t("hardestMatch")}</p>
            <p className="mt-1 font-bold text-white">{recap.hardestMatch ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <p className="text-xs text-white/50">{t("bestLeague")}</p>
            <p className="mt-1 font-bold text-white">{recap.bestLeague ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <p className="text-xs text-white/50">{t("funFact")}</p>
            <p className="mt-1 text-sm text-amber-100">{recap.funFact}</p>
          </div>
        </div>
      </section>

      <ShareButtons
        text={t("shareText")}
        url={shareUrl}
        labels={{
          share: ts("title"),
          telegram: ts("telegram"),
          whatsapp: ts("whatsapp"),
          x: ts("x"),
          facebook: ts("facebook"),
        }}
        analyticsSource="daily_recap"
      />

      <Link href={`/${locale}/predict`} className="block text-center text-emerald-300 hover:underline">
        {t("predictNow")} →
      </Link>
    </div>
  );
}
