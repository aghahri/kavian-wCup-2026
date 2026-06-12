export type TeamMetadata = {
  teamCode: string;
  fifaCode: string;
  countryName: string;
  nameFa?: string;
  nameAr?: string;
  flagCode: string | null;
  aliases?: string[];
};

/** Canonical metadata for World Cup teams (keyed by English countryName in Match.homeTeam/awayTeam) */
const TEAMS: TeamMetadata[] = [
  { teamCode: "MEX", fifaCode: "MEX", countryName: "Mexico", flagCode: "mx" },
  { teamCode: "RSA", fifaCode: "RSA", countryName: "South Africa", flagCode: "za" },
  { teamCode: "KOR", fifaCode: "KOR", countryName: "South Korea", flagCode: "kr", aliases: ["Korea Republic"] },
  { teamCode: "CAN", fifaCode: "CAN", countryName: "Canada", flagCode: "ca" },
  { teamCode: "USA", fifaCode: "USA", countryName: "USA", flagCode: "us", aliases: ["United States", "United States of America"] },
  { teamCode: "PAR", fifaCode: "PAR", countryName: "Paraguay", flagCode: "py" },
  { teamCode: "IRN", fifaCode: "IRN", countryName: "Iran", flagCode: "ir" },
  { teamCode: "NZL", fifaCode: "NZL", countryName: "New Zealand", flagCode: "nz" },
  { teamCode: "BRA", fifaCode: "BRA", countryName: "Brazil", flagCode: "br" },
  { teamCode: "MAR", fifaCode: "MAR", countryName: "Morocco", flagCode: "ma" },
  { teamCode: "FRA", fifaCode: "FRA", countryName: "France", flagCode: "fr" },
  { teamCode: "SEN", fifaCode: "SEN", countryName: "Senegal", flagCode: "sn" },
  { teamCode: "ARG", fifaCode: "ARG", countryName: "Argentina", flagCode: "ar" },
  { teamCode: "ALG", fifaCode: "ALG", countryName: "Algeria", flagCode: "dz" },
  { teamCode: "ENG", fifaCode: "ENG", countryName: "England", flagCode: "gb-eng" },
  { teamCode: "CRO", fifaCode: "CRO", countryName: "Croatia", flagCode: "hr" },
  {
    teamCode: "CZE",
    fifaCode: "CZE",
    countryName: "Czech Republic",
    nameFa: "چک",
    nameAr: "التشيك",
    flagCode: "cz",
    aliases: ["Czechia"],
  },
  {
    teamCode: "BIH",
    fifaCode: "BIH",
    countryName: "Bosnia and Herzegovina",
    nameFa: "بوسنی و هرزگوین",
    nameAr: "البوسنة والهرسك",
    flagCode: "ba",
    aliases: ["Bosnia"],
  },
  { teamCode: "ESP", fifaCode: "ESP", countryName: "Spain", flagCode: "es" },
  { teamCode: "CPV", fifaCode: "CPV", countryName: "Cape Verde", flagCode: "cv" },
  { teamCode: "GER", fifaCode: "GER", countryName: "Germany", flagCode: "de" },
  { teamCode: "ITA", fifaCode: "ITA", countryName: "Italy", flagCode: "it" },
  { teamCode: "POR", fifaCode: "POR", countryName: "Portugal", flagCode: "pt" },
  { teamCode: "NED", fifaCode: "NED", countryName: "Netherlands", flagCode: "nl" },
  { teamCode: "BEL", fifaCode: "BEL", countryName: "Belgium", flagCode: "be" },
  { teamCode: "JPN", fifaCode: "JPN", countryName: "Japan", flagCode: "jp" },
  { teamCode: "AUS", fifaCode: "AUS", countryName: "Australia", flagCode: "au" },
  { teamCode: "URU", fifaCode: "URU", countryName: "Uruguay", flagCode: "uy" },
  { teamCode: "COL", fifaCode: "COL", countryName: "Colombia", flagCode: "co" },
  { teamCode: "CHI", fifaCode: "CHI", countryName: "Chile", flagCode: "cl" },
  { teamCode: "ECU", fifaCode: "ECU", countryName: "Ecuador", flagCode: "ec" },
  { teamCode: "PER", fifaCode: "PER", countryName: "Peru", flagCode: "pe" },
  { teamCode: "SUI", fifaCode: "SUI", countryName: "Switzerland", flagCode: "ch" },
  { teamCode: "POL", fifaCode: "POL", countryName: "Poland", flagCode: "pl" },
  { teamCode: "SWE", fifaCode: "SWE", countryName: "Sweden", flagCode: "se" },
  { teamCode: "DEN", fifaCode: "DEN", countryName: "Denmark", flagCode: "dk" },
  { teamCode: "WAL", fifaCode: "WAL", countryName: "Wales", flagCode: "gb-wls" },
  { teamCode: "SCO", fifaCode: "SCO", countryName: "Scotland", flagCode: "gb-sct" },
  { teamCode: "TUR", fifaCode: "TUR", countryName: "Turkey", flagCode: "tr" },
  { teamCode: "UKR", fifaCode: "UKR", countryName: "Ukraine", flagCode: "ua" },
  { teamCode: "SRB", fifaCode: "SRB", countryName: "Serbia", flagCode: "rs" },
  { teamCode: "GHA", fifaCode: "GHA", countryName: "Ghana", flagCode: "gh" },
  { teamCode: "NGA", fifaCode: "NGA", countryName: "Nigeria", flagCode: "ng" },
  { teamCode: "CMR", fifaCode: "CMR", countryName: "Cameroon", flagCode: "cm" },
  { teamCode: "CRC", fifaCode: "CRC", countryName: "Costa Rica", flagCode: "cr" },
  { teamCode: "PAN", fifaCode: "PAN", countryName: "Panama", flagCode: "pa" },
  { teamCode: "JAM", fifaCode: "JAM", countryName: "Jamaica", flagCode: "jm" },
  { teamCode: "QAT", fifaCode: "QAT", countryName: "Qatar", flagCode: "qa" },
  { teamCode: "KSA", fifaCode: "KSA", countryName: "Saudi Arabia", flagCode: "sa" },
  { teamCode: "TUN", fifaCode: "TUN", countryName: "Tunisia", flagCode: "tn" },
  { teamCode: "CIV", fifaCode: "CIV", countryName: "Ivory Coast", flagCode: "ci", aliases: ["Côte d'Ivoire"] },
  { teamCode: "EGY", fifaCode: "EGY", countryName: "Egypt", flagCode: "eg" },
];

const PLAYOFF_PLACEHOLDER: TeamMetadata = {
  teamCode: "TBD",
  fifaCode: "TBD",
  countryName: "UEFA Playoff",
  flagCode: null,
};

const lookup = new Map<string, TeamMetadata>();

for (const team of TEAMS) {
  lookup.set(team.countryName.toLowerCase(), team);
  lookup.set(team.teamCode.toLowerCase(), team);
  lookup.set(team.fifaCode.toLowerCase(), team);
  for (const alias of team.aliases ?? []) {
    lookup.set(alias.toLowerCase(), team);
  }
}

export function getTeamMetadata(teamName: string): TeamMetadata | null {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const direct = lookup.get(trimmed.toLowerCase());
  if (direct) return direct;

  const lower = trimmed.toLowerCase();
  if (lower.includes("playoff") || lower.includes("uefa") || lower.includes("winner")) {
    return PLAYOFF_PLACEHOLDER;
  }

  return null;
}

export function getTeamFlagCode(teamName: string): string | null {
  return getTeamMetadata(teamName)?.flagCode ?? null;
}

/** @deprecated use getTeamFlagCode */
export function getTeamIsoCode(teamName: string): string | null {
  return getTeamFlagCode(teamName);
}

const FLAGCDN_BASE = "https://flagcdn.com";

/** Valid flagcdn widths (px). Picks nearest supported width. */
export function resolveFlagcdnWidth(requested: number): number {
  const widths = [20, 40, 80, 160, 320, 640];
  return widths.find((w) => w >= requested) ?? 640;
}

export function buildFlagcdnUrl(flagCode: string, width = 40): string {
  const w = resolveFlagcdnWidth(width);
  return `${FLAGCDN_BASE}/w${w}/${flagCode.toLowerCase()}.png`;
}

export function getTeamFlagUrl(teamName: string, width = 40): string | null {
  const flagCode = getTeamFlagCode(teamName);
  if (!flagCode) return null;
  return buildFlagcdnUrl(flagCode, width);
}

/** Fallback flag codes when a regional code 404s on flagcdn */
export function getFlagFallbackCode(flagCode: string): string | null {
  const map: Record<string, string> = {
    "gb-eng": "gb",
    "gb-wls": "gb",
    "gb-sct": "gb",
    "gb-nir": "gb",
  };
  return map[flagCode.toLowerCase()] ?? null;
}

export const FLAG_PLACEHOLDER_PATH = "/flags/placeholder.svg";

export function getAllTeams(): TeamMetadata[] {
  return TEAMS;
}

export function getTeamByFifaCode(code: string): TeamMetadata | null {
  return lookup.get(code.trim().toLowerCase()) ?? null;
}

export function getTeamLocalizedSlot(team: TeamMetadata): {
  en: string;
  fa: string;
  ar: string;
} {
  return {
    en: team.countryName,
    fa: team.nameFa ?? team.countryName,
    ar: team.nameAr ?? team.countryName,
  };
}
