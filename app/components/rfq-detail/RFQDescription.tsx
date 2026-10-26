import React from "react";
import { User, Building2, FileText, CheckCircle2, Briefcase, Clock, MapPin } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";
import { useLanguage } from "../../context/LanguageContext";

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
  const { t } = useLanguage();
  const documentUrl = rfq?.document_url || (rfq?.document_path ? getAssetUrl(rfq.document_path) : null);
  const isService = rfq?.procurement_type === "services" || Boolean(rfq?.project_type);

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 space-y-3">
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
            {t("rfqDetail.description.purchaseRequisition")}
          </span>
          {rfq?.project_type && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
              Proyek: {rfq.project_type}
            </span>
          )}
        </div>
        <h2 className="text-base sm:text-lg font-bold text-[var(--ui-text-primary)] mt-2 leading-snug">
          {rfq.title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetaCell
          icon={User}
          label={t("rfqDetail.description.requestedBy")}
          value={rfq.user?.name || t("rfqDetail.description.unknown")}
          sub={rfq.created_at ? new Date(rfq.created_at).toLocaleDateString("id-ID") : undefined}
        />
        <MetaCell
          icon={Building2}
          label={t("rfqDetail.description.company")}
          value={rfq.company?.name || t("rfqDetail.description.unknown")}
        />
        {rfq?.project_type && (
          <MetaCell
            icon={Briefcase}
            label="Jenis Proyek"
            value={rfq.project_type}
          />
        )}
        {(rfq?.service_start_date || rfq?.service_end_date) && (
          <MetaCell
            icon={Clock}
            label="Waktu Pengerjaan"
            value={`${rfq.service_start_date || "—"} s/d ${rfq.service_end_date || "—"}`}
          />
        )}
      </div>

      {rfq?.service_location && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs">
          <MapPin size={13} className="text-orange-500 shrink-0" />
          <span className="text-[var(--ui-text-muted)] font-bold text-[10px] uppercase">Lokasi Pengerjaan:</span>
          <span className="text-[var(--ui-text-primary)] font-medium truncate">{rfq.service_location}</span>
        </div>
      )}

      {rfq?.acceptance_criteria && (
        <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
            Kriteria Penerimaan & Deliverables (Syarat BAST)
          </div>
          <p className="text-[var(--ui-text-secondary)] whitespace-pre-line leading-relaxed">
            {rfq.acceptance_criteria}
          </p>
        </div>
      )}

      {rfq.description && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
            {t("rfqDetail.description.requirements")}
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
          <FileText size={12} /> {t("rfqDetail.description.viewAttachment")}
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
