import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinLeagueButton } from "@/components/JoinLeagueButton";
import { LeagueLeaderboard } from "@/components/LeagueLeaderboard";
import { RecordActivity } from "@/components/RecordActivity";
import { ShareButtons } from "@/components/ShareButtons";
import { getCurrentUser } from "@/lib/auth";
import { getLeagueTrashTalk } from "@/lib/league-trash-talk";
import {
  buildLeagueLeaderboard,
  getLeagueByCode,
  getLeagueInviteUrl,
  isLeagueMember,
} from "@/lib/private-leagues";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: Locale; code: string }> };

export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({ params }: PageProps) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leagues");
  const ts = await getTranslations("share");

  const league = await getLeagueByCode(code);
  if (!league || !league.isActive) notFound();

  const user = await getCurrentUser();
  const member = user ? await isLeagueMember(league.id, user.id) : false;
  const isOwner = user?.id === league.ownerId;
  const leaderboard = await buildLeagueLeaderboard(league.id);
  const trashTalk = await getLeagueTrashTalk(league.id, locale);
  const inviteUrl = getLeagueInviteUrl(league.code);

  return (
    <div className="space-y-8">
      <RecordActivity type="league_visit" />
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-[#0b1f3a] to-[#071526] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          {t(`type_${league.type}`)} · {t(`privacy_${league.privacy}`)}
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">{league.title}</h1>
        {league.description && (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">{league.description}</p>
        )}
        {league.schoolName && (
          <p className="mt-2 text-sm text-white/60">
            {league.schoolName}
            {league.schoolGrade ? ` · ${league.schoolGrade}` : ""}
          </p>
        )}
        <p className="mt-4 text-sm text-white/50">
          {league._count.members} {t("members")} · {t("by")} {league.owner.name}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <JoinLeagueButton
            code={league.code}
            isMember={member}
            isLoggedIn={Boolean(user)}
            loginHref={`/${locale}/login`}
            joinLabel={t("join")}
            joinedLabel={t("joined")}
            loginLabel={t("loginToJoin")}
          />
          <Link
            href={`/${locale}/leagues/${league.code}/invite`}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            {t("invite")}
          </Link>
        </div>
      </div>

      <ShareButtons
        text={t("shareLeague", { title: league.title })}
        url={inviteUrl}
        labels={{
          share: ts("title"),
          telegram: ts("telegram"),
          whatsapp: ts("whatsapp"),
          x: ts("x"),
          facebook: ts("facebook"),
        }}
      />

      {trashTalk.length > 0 && (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <h2 className="mb-3 text-lg font-bold text-amber-200">{t("trashTalk")}</h2>
          <ul className="space-y-2">
            {trashTalk.map((line, i) => (
              <li key={i} className="text-sm text-amber-100">
                {line.emoji} {line.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t("leaderboard")}</h2>
        <LeagueLeaderboard
          rows={leaderboard}
          locale={locale}
          pointsLabel={t("points")}
          emptyLabel={t("noPredictions")}
        />
      </section>

      {isOwner && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">{t("members")}</h2>
          <ul className="space-y-2">
            {league.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-2 text-sm"
              >
                <span className="text-white">{m.user.name}</span>
                <span className="text-white/40">{m.role}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
