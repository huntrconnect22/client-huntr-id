import React from "react";
import { User, Building2, FileText, CheckCircle2 } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

interface RFQDescriptionProps {
  rfq: any;
  successMessage: string | null;
}

function MetaCell({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
        <Icon size={11} />
        {label}
      </div>
      <div className="text-xs font-semibold text-[var(--ui-text-primary)] mt-1 truncate">{value}</div>
      {sub && <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export function RFQDescription({ rfq, successMessage }: RFQDescriptionProps) {
  const documentUrl = rfq?.document_url || (rfq?.document_path ? getAssetUrl(rfq.document_path) : null);

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 space-y-3">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
          Purchase Requisition
        </span>
        <h2 className="text-base sm:text-lg font-bold text-[var(--ui-text-primary)] mt-2 leading-snug">
          {rfq.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetaCell
          icon={User}
          label="Requested by"
          value={rfq.user?.name || "Unknown"}
          sub={rfq.created_at ? new Date(rfq.created_at).toLocaleDateString("id-ID") : undefined}
        />
        <MetaCell
          icon={Building2}
          label="Company"
          value={rfq.company?.name || "Unknown"}
        />
      </div>

      {rfq.description && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
            Requirements
          </div>
          <p className="text-sm text-[var(--ui-text-secondary)] leading-relaxed">{rfq.description}</p>
        </div>
      )}

      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:underline"
        >
          <FileText size={12} /> View attachment
        </a>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
          <CheckCircle2 size={14} />
          {successMessage}
        </div>
      )}
    </div>
  );
}
