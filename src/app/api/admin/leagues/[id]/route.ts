import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const data: { isActive?: boolean; isFeatured?: boolean } = {};
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);

    const league = await prisma.privateLeague.update({ where: { id }, data });
    return NextResponse.json({ league });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
