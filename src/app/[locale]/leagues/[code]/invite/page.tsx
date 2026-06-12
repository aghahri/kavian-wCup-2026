import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyInviteLink } from "@/components/CopyInviteLink";
import { getLeagueByCode, getLeagueInviteUrl } from "@/lib/private-leagues";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; code: string }> };

export default async function LeagueInvitePage({ params }: PageProps) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");

  const league = await getLeagueByCode(code);
  if (!league) notFound();

  const inviteUrl = getLeagueInviteUrl(league.code);

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <Link href={`/${locale}/leagues/${code}`} className="text-sm text-emerald-300 hover:underline">
        ← {league.title}
      </Link>
      <h1 className="text-2xl font-black text-white">{t("inviteTitle")}</h1>
      <p className="text-sm text-white/70">{t("inviteDesc")}</p>
      <CopyInviteLink url={inviteUrl} copyLabel={t("copyLink")} copiedLabel={t("copied")} />
      <p className="text-xs text-white/40">{t("inviteCode")}: {league.code}</p>
    </div>
  );
}
