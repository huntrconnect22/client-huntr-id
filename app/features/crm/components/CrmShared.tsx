import React from "react";
import { ContactRound, RefreshCw, Tag } from "lucide-react";
import { card } from "../crm-utils";

export function StatusBadge({
  value,
  kind,
}: {
  value?: string | number | null;
  kind?: string;
}) {
  const val = String(value ?? "—").toLowerCase();

  if (
    ["completed", "closed_won", "published", "connected", "active"].includes(val)
  ) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="capitalize">{String(value).replaceAll("_", " ")}</span>
      </span>
    );
  }
  if (
    [
      "urgent",
      "closed_lost",
      "error",
      "auth_failed",
      "disconnected",
      "high",
    ].includes(val)
  ) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 text-[11px] font-semibold text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        <span className="capitalize">{String(value).replaceAll("_", " ")}</span>
      </span>
    );
  }
  if (
    [
      "in_progress",
      "proposal",
      "negotiation",
      "draft",
      "awaiting_scan",
      "initializing",
      "medium",
    ].includes(val)
  ) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 text-[11px] font-semibold text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span className="capitalize">{String(value).replaceAll("_", " ")}</span>
      </span>
    );
  }
  if (
    ["open", "new", "qualification", "discovery", "normal", "low"].includes(val)
  ) {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-sky-500/25 bg-sky-500/10 px-2 text-[11px] font-semibold text-sky-400">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        <span className="capitalize">{String(value).replaceAll("_", " ")}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 text-[11px] font-medium text-[var(--ui-text-secondary)]">
      {String(value ?? "—").replaceAll("_", " ")}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  accent = "orange",
}: {
  label: string;
  value: any;
  caption?: string;
  icon: any;
  accent?: "orange" | "amber" | "indigo" | "sky" | "rose";
}) {
  const accentStyles = {
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-500",
      border: "hover:border-orange-500/40",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "hover:border-amber-500/40",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      border: "hover:border-indigo-500/40",
    },
    sky: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      border: "hover:border-sky-500/40",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "hover:border-rose-500/40",
    },
  }[accent];

  return (
    <div
      className={`${card} p-4 flex items-center justify-between gap-3 ${accentStyles.border}`}
    >
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-[var(--ui-text-primary)]">
          {value}
        </p>
        {caption && (
          <p className="text-[11px] text-[var(--ui-text-secondary)]">{caption}</p>
        )}
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentStyles.bg} ${accentStyles.text}`}
      >
        <Icon size={20} />
      </div>
    </div>
  );
}

export function Panel({
  title,
  caption,
  icon: Icon,
  children,
}: {
  title: string;
  caption: string;
  icon?: any;
  children: any;
}) {
  return (
    <section className={`${card} p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-orange-500" />}
        <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)]">
          {title}
        </h3>
      </div>
      <p className="mt-0.5 text-xs text-[var(--ui-text-secondary)]">{caption}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Mini({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: any;
  icon?: any;
}) {
  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3">
      <div className="flex items-center justify-between text-[11px] text-[var(--ui-text-muted)]">
        <span>{label}</span>
        {Icon && <Icon size={13} className="text-orange-500" />}
      </div>
      <p className="mt-1 text-sm font-bold text-[var(--ui-text-primary)]">
        {value}
      </p>
    </div>
  );
}

export function Empty({ text, icon: Icon }: { text: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] mb-2">
        {Icon ? <Icon size={20} /> : <Tag size={20} />}
      </div>
      <p className="max-w-xs text-xs text-[var(--ui-text-muted)] leading-relaxed">
        {text}
      </p>
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid place-items-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-16 text-center">
      <RefreshCw size={24} className="animate-spin text-orange-500 mb-2" />
      <p className="text-xs font-semibold text-[var(--ui-text-muted)]">
        Memuat data CRM Enterprise…
      </p>
    </div>
  );
}

export function AccessState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <section className={`${card} mx-auto max-w-lg p-8 text-center`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
        <ContactRound size={26} />
      </div>
      <h2 className="mt-4 text-base font-bold text-[var(--ui-text-primary)]">
        CRM Belum Dapat Dibuka
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--ui-text-secondary)]">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition-all"
      >
        <RefreshCw size={14} />
        <span>Coba Lagi</span>
      </button>
    </section>
  );
}
