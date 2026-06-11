import { NextRequest, NextResponse } from "next/server";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, hashIp } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.trim().toLowerCase();

  const referrer = await prisma.user.findUnique({
    where: { referralCode: normalized },
    select: { id: true },
  });

  if (referrer) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    await prisma.referralClick.create({
      data: {
        referralCode: normalized,
        userId: referrer.id,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
      },
    });
  }

  const locale = request.nextUrl.searchParams.get("lang") ?? "fa";
  const redirectUrl = new URL(`/${locale}`, request.url);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(REFERRAL_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
