import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import { getSystemHealthReport } from "@/lib/system-health";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

const SECTIONS = [
  "needsResult",
  "needsAi",
  "needsVerification",
  "needsHighlights",
  "stalePages",
] as const;

export default async function SystemHealthPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const report = await getSystemHealthReport(locale);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-black text-white">{t("systemHealthTitle")}</h1>
        <p className="mt-1 text-sm text-white/70">{t("systemHealthSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(report.counts).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xl font-black text-emerald-300">{formatNumber(value, locale)}</p>
            <p className="mt-1 text-xs text-white/60">{t(`health_${key}`)}</p>
          </div>
        ))}
      </div>

      {SECTIONS.map((section) => {
        const items = report[section];
        return (
          <section key={section} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-bold text-white">
              {t(`healthSection_${section}`)} ({formatNumber(items.length, locale)})
            </h2>
            {items.length === 0 ? (
              <p className="mt-2 text-xs text-white/50">{t("healthAllClear")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={m.editorHref}
                      className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm hover:bg-black/30"
                    >
                      <span className="text-white">
                        {m.homeLabel} vs {m.awayLabel}
                      </span>
                      <span className="text-xs text-white/50">{formatDate(m.kickoffAt, locale)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {report.orphans.length > 0 && (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h2 className="text-sm font-bold text-red-200">
            {t("healthSection_orphans")} ({formatNumber(report.orphans.length, locale)})
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-red-100/80">
            {report.orphans.map((o) => (
              <li key={`${o.type}-${o.id}`}>
                {o.type}: {o.id} — {o.detail}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
