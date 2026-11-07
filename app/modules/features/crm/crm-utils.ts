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

export const formatPhoneNumber = (value?: string | null) => {
  const clean = contactNumber(value);
  if (!clean) return "";
  if (clean.startsWith("62")) {
    const rest = clean.slice(2);
    if (rest.length >= 9) {
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
    }
    return `+62 ${rest}`;
  }
  if (clean.startsWith("08")) {
    const rest = clean.slice(2);
    if (rest.length >= 8) {
      return `08${rest.slice(0, 2)}-${rest.slice(2, 6)}-${rest.slice(6)}`;
    }
    return clean;
  }
  return clean;
};

export const conversationDisplayName = (conversation: RecordRow) => {
  const name = conversation.customer_name?.trim();
  if (name && !name.startsWith("WhatsApp ")) {
    return name;
  }
  const phone = conversation.customer_phone || conversation.external_id;
  if (phone) {
    return formatPhoneNumber(phone);
  }
  return name || "Kontak Baru";
};

export const conversationSubtitle = (conversation: RecordRow) => {
  const name = conversation.customer_name?.trim();
  const phone = conversation.customer_phone || conversation.external_id;
  if (name && !name.startsWith("WhatsApp ") && phone) {
    return formatPhoneNumber(phone);
  }
  return "";
};

export const formatChatTime = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Kemarin";
  }

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString("id-ID", { weekday: "short" });
  }

  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export const conversationIdentity = (conversation: RecordRow) => {
  return conversationDisplayName(conversation);
};

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
  const clean = name.replace(/[^\w\s]/gi, "").trim();
  if (!clean) return "CR";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (/^\d+$/.test(clean)) {
    return "#";
  }
  return parts
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
