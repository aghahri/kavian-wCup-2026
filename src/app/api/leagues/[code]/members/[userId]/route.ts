import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { getLeagueByCode, isLeagueOwner } from "@/lib/private-leagues";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ code: string; userId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { code, userId } = await context.params;
    const league = await getLeagueByCode(code);

    if (!league) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
    }
    if (!(await isLeagueOwner(league.id, user.id))) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: NO_STORE_HEADERS });
    }
    if (userId === league.ownerId) {
      return NextResponse.json({ error: "CANNOT_REMOVE_OWNER" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    await prisma.privateLeagueMember.deleteMany({
      where: { leagueId: league.id, userId },
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
