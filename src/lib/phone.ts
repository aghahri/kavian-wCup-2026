import { isIranDialCode } from "@/lib/countries";

/** Domestic Iranian mobile: 09XXXXXXXXX */
export function normalizeIranPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("98") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits.startsWith("0") ? digits : `0${digits}`;
  }
  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }

  return digits;
}

/** E.164-style storage for non-Iran numbers: +{dial}{national} */
export function normalizeInternationalPhone(dialCode: string, phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith(dialCode)) {
    digits = digits.slice(dialCode.length);
  }
  digits = digits.replace(/^0+/, "");
  return `+${dialCode}${digits}`;
}

/** Iran E.164 for API submit: +989XXXXXXXXX */
export function toIranE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (/^98\d{10}$/.test(digits)) {
    return `+${digits}`;
  }
  const domestic = normalizeIranPhone(phone);
  if (/^09\d{9}$/.test(domestic)) {
    return `+98${domestic.slice(1)}`;
  }
  return phone.trim().startsWith("+") ? phone.trim() : `+${digits}`;
}

/**
 * Normalize phone from login/API input.
 * Iran (98) -> 09XXXXXXXXX (DB storage)
 * Others -> +{dialCode}{nationalNumber}
 */
export function normalizePhoneInput(dialCode: string, phone: string): string {
  if (isIranDialCode(dialCode)) {
    return normalizeIranPhone(phone);
  }
  return normalizeInternationalPhone(dialCode, phone);
}

/** Format login submit payload phone field */
export function formatPhoneForApi(dialCode: string, phone: string): string {
  if (isIranDialCode(dialCode)) {
    return toIranE164(phone);
  }
  return normalizeInternationalPhone(dialCode, phone);
}

/** @deprecated use normalizeIranPhone — kept for existing call sites expecting Iran-only */
export function normalizePhone(phone: string): string {
  return normalizeIranPhone(phone);
}

/** Samantel recipient format: 989XXXXXXXXX (12 digits, no plus) */
export function normalizeSmsRecipient(phone: string): string {
  const domestic = normalizeIranPhone(phone);
  if (/^09\d{9}$/.test(domestic)) {
    return `98${domestic.slice(1)}`;
  }

  const digits = phone.replace(/\D/g, "");
  if (/^98\d{10}$/.test(digits)) {
    return digits;
  }

  return "";
}

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(normalizeIranPhone(phone));
}

export function isValidSmsRecipient(recipient: string): boolean {
  return /^98\d{10}$/.test(recipient.replace(/\D/g, ""));
}

export function isValidPhoneInput(dialCode: string, phone: string): boolean {
  if (isIranDialCode(dialCode)) {
    return isValidIranMobile(phone);
  }
  const normalized = normalizeInternationalPhone(dialCode, phone);
  return /^\+\d{8,15}$/.test(normalized);
}

export function maskPhone(phone: string): string {
  if (phone.startsWith("+")) {
    if (phone.length < 8) return "***";
    return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
  }
  const normalized = normalizeIranPhone(phone);
  if (normalized.length < 7) return "***";
  return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
}

/** Mask 989XXXXXXXXX as 98918***015 */
export function maskSmsRecipient(recipient: string): string {
  const digits = recipient.replace(/\D/g, "");
  if (digits.length < 8) return "***";
  return `${digits.slice(0, 5)}***${digits.slice(-3)}`;
}
