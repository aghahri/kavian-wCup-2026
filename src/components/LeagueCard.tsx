import Link from "next/link";
import { getLeagueInviteUrl } from "@/lib/private-leagues";
import type { Locale } from "@/i18n/routing";

type LeagueCardProps = {
  locale: Locale;
  code: string;
  title: string;
  type: string;
  typeLabel: string;
  memberCount: number;
  creatorName?: string;
  isJoined: boolean;
  labels: {
    members: string;
    by: string;
    joined: string;
    join: string;
    invite: string;
    featured?: string;
  };
  featured?: boolean;
  showInvite?: boolean;
};

export function LeagueCard({
  locale,
  code,
  title,
  typeLabel,
  memberCount,
  creatorName,
  isJoined,
  labels,
  featured,
  showInvite,
}: LeagueCardProps) {
  const inviteUrl = getLeagueInviteUrl(code);

  return (
    <article
      className={`rounded-2xl border p-5 transition hover:border-emerald-500/40 ${
        featured ? "border-amber-400/30 bg-amber-400/5" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {featured && labels.featured && (
            <span className="text-xs font-bold text-amber-300">{labels.featured}</span>
          )}
          <p className="text-xs text-emerald-300">{typeLabel}</p>
          <Link href={`/${locale}/leagues/${code}`}>
            <h3 className="mt-1 text-lg font-bold text-white hover:text-emerald-200">{title}</h3>
          </Link>
          <p className="mt-2 text-sm text-white/50">
            {memberCount} {labels.members}
            {creatorName ? ` · ${labels.by} ${creatorName}` : ""}
          </p>
        </div>
        {isJoined && (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-200">
            {labels.joined}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/leagues/${code}`}
          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30"
        >
          {isJoined ? labels.joined : labels.join}
        </Link>
        {showInvite && (
          <Link
            href={`/${locale}/leagues/${code}/invite`}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            {labels.invite}
          </Link>
        )}
        {showInvite && (
          <span className="hidden text-xs text-white/30 sm:inline" dir="ltr">
            {inviteUrl}
          </span>
        )}
      </div>
    </article>
  );
}
