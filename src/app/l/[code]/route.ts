import { NextRequest, NextResponse } from "next/server";
import { hashIp } from "@/lib/referral";
import { LEAGUE_INVITE_COOKIE, LEAGUE_INVITE_COOKIE_MAX_AGE } from "@/lib/league-invite";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.trim().toLowerCase();

  const league = await prisma.privateLeague.findUnique({
    where: { code: normalized },
    select: { id: true, isActive: true },
  });

  if (league?.isActive) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    await prisma.privateLeagueInviteClick.create({
      data: {
        leagueId: league.id,
        leagueCode: normalized,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
      },
    });
  }

  const locale = request.nextUrl.searchParams.get("lang") ?? "fa";
  const redirectUrl = league
    ? new URL(`/${locale}/leagues/${normalized}`, request.url)
    : new URL(`/${locale}/leagues`, request.url);

  const response = NextResponse.redirect(redirectUrl);
  if (league) {
    response.cookies.set(LEAGUE_INVITE_COOKIE, normalized, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: LEAGUE_INVITE_COOKIE_MAX_AGE,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
