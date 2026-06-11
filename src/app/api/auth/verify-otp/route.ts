import { NextResponse } from "next/server";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import {
  isOtpDevBypass,
  OTP_DEV_CODE,
  OTP_MAX_ATTEMPTS,
  verifyOtpCode,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { setSessionUserId } from "@/lib/session";

const GENERIC_ERROR = "تأیید ناموفق بود. لطفاً دوباره تلاش کنید.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!isValidIranMobile(phone) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    if (challenge.expiresAt < new Date()) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const devBypass = isOtpDevBypass();
    const valid =
      devBypass && code === OTP_DEV_CODE
        ? true
        : await verifyOtpCode(code, challenge.codeHash);

    if (!valid) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    });

    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (!existingUser) {
      if (!name || name.length < 2) {
        return NextResponse.json(
          { error: GENERIC_ERROR, needsName: true },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: existingUser ? {} : { name },
      create: { phone, name },
    });

    await setSessionUserId(user.id);

    return NextResponse.json({
      user: { id: user.id, name: user.name, isAdmin: user.isAdmin },
    });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
