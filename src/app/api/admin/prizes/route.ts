import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const prizes = await prisma.prize.findMany({
      orderBy: { rankFrom: "asc" },
      include: { tournament: { select: { nameEn: true, slug: true } } },
    });
    return NextResponse.json({ prizes });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const prize = await prisma.prize.create({
      data: {
        tournamentId: body.tournamentId ? String(body.tournamentId) : null,
        titleFa: String(body.titleFa ?? "").trim(),
        titleEn: String(body.titleEn ?? "").trim(),
        titleAr: String(body.titleAr ?? "").trim(),
        sponsorName: body.sponsorName ? String(body.sponsorName) : null,
        descriptionFa: body.descriptionFa ? String(body.descriptionFa) : null,
        descriptionEn: body.descriptionEn ? String(body.descriptionEn) : null,
        descriptionAr: body.descriptionAr ? String(body.descriptionAr) : null,
        rankFrom: Number(body.rankFrom ?? 1),
        rankTo: Number(body.rankTo ?? 1),
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ prize });
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
