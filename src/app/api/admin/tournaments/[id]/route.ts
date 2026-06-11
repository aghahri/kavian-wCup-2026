import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: String(body.slug).trim() }),
        ...(body.nameFa !== undefined && { nameFa: String(body.nameFa).trim() }),
        ...(body.nameEn !== undefined && { nameEn: String(body.nameEn).trim() }),
        ...(body.nameAr !== undefined && { nameAr: String(body.nameAr).trim() }),
        ...(body.isVip !== undefined && { isVip: Boolean(body.isVip) }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    });

    return NextResponse.json({ tournament });
  } catch (error) {
    return adminError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.tournament.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}

function adminError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
