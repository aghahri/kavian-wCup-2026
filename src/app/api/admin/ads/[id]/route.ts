import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const ad = await prisma.adBanner.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).trim() }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl ? String(body.imageUrl) : null }),
        ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl ? String(body.linkUrl) : null }),
        ...(body.placement !== undefined && { placement: String(body.placement).trim() }),
        ...(body.locale !== undefined && { locale: body.locale ? String(body.locale) : null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

    return NextResponse.json({ ad });
  } catch (error) {
    return adminError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.adBanner.delete({ where: { id } });
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
