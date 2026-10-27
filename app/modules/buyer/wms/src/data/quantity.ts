/**
 * Normalisation for quantities returned by legacy APIs and typed user input.
 * Keep this outside views so every WMS workflow interprets stock consistently.
 */
export const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-") return 0;

  const negative = trimmed.startsWith("-");
  const digits = negative ? trimmed.slice(1) : trimmed;
  const native = Number(trimmed);

  if (!Number.isNaN(native)) {
    const dotCount = (digits.match(/\./g) || []).length;
    if (dotCount > 1) {
      const parsed = Number(digits.replace(/\./g, "").replace(/,/g, "."));
      if (!Number.isNaN(parsed)) return negative ? -parsed : parsed;
    }
    return native;
  }

  const parsed = Number(digits.replace(/\./g, "").replace(/,/g, "."));
  return Number.isNaN(parsed) ? 0 : negative ? -parsed : parsed;
};

export const formatQuantity = (
  value: unknown,
  maximumFractionDigits = 3,
): string => {
  const quantity = toNumeric(value);
  if (Number.isInteger(quantity) && Math.abs(quantity) < 1000) {
    return String(quantity);
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Number.isInteger(quantity)
      ? 0
      : maximumFractionDigits,
  }).format(quantity);
};
