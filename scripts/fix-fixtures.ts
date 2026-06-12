/**
 * Safely replaces UEFA play-off placeholder teams with qualified nations.
 * Does NOT delete matches or predictions — only updates team name fields.
 *
 * Usage: npm run fix:fixtures
 */
import { PrismaClient } from "@prisma/client";
import {
  buildMatchTeamPatch,
  isPlayoffPlaceholder,
  resolvePlayoffReplacement,
  type FixtureSlot,
} from "../src/lib/fixture-corrections";

const prisma = new PrismaClient();

function slotFields(slot: FixtureSlot, match: {
  homeTeam: string;
  awayTeam: string;
  homeTeamFa: string;
  awayTeamFa: string;
  homeTeamAr: string | null;
  awayTeamAr: string | null;
}): Array<string | null | undefined> {
  if (slot === "home") {
    return [match.homeTeam, match.homeTeamFa, match.homeTeamAr];
  }
  return [match.awayTeam, match.awayTeamFa, match.awayTeamAr];
}

async function main() {
  const matches = await prisma.match.findMany({ orderBy: { kickoffAt: "asc" } });
  let updated = 0;

  for (const match of matches) {
    const patch: Record<string, string> = {};

    for (const slot of ["home", "away"] as const) {
      const fields = slotFields(slot, match);
      if (!fields.some(isPlayoffPlaceholder)) continue;

      const replacement = resolvePlayoffReplacement(...fields);
      if (!replacement) continue;

      Object.assign(patch, buildMatchTeamPatch(slot, replacement));
    }

    if (Object.keys(patch).length === 0) continue;

    await prisma.match.update({
      where: { id: match.id },
      data: patch,
    });

    updated += 1;
    const home = patch.homeTeam ?? match.homeTeam;
    const away = patch.awayTeam ?? match.awayTeam;
    console.log(`✓ ${match.id}: ${home} vs ${away}`);
  }

  console.log(`\nDone. Updated ${updated} of ${matches.length} matches. Predictions untouched.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
