import type { TeamMetadata } from "@/lib/teams";
import { getTeamByFifaCode } from "@/lib/teams";

export type FixtureTeamSlot = {
  en: string;
  fa: string;
  ar: string;
};

export function teamToFixtureSlot(team: TeamMetadata): FixtureTeamSlot {
  return {
    en: team.countryName,
    fa: team.nameFa ?? team.countryName,
    ar: team.nameAr ?? team.countryName,
  };
}

/** UEFA play-off path winners — 2026 FIFA World Cup (finals, 31 Mar 2026) */
export const PLAYOFF_PATH_WINNERS: Record<"A" | "B" | "C" | "D", FixtureTeamSlot> = {
  A: teamToFixtureSlot(getTeamByFifaCode("BIH")!),
  B: teamToFixtureSlot(getTeamByFifaCode("SWE")!),
  C: teamToFixtureSlot(getTeamByFifaCode("TUR")!),
  D: teamToFixtureSlot(getTeamByFifaCode("CZE")!),
};

const PLAYOFF_HINT =
  /play-?off|playoff|ملحق|پلی‌?آف|فائز|برنده|uefa/i;

export function isPlayoffPlaceholder(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return PLAYOFF_HINT.test(name);
}

/** Extract play-off path letter (A–D) from placeholder team name in any locale. */
export function getPlayoffPathFromPlaceholder(name: string): "A" | "B" | "C" | "D" | null {
  const trimmed = name.trim();

  const pathSuffix = trimmed.match(/(?:path|ملحق|پلی‌?آف|play-?off|winner|فائز|برنده)\s*([AaBbCcDd])\b/i);
  if (pathSuffix) return pathSuffix[1].toUpperCase() as "A" | "B" | "C" | "D";

  const trailing = trimmed.match(/\b([AaBbCcDd])\s*$/);
  if (trailing && PLAYOFF_HINT.test(trimmed)) {
    return trailing[1].toUpperCase() as "A" | "B" | "C" | "D";
  }

  return null;
}

export function resolvePlayoffReplacement(
  ...names: Array<string | null | undefined>
): FixtureTeamSlot | null {
  for (const name of names) {
    if (!name || !isPlayoffPlaceholder(name)) continue;
    const path = getPlayoffPathFromPlaceholder(name);
    if (path && PLAYOFF_PATH_WINNERS[path]) {
      return PLAYOFF_PATH_WINNERS[path];
    }
  }
  return null;
}

export type FixtureSlot = "home" | "away";

export function buildMatchTeamPatch(
  slot: FixtureSlot,
  replacement: FixtureTeamSlot
): Record<string, string> {
  const prefix = slot === "home" ? "home" : "away";
  return {
    [`${prefix}Team`]: replacement.en,
    [`${prefix}TeamFa`]: replacement.fa,
    [`${prefix}TeamAr`]: replacement.ar,
  };
}
