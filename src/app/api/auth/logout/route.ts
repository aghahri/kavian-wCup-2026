import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  await clearSession();
  const formData = await request.formData().catch(() => null);
  const locale = formData?.get("locale")?.toString() ?? "fa";
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
