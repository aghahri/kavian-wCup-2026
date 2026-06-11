import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const ads = await prisma.adBanner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });
    return NextResponse.json({ ads });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const ad = await prisma.adBanner.create({
      data: {
        title: String(body.title ?? "").trim(),
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        linkUrl: body.linkUrl ? String(body.linkUrl) : null,
        placement: String(body.placement ?? "home_top").trim(),
        locale: body.locale ? String(body.locale) : null,
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder ?? 0),
      },
    });

    return NextResponse.json({ ad });
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
