import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    let settings = await prisma.paymentSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.paymentSettings.create({ data: { id: "default" } });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return adminError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const settings = await prisma.paymentSettings.upsert({
      where: { id: "default" },
      update: {
        ...(body.paymentsEnabled !== undefined && { paymentsEnabled: Boolean(body.paymentsEnabled) }),
        ...(body.vipPaymentsEnabled !== undefined && {
          vipPaymentsEnabled: Boolean(body.vipPaymentsEnabled),
        }),
        ...(body.providerName !== undefined && { providerName: String(body.providerName) }),
        ...(body.currency !== undefined && { currency: String(body.currency) }),
        ...(body.vipPriceLabel !== undefined && { vipPriceLabel: String(body.vipPriceLabel) }),
        ...(body.notes !== undefined && { notes: body.notes ? String(body.notes) : null }),
      },
      create: { id: "default" },
    });

    return NextResponse.json({ settings });
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
