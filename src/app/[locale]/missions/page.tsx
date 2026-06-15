import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { getMissionProgress, type MissionKey } from "@/lib/missions";
import { levelTitle, xpToNextLevel } from "@/lib/xp-levels";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale }> };

export const dynamic = "force-dynamic";

const MISSION_LINKS: Record<MissionKey, string> = {
  predict_3: "predict",
  invite_friend: "referrals",
  visit_ai: "ai",
  join_league: "leagues",
  share_result: "recap",
};

export default async function MissionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("missions");

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const missions = await getMissionProgress(user.id);
  const xpInfo = xpToNextLevel(user.xp);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        badge={`${levelTitle(user.userLevel, locale)} · Lv${user.userLevel}`}
      />

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-white/70">{t("xp")}</span>
          <span className="font-bold text-emerald-300">{formatNumber(user.xp, locale)} XP</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${xpInfo.progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {missions.map((m) => (
          <li
            key={m.key}
            className={`flex items-center justify-between rounded-2xl border p-4 ${
              m.completed
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div>
              <p className="font-semibold text-white">{t(`mission_${m.key}`)}</p>
              <p className="text-xs text-emerald-300">+{m.xp} XP</p>
            </div>
            {m.completed ? (
              <span className="text-emerald-300">✓</span>
            ) : (
              <Link
                href={`/${locale}/${MISSION_LINKS[m.key]}`}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                {t("go")}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
