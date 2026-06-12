import { LOGIN_COUNTRIES, type LoginCountry } from "@/lib/countries";

/**
 * Normalize login/API input to E.164: +{dialCode}{nationalNumber}
 *
 * Examples:
 * Iran (98): 9188807015, 09188807015, 989188807015, +989188807015 → +989188807015
 * Germany (49): 15123456789, +4915123456789 → +4915123456789
 */
export function normalizePhoneInput(dialCode: string, phone: string): string {
  const dial = dialCode.replace(/\D/g, "");
  let digits = phone.trim().replace(/\D/g, "");
  if (!digits || !dial) return "";

  if (digits.startsWith(dial)) {
    const rest = digits.slice(dial.length);
    if (rest.length >= 6) {
      digits = rest;
    }
  }

  digits = digits.replace(/^0+/, "");
  return `+${dial}${digits}`;
}

/** @deprecated use normalizePhoneInput */
export function normalizePhone(phone: string): string {
  return normalizePhoneInput("98", phone);
}

/** @deprecated use normalizePhoneInput */
export function normalizeIranPhone(phone: string): string {
  const e164 = normalizePhoneInput("98", phone);
  if (e164.startsWith("+98")) {
    return `0${e164.slice(3)}`;
  }
  return phone;
}

/** Client submit + API storage format (E.164). */
export function formatPhoneForApi(dialCode: string, phone: string): string {
  return normalizePhoneInput(dialCode, phone);
}

/** Samantel/international SMS recipient: digits only, no plus. */
export function normalizeSmsRecipient(e164Phone: string): string {
  return e164Phone.replace(/\D/g, "");
}

export function isValidE164Phone(phone: string): boolean {
  return /^\+\d{8,15}$/.test(phone);
}

export function isValidSmsRecipient(recipient: string): boolean {
  const digits = recipient.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** @deprecated use isValidE164Phone */
export function isValidIranMobile(phone: string): boolean {
  const e164 = phone.startsWith("+") ? phone : normalizePhoneInput("98", phone);
  return /^\+989\d{9}$/.test(e164);
}

export function isValidPhoneInput(dialCode: string, phone: string): boolean {
  return isValidE164Phone(normalizePhoneInput(dialCode, phone));
}

/** Alternate DB keys for legacy Iranian domestic storage (09XXXXXXXXX). */
export function legacyPhoneVariants(e164: string): string[] {
  const variants = new Set<string>();
  if (e164.startsWith("+98")) {
    const national = e164.slice(3);
    if (/^9\d{9}$/.test(national)) {
      variants.add(`0${national}`);
    }
  }
  if (/^09\d{9}$/.test(e164)) {
    variants.add(`+98${e164.slice(1)}`);
  }
  return [...variants];
}

export function maskPhone(phone: string): string {
  if (phone.startsWith("+")) {
    if (phone.length < 8) return "***";
    return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

/** Mask SMS recipient digits e.g. 98918***015 */
export function maskSmsRecipient(recipient: string): string {
  const digits = recipient.replace(/\D/g, "");
  if (digits.length < 8) return "***";
  return `${digits.slice(0, 5)}***${digits.slice(-3)}`;
}

export function getCountryFromE164(phone: string): LoginCountry | undefined {
  const digits = phone.replace(/\D/g, "");
  const sorted = [...LOGIN_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (digits.startsWith(country.dialCode)) {
      return country;
    }
  }
  return undefined;
}
