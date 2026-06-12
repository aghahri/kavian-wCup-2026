import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { markLeagueInviteJoined } from "@/lib/league-invite-stats";
import { getLeagueByCode } from "@/lib/private-leagues";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { code } = await context.params;
    const league = await getLeagueByCode(code);

    if (!league || !league.isActive) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const existing = await prisma.privateLeagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyMember: true }, { headers: NO_STORE_HEADERS });
    }

    await prisma.privateLeagueMember.create({
      data: { leagueId: league.id, userId: user.id, role: "member" },
    });

    await markLeagueInviteJoined(league.id, user.id);

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
