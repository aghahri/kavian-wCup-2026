import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const matches = await prisma.match.findMany({
      orderBy: { kickoffAt: "asc" },
      include: { _count: { select: { predictions: true } } },
    });
    return NextResponse.json({ matches });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const match = await prisma.match.create({
      data: {
        homeTeam: String(body.homeTeam ?? "").trim(),
        awayTeam: String(body.awayTeam ?? "").trim(),
        homeTeamFa: String(body.homeTeamFa ?? "").trim(),
        awayTeamFa: String(body.awayTeamFa ?? "").trim(),
        stage: String(body.stage ?? "گروهی").trim(),
        kickoffAt: new Date(body.kickoffAt),
      },
    });

    return NextResponse.json({ match });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در ایجاد بازی" }, { status: 500 });
  }
}
