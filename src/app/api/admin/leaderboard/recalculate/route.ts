import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateLeaderboard } from "@/lib/scoring";

export async function POST() {
  try {
    await requireAdmin();

    const updated = await recalculateLeaderboard(
      async (id, points) => {
        await prisma.prediction.update({ where: { id }, data: { points } });
      },
      async () =>
        prisma.prediction.findMany({
          include: {
            match: {
              select: {
                homeScore: true,
                awayScore: true,
                isFinished: true,
              },
            },
          },
        })
    );

    return NextResponse.json({ updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "ورود لازم است" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "دسترسی مدیریت ندارید" }, { status: 403 });
    }
    return NextResponse.json({ error: "خطا در به‌روزرسانی جدول" }, { status: 500 });
  }
}
