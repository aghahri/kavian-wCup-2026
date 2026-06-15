import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const EVENT_TYPES = new Set([
  "goal",
  "yellow_card",
  "red_card",
  "substitution",
  "var",
  "kickoff",
  "halftime",
  "fulltime",
]);

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const events = await prisma.matchEvent.findMany({
      where: { matchId: id },
      orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return NextResponse.json({ error: "بازی پیدا نشد" }, { status: 404 });
    }

    const type = String(body.type ?? "goal");
    if (!EVENT_TYPES.has(type)) {
      return NextResponse.json({ error: "نوع رویداد نامعتبر" }, { status: 400 });
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId: id,
        minute: body.minute === null || body.minute === "" ? null : Number(body.minute),
        type,
        teamName: body.teamName ? String(body.teamName).trim() : null,
        playerName: body.playerName ? String(body.playerName).trim() : null,
        descriptionFa: body.descriptionFa ? String(body.descriptionFa).trim() : null,
        descriptionEn: body.descriptionEn ? String(body.descriptionEn).trim() : null,
        descriptionAr: body.descriptionAr ? String(body.descriptionAr).trim() : null,
        sourceUrl: body.sourceUrl ? String(body.sourceUrl).trim() : null,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در ایجاد رویداد" }, { status: 500 });
  }
}
