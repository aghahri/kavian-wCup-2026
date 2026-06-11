import { NextResponse } from "next/server";
import { isValidIranMobile, maskPhone, normalizePhone } from "@/lib/phone";
import {
  isOtpDevBypass,
  OTP_DEV_CODE,
  OTP_MAX_ATTEMPTS,
  verifyOtpCode,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { setSessionUserId } from "@/lib/session";

const GENERIC_ERROR = "تأیید ناموفق بود. لطفاً دوباره تلاش کنید.";

type VerifyDebug = {
  phone: string;
  challengeFound: boolean;
  challengeId?: string;
  expiresAt?: Date;
  attempts?: number;
  usedAt?: Date | null;
  hashMatch?: boolean;
  debugReason: string;
};

function logVerifyOtpDebug(payload: VerifyDebug) {
  console.info("[verify-otp]", {
    phoneMask: maskPhone(payload.phone),
    challengeFound: payload.challengeFound,
    challengeId: payload.challengeId,
    expiresAt: payload.expiresAt?.toISOString(),
    attempts: payload.attempts,
    usedAt: payload.usedAt?.toISOString() ?? null,
    hashMatch: payload.hashMatch,
    debugReason: payload.debugReason,
  });
}

async function recordVerifyDebug(
  challengeId: string | undefined,
  existingStatus: string | null | undefined,
  debugReason: string
) {
  if (!challengeId) return;
  const suffix = `|verify:${debugReason}`;
  const nextStatus = `${existingStatus ?? ""}${suffix}`.slice(-500);
  await prisma.otpChallenge.update({
    where: { id: challengeId },
    data: { providerStatus: nextStatus },
  });
}

function fail(
  payload: VerifyDebug,
  status: number,
  extra?: { needsName?: boolean }
) {
  logVerifyOtpDebug(payload);
  return NextResponse.json(
    { error: GENERIC_ERROR, ...extra },
    { status }
  );
}

export async function POST(request: Request) {
  const debug: VerifyDebug = {
    phone: "",
    challengeFound: false,
    debugReason: "unknown",
  };

  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    const name = String(body.name ?? "").trim();

    debug.phone = phone;

    if (!isValidIranMobile(phone) || !/^\d{6}$/.test(code)) {
      debug.debugReason = "invalid_input";
      return fail(debug, 400);
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    debug.challengeFound = Boolean(challenge);
    if (challenge) {
      debug.challengeId = challenge.id;
      debug.expiresAt = challenge.expiresAt;
      debug.attempts = challenge.attempts;
      debug.usedAt = challenge.usedAt;
    }

    if (!challenge) {
      debug.debugReason = "challenge_not_found";
      return fail(debug, 400);
    }

    if (challenge.expiresAt < new Date()) {
      debug.debugReason = "expired";
      await recordVerifyDebug(challenge.id, challenge.providerStatus, debug.debugReason);
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      });
      return fail(debug, 400);
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      debug.debugReason = "max_attempts";
      await recordVerifyDebug(challenge.id, challenge.providerStatus, debug.debugReason);
      return fail(debug, 400);
    }

    const devBypass = isOtpDevBypass();
    const hashMatch =
      devBypass && code === OTP_DEV_CODE
        ? true
        : await verifyOtpCode(code, challenge.codeHash);

    debug.hashMatch = hashMatch;

    if (!hashMatch) {
      debug.debugReason = "hash_mismatch";
      await recordVerifyDebug(challenge.id, challenge.providerStatus, debug.debugReason);
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return fail(debug, 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (!existingUser && (!name || name.length < 2)) {
      debug.debugReason = "needs_name";
      logVerifyOtpDebug(debug);
      return NextResponse.json(
        { error: GENERIC_ERROR, needsName: true },
        { status: 400 }
      );
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        usedAt: new Date(),
        providerStatus: `${challenge.providerStatus ?? ""}|verify:success`.slice(-500),
      },
    });

    const user = await prisma.user.upsert({
      where: { phone },
      update: existingUser ? {} : { name },
      create: { phone, name },
    });

    await setSessionUserId(user.id);

    debug.debugReason = "success";
    logVerifyOtpDebug(debug);

    return NextResponse.json({
      user: { id: user.id, name: user.name, isAdmin: user.isAdmin },
    });
  } catch (error) {
    debug.debugReason = "exception";
    logVerifyOtpDebug(debug);
    console.error("[verify-otp] exception", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
