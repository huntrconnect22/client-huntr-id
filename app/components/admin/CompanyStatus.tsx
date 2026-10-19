import { Building2, CheckCircle2, XCircle, Clock } from "lucide-react";

/* ─── Status meta ─────────────────────────────────────────────────── */
export const STATUS_META = {
  pending: {
    color: "var(--ui-status-pending)",
    bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.22)",
    icon: <Clock size={11} />,
    label: "Pending",
  },
  approved: {
    color: "var(--ui-status-approved)",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.22)",
    icon: <CheckCircle2 size={11} />,
    label: "Approved",
  },
  rejected: {
    color: "var(--ui-status-rejected)",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.22)",
    icon: <XCircle size={11} />,
    label: "Rejected",
  },
} as const;

export const STAT_CARDS = [
  { key: "total" as const,    label: "Total",    gradient: "linear-gradient(135deg,#f59e0b,#ea580c)", icon: <Building2 size={18} /> },
  { key: "pending" as const,  label: "Pending",  gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: <Clock size={18} /> },
  { key: "approved" as const, label: "Approved", gradient: "linear-gradient(135deg,#10b981,#059669)", icon: <CheckCircle2 size={18} /> },
  { key: "rejected" as const, label: "Rejected", gradient: "linear-gradient(135deg,#ef4444,#dc2626)", icon: <XCircle size={18} /> },
];

