import React from "react";

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string; hint: string }> = {
  pending_approval: {
    bg: "bg-amber-500/10",
    color: "text-amber-500",
    dot: "bg-amber-500",
    label: "Pending Approval",
    hint: "Awaiting manager approval before RFQ is published.",
  },
  approved: {
    bg: "bg-emerald-500/10",
    color: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Approved",
    hint: "Approved and ready for next procurement steps.",
  },
  active: {
    bg: "bg-orange-500/10",
    color: "text-orange-400",
    dot: "bg-orange-500",
    label: "Open RFQ",
    hint: "Live global RFQ — vendors can submit proposals.",
  },
  rejected: {
    bg: "bg-red-500/10",
    color: "text-red-400",
    dot: "bg-red-500",
    label: "Rejected",
    hint: "This PR was rejected and cannot proceed.",
  },
};

export function PRStatusCard({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? {
    bg: "bg-[var(--ui-bg-input)]",
    color: "text-[var(--ui-text-muted)]",
    dot: "bg-gray-400",
    label: status,
    hint: "",
  };

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2">
        Status
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
      {s.hint && (
        <p className="text-[11px] text-[var(--ui-text-muted)] mt-2 leading-relaxed">{s.hint}</p>
      )}
    </div>
  );
}
