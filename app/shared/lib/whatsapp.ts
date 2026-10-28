/**
 * Canonical Indonesian WhatsApp format — must match backend WhatsappNumber.
 */
export function normalizeWhatsapp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
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
  return /^628\d{8,11}$/.test(normalized);
}

export function normalizeOtp(otp: string): string {
  return otp.replace(/\D/g, "").slice(0, 6);
}

