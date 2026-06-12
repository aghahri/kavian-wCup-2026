import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { getLeagueByCode, isLeagueOwner } from "@/lib/private-leagues";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { code } = await context.params;
    const league = await getLeagueByCode(code);
    if (!league) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
    }
    if (!(await isLeagueOwner(league.id, user.id))) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    const data: Record<string, string | null> = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim() : null;
    }

    const updated = await prisma.privateLeague.update({
      where: { id: league.id },
      data,
    });

    return NextResponse.json({ league: updated }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
