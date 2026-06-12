import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      referralCode: true,
      createdAt: true,
      tournamentMemberships: { select: { tournamentId: true } },
      _count: { select: { referrals: true } },
    },
  });

  return NextResponse.json({ user: full }, { headers: NO_STORE_HEADERS });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name },
    select: { id: true, name: true, avatarUrl: true },
  });

  return NextResponse.json({ user: updated }, { headers: NO_STORE_HEADERS });
}
