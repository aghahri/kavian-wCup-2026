import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireUser } from "@/lib/auth";
import { ensureUniqueLeagueCode, LEAGUE_PRIVACY, LEAGUE_TYPES } from "@/lib/private-leagues";
import { syncUserBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const type = String(body.type ?? "friends");
    const privacy = String(body.privacy ?? "private");
    const schoolName = body.schoolName ? String(body.schoolName).trim() : null;
    const schoolGrade = body.schoolGrade ? String(body.schoolGrade).trim() : null;

    if (!title || title.length < 2) {
      return NextResponse.json({ error: "INVALID_TITLE" }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (!LEAGUE_TYPES.includes(type as (typeof LEAGUE_TYPES)[number])) {
      return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400, headers: NO_STORE_HEADERS });
    }
    if (!LEAGUE_PRIVACY.includes(privacy as (typeof LEAGUE_PRIVACY)[number])) {
      return NextResponse.json({ error: "INVALID_PRIVACY" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const code = await ensureUniqueLeagueCode();

    const league = await prisma.privateLeague.create({
      data: {
        code,
        title,
        description,
        type,
        privacy,
        schoolName: type === "school" ? schoolName : null,
        schoolGrade: type === "school" ? schoolGrade : null,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "owner" },
        },
      },
    });

    await syncUserBadges(user.id);

    return NextResponse.json({ league }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
