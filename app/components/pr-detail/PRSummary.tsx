import React from "react";
import { User, MapPin, CheckCircle2, FileText, Building2 } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

interface PRSummaryProps {
  request: any;
}

function MetaRow({
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
    <div className="flex items-start gap-2 py-2 border-b border-[var(--ui-border)] last:border-0">
      <Icon size={13} className="text-[var(--ui-text-muted)] shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">{label}</div>
        <div className="text-xs font-semibold text-[var(--ui-text-primary)] truncate">{value}</div>
        {sub && <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function PRSummary({ request }: PRSummaryProps) {
  const formatDt = (d?: string) =>
    d
      ? new Date(d).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
        Audit & Details
      </div>
      <MetaRow icon={User} label="Requested by" value={request.user?.name || "Unknown"} sub={formatDt(request.created_at)} />
      <MetaRow
        icon={CheckCircle2}
        label="Approved by"
        value={request.approved_by || "Not yet approved"}
        sub={request.approved_at ? formatDt(request.approved_at) : undefined}
      />
      {request.company?.name && (
        <MetaRow icon={Building2} label="Company" value={request.company.name} />
      )}
      {request.delivery_point && (
        <MetaRow icon={MapPin} label="Delivery point" value={request.delivery_point} />
      )}
      {request.rejection_reason && (
        <MetaRow icon={FileText} label="Rejection reason" value={request.rejection_reason} />
      )}
      {(request.document_path || request.document_url) && (
        <div className="pt-2 mt-1 border-t border-[var(--ui-border)]">
          <a
            href={request.document_url || getAssetUrl(request.document_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:underline"
          >
            <FileText size={12} /> View attachment
          </a>
        </div>
      )}
    </div>
  );
}
