import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refreshMatchAfterScoreUpdate } from "@/lib/matches/match-refresh";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return NextResponse.json({ error: "بازی پیدا نشد" }, { status: 404 });
    }

    await refreshMatchAfterScoreUpdate(id);
    const refreshed = await prisma.match.findUnique({ where: { id } });
    return NextResponse.json({ match: refreshed });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در به‌روزرسانی" }, { status: 500 });
  }
}
