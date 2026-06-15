import { getMatchDisplayState } from "@/lib/match-status";
import { prisma } from "@/lib/prisma";

export type AdminResultRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFa: string;
  awayTeamFa: string;
  kickoffAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  scoreSourceName: string | null;
  scoreSourceUrl: string | null;
  scoreVerifiedAt: Date | null;
  highlightsUrl: string | null;
  highlightsEmbedUrl: string | null;
  highlightsProvider: string | null;
  aiRefreshedAt: Date | null;
  phase: "upcoming" | "live" | "finished";
  missingScore: boolean;
  missingVerification: boolean;
  missingHighlights: boolean;
  staleAi: boolean;
  kickedOff: boolean;
};

export async function getAdminResultsData(): Promise<{
  matches: AdminResultRow[];
  kickedOff: AdminResultRow[];
  missingScore: AdminResultRow[];
  missingVerification: AdminResultRow[];
  missingHighlights: AdminResultRow[];
  staleAi: AdminResultRow[];
}> {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "desc" },
    take: 100,
  });

  const now = Date.now();

  const rows: AdminResultRow[] = matches.map((m) => {
    const displayState = getMatchDisplayState(m);
    const kickedOff = m.kickoffAt.getTime() < now;
    const hasScore = m.homeScore !== null && m.awayScore !== null;
    const finished = displayState === "finished_unverified" || displayState === "finished_verified";

    return {
      id: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeTeamFa: m.homeTeamFa,
      awayTeamFa: m.awayTeamFa,
      kickoffAt: m.kickoffAt,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isFinished: m.isFinished,
      scoreSourceName: m.scoreSourceName,
      scoreSourceUrl: m.scoreSourceUrl,
      scoreVerifiedAt: m.scoreVerifiedAt,
      highlightsUrl: m.highlightsUrl,
      highlightsEmbedUrl: m.highlightsEmbedUrl,
      highlightsProvider: m.highlightsProvider,
      aiRefreshedAt: m.aiRefreshedAt,
      phase:
        displayState === "upcoming"
          ? "upcoming"
          : displayState === "live_or_needs_result"
            ? "live"
            : "finished",
      kickedOff,
      missingScore: kickedOff && (!hasScore || !m.isFinished),
      missingVerification: finished && !m.scoreVerifiedAt,
      missingHighlights: finished && !m.highlightsUrl && !m.highlightsEmbedUrl,
      staleAi:
        finished &&
        (!m.aiRefreshedAt || m.aiRefreshedAt.getTime() < m.kickoffAt.getTime()),
    };
  });

  return {
    matches: rows,
    kickedOff: rows.filter((r) => r.kickedOff),
    missingScore: rows.filter((r) => r.missingScore),
    missingVerification: rows.filter((r) => r.missingVerification),
    missingHighlights: rows.filter((r) => r.missingHighlights),
    staleAi: rows.filter((r) => r.staleAi),
  };
}
