import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const translations = await prisma.uiTranslation.findMany({
      orderBy: [{ locale: "asc" }, { key: "asc" }],
    });
    return NextResponse.json({ translations });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const key = String(body.key ?? "").trim();
    const locale = String(body.locale ?? "").trim();
    const value = String(body.value ?? "").trim();

    if (!key || !locale || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const translation = await prisma.uiTranslation.upsert({
      where: { key_locale: { key, locale } },
      update: { value },
      create: { key, locale, value },
    });

    return NextResponse.json({ translation });
  } catch (error) {
    return adminError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.uiTranslation.delete({ where: { id } });
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
