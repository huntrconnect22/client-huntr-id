/**
 * Canonical Indonesian and Malaysian WhatsApp format — must match backend WhatsappNumber.
 */
export function normalizeWhatsapp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Malaysian international format already present: 601xxxxxxxxx
  if (/^601\d{8,9}$/.test(digits)) {
    return digits;
  }

  // Malaysian local mobile prefix: 01x-xxxxxxx -> convert to 601xxxxxxxxx
  if (/^01\d{8,9}$/.test(digits)) {
    return "60" + digits.slice(1);
  }

  // Common typo: 685xxxxxxxxxx instead of 085xxxxxxxxxx
  if (/^685\d{9,10}$/.test(digits)) {
    digits = "0" + digits.slice(1);
  }

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62") && digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

export function isValidWhatsapp(phone: string): boolean {
  const normalized = normalizeWhatsapp(phone);
  // Indonesian: 628xxxxxxxxxx (11-14 digits) | Malaysian: 601xxxxxxxxx (11-12 digits)
  return /^(628\d{8,11}|601\d{8,9})$/.test(normalized);
}

export function normalizeOtp(otp: string): string {
  return otp.replace(/\D/g, "").slice(0, 6);
}
