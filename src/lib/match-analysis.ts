import {
  analysisToDbFields,
  generateFootballAnalysis,
} from "@/lib/ai/football-analysis";
import type { Match } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getOrCreateMatchAnalysis(match: Match) {
  const existing = await prisma.matchAnalysis.findUnique({ where: { matchId: match.id } });
  if (existing) return existing;

  const generated = generateFootballAnalysis(match);
  const fields = analysisToDbFields(match, generated);

  return prisma.matchAnalysis.create({
    data: { matchId: match.id, ...fields },
  });
}
