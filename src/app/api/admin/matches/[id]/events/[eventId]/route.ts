import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; eventId: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, eventId } = await context.params;
    const body = await request.json();

    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, matchId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "رویداد پیدا نشد" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.minute !== undefined) {
      data.minute = body.minute === null || body.minute === "" ? null : Number(body.minute);
    }
    if (body.type !== undefined) {
      const type = String(body.type);
      if (!EVENT_TYPES.has(type)) {
        return NextResponse.json({ error: "نوع رویداد نامعتبر" }, { status: 400 });
      }
      data.type = type;
    }
    if (body.teamName !== undefined) data.teamName = body.teamName ? String(body.teamName).trim() : null;
    if (body.playerName !== undefined) data.playerName = body.playerName ? String(body.playerName).trim() : null;
    if (body.descriptionFa !== undefined) data.descriptionFa = body.descriptionFa ? String(body.descriptionFa).trim() : null;
    if (body.descriptionEn !== undefined) data.descriptionEn = body.descriptionEn ? String(body.descriptionEn).trim() : null;
    if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr ? String(body.descriptionAr).trim() : null;
    if (body.sourceUrl !== undefined) data.sourceUrl = body.sourceUrl ? String(body.sourceUrl).trim() : null;

    const event = await prisma.matchEvent.update({ where: { id: eventId }, data });
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در ویرایش" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, eventId } = await context.params;

    const existing = await prisma.matchEvent.findFirst({
      where: { id: eventId, matchId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "رویداد پیدا نشد" }, { status: 404 });
    }

    await prisma.matchEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در حذف" }, { status: 500 });
  }
}
