import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import {
  isValidE164Phone,
  legacyPhoneVariants,
  maskPhone,
  normalizePhoneInput,
} from "@/lib/phone";
import {
  isOtpDevBypass,
  OTP_DEV_CODE,
  OTP_MAX_ATTEMPTS,
  verifyOtpCode,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import {
  attachReferralToNewUser,
  generateReferralCode,
} from "@/lib/referral";
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

function logVerifySuccess(phone: string, userId: string, isNewUser: boolean) {
  console.info("[verify-otp] success", {
    phoneMask: maskPhone(phone),
    userId,
    isNewUser,
    sessionCreated: true,
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

function fail(payload: VerifyDebug, status: number) {
  logVerifyOtpDebug(payload);
  return NextResponse.json(
    { error: GENERIC_ERROR },
    { status, headers: NO_STORE_HEADERS }
  );
}

async function findExistingUser(phone: string) {
  const direct = await prisma.user.findUnique({ where: { phone } });
  if (direct) return direct;

  for (const legacy of legacyPhoneVariants(phone)) {
    const match = await prisma.user.findUnique({ where: { phone: legacy } });
    if (match) {
      if (match.phone !== phone) {
        await prisma.user.update({
          where: { id: match.id },
          data: { phone },
        });
      }
      return { ...match, phone };
    }
  }

  return null;
}

export async function POST(request: Request) {
  const debug: VerifyDebug = {
    phone: "",
    challengeFound: false,
    debugReason: "unknown",
  };

  try {
    const body = await request.json();
    const countryDial = String(body.countryDial ?? "98").replace(/\D/g, "");
    const phone = normalizePhoneInput(countryDial, String(body.phone ?? ""));
    const code = String(body.code ?? "").trim();
    const name = String(body.name ?? "").trim();

    debug.phone = phone;

    if (!isValidE164Phone(phone) || !/^\d{6}$/.test(code)) {
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

    const existingUser = await findExistingUser(phone);

    if (!existingUser && (!name || name.length < 2)) {
      debug.debugReason = "needs_name";
      logVerifyOtpDebug(debug);
      return NextResponse.json(
        { needsName: true },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        usedAt: new Date(),
        providerStatus: `${challenge.providerStatus ?? ""}|verify:success`.slice(-500),
      },
    });

    const isNewUser = !existingUser;
    const user = await prisma.user.upsert({
      where: { phone },
      update: existingUser ? {} : { name },
      create: { phone, name, referralCode: generateReferralCode() },
    });

    if (!user.referralCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: generateReferralCode() },
      });
    }

    if (isNewUser) {
      await attachReferralToNewUser(user.id);
    }

    await setSessionUserId(user.id);

    debug.debugReason = "success";
    logVerifyOtpDebug(debug);
    logVerifySuccess(phone, user.id, isNewUser);

    return NextResponse.json(
      {
        user: { id: user.id, name: user.name, isAdmin: user.isAdmin },
        isNewUser,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    debug.debugReason = "exception";
    logVerifyOtpDebug(debug);
    console.error("[verify-otp] exception", error);
    return NextResponse.json(
      { error: GENERIC_ERROR },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
