import { randomInt, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const OTP_LENGTH = 6;

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export async function hashOtpCode(code: string): Promise<string> {
  const salt = randomInt(1_000_000, 9_999_999).toString();
  const derived = (await scryptAsync(code, salt, 32)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyOtpCode(code: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;

  const derived = (await scryptAsync(code, salt, 32)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function buildOtpMessage(code: string): string {
  return `کد ورود شما به کاویان فوتبال: ${code}\nاین کد تا ۵ دقیقه معتبر است.`;
}

export function isOtpEnabled(): boolean {
  return process.env.OTP_ENABLED === "true";
}

export function isOtpDevBypass(): boolean {
  return process.env.OTP_DEV_BYPASS === "true";
}

export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_REQUEST_COOLDOWN_MS = 60 * 1000;
export const OTP_DEV_CODE = "123456";
