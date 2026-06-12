import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { buildMatchSummary } from "@/lib/match-summary";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match || !match.isFinished) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const stats = await buildMatchSummary(match, "fa");
  if (!stats) {
    return NextResponse.json({ error: "NOT_READY" }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    {
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      },
      stats,
    },
    { headers: NO_STORE_HEADERS }
  );
}
