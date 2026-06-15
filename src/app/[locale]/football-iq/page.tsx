import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { getFootballIqRanks, IQ_CATEGORIES } from "@/lib/football-iq";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

export default async function FootballIqPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("footballIq");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const ranks = await getFootballIqRanks(user.id);
  if (!ranks) redirect(`/${locale}/login`);

  const categoryKey = ranks.category.key;

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} badge="🧠" />

      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-[#071526] p-8 text-center">
        <p className="text-sm text-emerald-200">{t("yourIq")}</p>
        <p className="mt-2 text-6xl font-black text-white">{ranks.footballIq}</p>
        <p className="mt-2 text-lg font-bold text-amber-200">{t(`category_${categoryKey}`)}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-white/50">{t("globalRank")}</p>
            <p className="text-xl font-black text-emerald-300">#{formatNumber(ranks.globalRank, locale)}</p>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-white/50">{t("nationalRank")}</p>
            <p className="text-xl font-black text-emerald-300">
              {ranks.nationalRank ? `#${formatNumber(ranks.nationalRank, locale)}` : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("categories")}</h2>
        <ul className="space-y-2 text-sm">
          {IQ_CATEGORIES.map((cat) => (
            <li
              key={cat.key}
              className={`flex justify-between rounded-lg px-3 py-2 ${
                cat.key === categoryKey ? "bg-emerald-500/20 text-emerald-100" : "text-white/70"
              }`}
            >
              <span>{t(`category_${cat.key}`)}</span>
              <span>{cat.min}–{cat.max === 200 ? "200+" : cat.max}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href={`/${locale}/predict`} className="block text-center text-emerald-300 hover:underline">
        {t("improve")} →
      </Link>
    </div>
  );
}
