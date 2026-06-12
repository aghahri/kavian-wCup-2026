import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { requireAdmin } from "@/lib/auth";
import {
  analysisToDbFields,
  generateFootballAnalysis,
} from "@/lib/ai/football-analysis";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const analysis = await prisma.matchAnalysis.findUnique({ where: { matchId: id } });
  if (!analysis) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
  }
  return NextResponse.json({ analysis }, { headers: NO_STORE_HEADERS });
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers: NO_STORE_HEADERS });
    }

    const generated = generateFootballAnalysis(match);
    const fields = analysisToDbFields(match, generated);

    const analysis = await prisma.matchAnalysis.upsert({
      where: { matchId: id },
      create: { matchId: id, ...fields },
      update: fields,
    });

    return NextResponse.json({ analysis }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json({ error: "FAILED" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
