import { prisma } from "@/lib/prisma";

export type MatchSourceRow = {
  id: string;
  homeTeamFa: string;
  awayTeamFa: string;
  kickoffAt: Date;
  isFinished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  scoreVerifiedAt: Date | null;
  scoreSourceName: string | null;
  highlightsUrl: string | null;
  highlightsEmbedUrl: string | null;
  aiRefreshedAt: Date | null;
  externalMatchId: string | null;
  eventCount: number;
};

export async function getMatchSourceOps(): Promise<{
  missingScore: MatchSourceRow[];
  finishedNotVerified: MatchSourceRow[];
  missingHighlights: MatchSourceRow[];
  missingAiRefresh: MatchSourceRow[];
}> {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "desc" },
    include: { _count: { select: { events: true } } },
    take: 80,
  });

  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  const rows: MatchSourceRow[] = matches.map((m) => ({
    id: m.id,
    homeTeamFa: m.homeTeamFa,
    awayTeamFa: m.awayTeamFa,
    kickoffAt: m.kickoffAt,
    isFinished: m.isFinished,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    scoreVerifiedAt: m.scoreVerifiedAt,
    scoreSourceName: m.scoreSourceName,
    highlightsUrl: m.highlightsUrl,
    highlightsEmbedUrl: m.highlightsEmbedUrl,
    aiRefreshedAt: m.aiRefreshedAt,
    externalMatchId: m.externalMatchId,
    eventCount: m._count.events,
  }));

  const kickoffPassed = (m: MatchSourceRow) => m.kickoffAt.getTime() + twoHoursMs < now;

  return {
    missingScore: rows.filter(
      (m) => kickoffPassed(m) && (!m.isFinished || m.homeScore === null || m.awayScore === null)
    ),
    finishedNotVerified: rows.filter(
      (m) => m.isFinished && m.homeScore !== null && m.awayScore !== null && !m.scoreVerifiedAt
    ),
    missingHighlights: rows.filter(
      (m) => m.isFinished && !m.highlightsUrl && !m.highlightsEmbedUrl
    ),
    missingAiRefresh: rows.filter(
      (m) =>
        m.isFinished &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        (!m.aiRefreshedAt || m.aiRefreshedAt < m.kickoffAt)
    ),
  };
}
