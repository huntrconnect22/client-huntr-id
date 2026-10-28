export const money = (value: unknown, currency = "IDR", locale = "id") =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const date = (value?: string | null, locale = "id") =>
  value
    ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
        dateStyle: "medium",
      }).format(new Date(value))
    : "—";
export const card = "border border-[var(--ui-border)] bg-[var(--ui-bg-card)]";
export const input = "w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)]";
export const button = "inline-flex items-center justify-center gap-2 bg-[var(--ui-text-brand)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const badge = (status?: string) => {
  const color = status === "approved" || status === "active" || status === "completed" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : status === "submitted" || status === "in_progress" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : status === "rejected" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-slate-500/10 text-slate-600 dark:text-slate-300";
  return `${color} inline-flex px-2 py-0.5 text-[11px] font-semibold capitalize`;
};


