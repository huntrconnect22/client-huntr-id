import type { Tab, ComposerKind, RecordRow } from "./types";

export const stages = [
  "qualification",
  "discovery",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export const stageConfig: Record<
  string,
  { label: string; color: string; border: string; bg: string; dot: string }
> = {
  qualification: {
    label: "Qualification",
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    dot: "bg-sky-400",
  },
  discovery: {
    label: "Discovery",
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    dot: "bg-indigo-400",
  },
  proposal: {
    label: "Proposal",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    dot: "bg-amber-400",
  },
  negotiation: {
    label: "Negotiation",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
  },
  closed_won: {
    label: "Closed Won",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
  closed_lost: {
    label: "Closed Lost",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    dot: "bg-rose-400",
  },
};

export const createMap: Partial<Record<Tab, ComposerKind>> = {
  leads: "lead",
  pipeline: "deal",
  customers: "customer",
  tasks: "task",
  helpdesk: "ticket",
  cpq: "quote",
  automation: "workflow",
};

export const money = (value: unknown, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const dateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const contactNumber = (value?: string | null) =>
  String(value || "")
    .replace(/@(c\.us|g\.us|lid)$/i, "")
    .trim();

export const conversationIdentity = (conversation: RecordRow) =>
  contactNumber(conversation.customer_phone || conversation.external_id) ||
  conversation.customer_name ||
  "Kontak belum dikenal";

export const jsonValue = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object") return value as Record<string, any>;
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
};

export const card =
  "rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs transition-all";

export const input =
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none transition-all placeholder:text-[var(--ui-text-muted)] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30";

export function getInitials(name?: string) {
  if (!name) return "CR";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


