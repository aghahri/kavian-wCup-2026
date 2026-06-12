import { NextResponse } from "next/server";
import { isIranDialCode } from "@/lib/countries";
import {
  maskPhone,
  isValidIranMobile,
  isValidSmsRecipient,
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
const IRAN_OTP_ONLY = "فعلاً ورود پیامکی فقط برای شماره‌های ایران فعال است.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const countryDial = String(body.countryDial ?? "98").replace(/\D/g, "");

    if (!isIranDialCode(countryDial)) {
      return NextResponse.json(
        { error: IRAN_OTP_ONLY, errorCode: "IRAN_OTP_ONLY" },
        { status: 400 }
      );
    }

    const phone = normalizePhoneInput(countryDial, String(body.phone ?? ""));
    const smsRecipient = normalizeSmsRecipient(phone);

    if (!isValidIranMobile(phone) || !isValidSmsRecipient(smsRecipient)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
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
      return NextResponse.json(
        { error: GENERIC_ERROR, errorCode: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const otpActive = isOtpEnabled();
    const devBypass = isOtpDevBypass();

    if (!otpActive && !devBypass) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 503 });
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
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
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

    return NextResponse.json({
      ok: true,
      phoneMask: maskPhone(phone),
      expiresInSeconds: OTP_EXPIRY_MS / 1000,
      smsDispatched: providerStatus.includes("called:yes") && !providerStatus.includes("send_failed"),
    });
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
