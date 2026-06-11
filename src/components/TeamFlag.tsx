import { getTeamFlagUrl, getTeamIsoCode } from "@/lib/teams";

type TeamFlagProps = {
  teamName: string;
  size?: number;
  className?: string;
};

export function TeamFlag({ teamName, size = 32, className = "" }: TeamFlagProps) {
  const flagUrl = getTeamFlagUrl(teamName, size * 2);
  const iso = getTeamIsoCode(teamName);

  if (!flagUrl || !iso) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-white/10 text-lg ${className}`}
        style={{ width: size, height: Math.round(size * 0.75) }}
        aria-hidden
      >
        ⚽
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className={`inline-block rounded-sm object-cover shadow-md ring-1 ring-white/20 ${className}`}
      loading="lazy"
    />
  );
}
