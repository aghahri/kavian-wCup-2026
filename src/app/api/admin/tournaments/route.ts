import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { memberships: true, prizes: true } } },
    });
    return NextResponse.json({ tournaments });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const tournament = await prisma.tournament.create({
      data: {
        slug: String(body.slug ?? "").trim(),
        nameFa: String(body.nameFa ?? "").trim(),
        nameEn: String(body.nameEn ?? "").trim(),
        nameAr: String(body.nameAr ?? "").trim(),
        descriptionFa: body.descriptionFa ? String(body.descriptionFa) : null,
        descriptionEn: body.descriptionEn ? String(body.descriptionEn) : null,
        descriptionAr: body.descriptionAr ? String(body.descriptionAr) : null,
        isVip: Boolean(body.isVip),
        isActive: body.isActive !== false,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    });

    return NextResponse.json({ tournament });
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
