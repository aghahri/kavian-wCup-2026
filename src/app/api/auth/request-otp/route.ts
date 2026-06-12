import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import {
  isValidE164Phone,
  isValidSmsRecipient,
  maskPhone,
  normalizePhoneInput,
  normalizeSmsRecipient,
} from "@/lib/phone";
import {
  OTP_REQUEST_COOLDOWN_MS,
  buildOtpMessage,
  generateOtpCode,
  hashOtpCode,
  isOtpDevBypass,
  isOtpEnabled,
  OTP_EXPIRY_MS,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { sendSamantelSms } from "@/lib/samantel-sms";

const GENERIC_ERROR = "درخواست نامعتبر است. لطفاً بعداً تلاش کنید.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const countryDial = String(body.countryDial ?? "98").replace(/\D/g, "");
    const phone = normalizePhoneInput(countryDial, String(body.phone ?? ""));
    const smsRecipient = normalizeSmsRecipient(phone);

    if (!isValidE164Phone(phone) || !isValidSmsRecipient(smsRecipient)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const recent = await prisma.otpChallenge.findFirst({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - OTP_REQUEST_COOLDOWN_MS) },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      const remainingMs = OTP_REQUEST_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime());
      const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
      return NextResponse.json(
        { error: GENERIC_ERROR, errorCode: "RATE_LIMIT", retryAfterSeconds },
        { status: 429, headers: NO_STORE_HEADERS }
      );
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const otpActive = isOtpEnabled();
    const devBypass = isOtpDevBypass();

    if (!otpActive && !devBypass) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 503, headers: NO_STORE_HEADERS });
    }

    let customerId: string | null = null;
    let serverId: string | null = null;
    let providerStatus: string;

    if (otpActive) {
      const sms = await sendSamantelSms({
        recipient: smsRecipient,
        inputPhone: phone,
        body: buildOtpMessage(code),
      });
      customerId = sms.customerId;
      serverId = sms.serverId;
      providerStatus = sms.providerStatus;

      if (!sms.ok && !devBypass) {
        await prisma.otpChallenge.create({
          data: {
            phone,
            codeHash,
            expiresAt,
            customerId,
            serverId,
            providerStatus: `${providerStatus}|send_failed`,
          },
        });
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 502, headers: NO_STORE_HEADERS });
      }

      if (!sms.ok && devBypass) {
        providerStatus = `${providerStatus}|verify_dev_bypass_only`;
      }
    } else {
      providerStatus = "called:no|otp_disabled_dev_bypass";
    }

    await prisma.otpChallenge.updateMany({
      where: { phone, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.otpChallenge.create({
      data: {
        phone,
        codeHash,
        expiresAt,
        customerId,
        serverId,
        providerStatus,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        phoneMask: maskPhone(phone),
        expiresInSeconds: OTP_EXPIRY_MS / 1000,
        cooldownSeconds: OTP_REQUEST_COOLDOWN_MS / 1000,
        smsDispatched:
          providerStatus.includes("called:yes") && !providerStatus.includes("send_failed"),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
