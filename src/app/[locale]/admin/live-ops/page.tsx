import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatNumber } from "@/lib/format";
import { getLiveOpsBuckets } from "@/lib/live-ops";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

const BUCKETS = [
  { key: "upcoming" as const, emoji: "🟢", color: "border-emerald-500/30 bg-emerald-500/10" },
  { key: "needsResult" as const, emoji: "🟡", color: "border-amber-500/30 bg-amber-500/10" },
  { key: "needsHighlights" as const, emoji: "🟠", color: "border-orange-500/30 bg-orange-500/10" },
  { key: "needsAiRefresh" as const, emoji: "🔵", color: "border-sky-500/30 bg-sky-500/10" },
  { key: "needsVerification" as const, emoji: "🟣", color: "border-violet-500/30 bg-violet-500/10" },
];

export default async function LiveOpsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  if (!user.isAdmin) redirect(`/${locale}`);

  const buckets = await getLiveOpsBuckets(locale);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/admin`} className="text-sm text-emerald-300 hover:underline">
          ← {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-black text-white">{t("liveOpsTitle")}</h1>
        <p className="mt-1 text-sm text-white/70">{t("liveOpsSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUCKETS.map(({ key, emoji, color }) => {
          const items = buckets[key];
          return (
            <section key={key} className={`rounded-2xl border p-4 ${color}`}>
              <h2 className="text-sm font-bold text-white">
                {emoji} {t(`liveOps_${key}`)} ({formatNumber(items.length, locale)})
              </h2>
              {items.length === 0 ? (
                <p className="mt-3 text-xs text-white/50">{t("liveOpsEmpty")}</p>
              ) : (
                <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                  {items.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={m.editorHref}
                        className="block rounded-lg bg-black/20 px-3 py-2 text-sm text-white hover:bg-black/30"
                      >
                        <span className="font-medium">
                          {m.homeLabel} vs {m.awayLabel}
                        </span>
                        <span className="mt-0.5 block text-xs text-white/50">
                          {formatDate(m.kickoffAt, locale)}
                          {m.homeScore !== null && m.awayScore !== null && (
                            <> · {m.homeScore}-{m.awayScore}</>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
