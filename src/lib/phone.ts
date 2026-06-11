/** Domestic Iranian mobile: 09XXXXXXXXX */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits;
  }

  return digits;
}

/** Samantel recipient format: 989XXXXXXXXX (12 digits, no plus) */
export function normalizeSmsRecipient(phone: string): string {
  const domestic = normalizePhone(phone);
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
  return /^09\d{9}$/.test(normalizePhone(phone));
}

export function isValidSmsRecipient(recipient: string): boolean {
  return /^98\d{10}$/.test(recipient.replace(/\D/g, ""));
}

export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length < 7) return "***";
  return `${normalized.slice(0, 4)}***${normalized.slice(-3)}`;
}

/** Mask 989XXXXXXXXX as 98918***015 */
export function maskSmsRecipient(recipient: string): string {
  const digits = recipient.replace(/\D/g, "");
  if (digits.length < 8) return "***";
  return `${digits.slice(0, 5)}***${digits.slice(-3)}`;
}
