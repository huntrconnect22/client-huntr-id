export const rupiah = (amount: number) =>
  `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
export const dateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : `${date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })} WIB`;
};
export const field =
  "w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] rounded-md";
export const button =
  "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] rounded-md disabled:opacity-50";
export const card =
  "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] rounded-lg";
