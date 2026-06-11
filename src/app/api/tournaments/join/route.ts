import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasVipAccess } from "@/lib/vip";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const tournamentId = String(body.tournamentId ?? "");

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || !tournament.isActive) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.isVip && !userHasVipAccess(user)) {
      return NextResponse.json({ error: "VIP membership required" }, { status: 403 });
    }

    await prisma.tournamentMembership.upsert({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
      update: {},
      create: { userId: user.id, tournamentId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
