import React from "react";
import {
  ArrowRight, MapPin, ShieldCheck, User, Sparkles, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const btnPrimary =
  "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50";

interface RFQSidebarProps {
  rfq: any;
  canSubmitProposal: () => boolean;
  hasAlreadySubmitted?: boolean;
  canApproveOrAward: boolean;
  isTenderExpired: () => boolean;
  isVendor: boolean;
  getTenderSummary: () => string;
  totalItems: number;
  onNavigateToProposals: () => void;
  onInviteVendor: (e: React.FormEvent) => void;
  inviteWhatsapp: string;
  setInviteWhatsapp: (value: string) => void;
  inviting: boolean;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--ui-border)] last:border-0">
      <span className="text-[var(--ui-text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--ui-text-primary)] tabular-nums">{value}</span>
    </div>
  );
}

export function RFQSidebar({
  rfq,
  canSubmitProposal,
  hasAlreadySubmitted = false,
  canApproveOrAward,
  isTenderExpired,
  isVendor,
  getTenderSummary,
  totalItems,
  onNavigateToProposals,
  onInviteVendor,
  inviteWhatsapp,
  setInviteWhatsapp,
  inviting,
}: RFQSidebarProps) {
  const { t } = useLanguage();
  const expired = isTenderExpired();

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-2">
      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2">
          {t("rfqDetail.sidebar.tenderSummary")}
        </div>
        <Row label={t("rfqDetail.sidebar.totalQuantity")} value={t("rfqDetail.stats.unitsUnit", { n: totalItems })} />
        <Row label={t("rfqDetail.sidebar.duration")} value={t("rfqDetail.stats.daysUnit", { n: rfq.duration_days ?? 7 })} />
        {rfq.department && <Row label={t("rfqDetail.sidebar.department")} value={rfq.department} />}
        <Row label={t("rfqDetail.sidebar.timeRemaining")} value={getTenderSummary()} />

        {canSubmitProposal() && (
          <button type="button" onClick={onNavigateToProposals} className={`${btnPrimary} mt-3`}>
            {t("rfqDetail.sidebar.submitProposal")} <ArrowRight size={13} />
          </button>
        )}

        {/* Already submitted — disabled state */}
        {hasAlreadySubmitted && !expired && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={13} className="shrink-0" />
            {t("rfqDetail.sidebar.proposalSubmitted")}
          </div>
        )}

        {isVendor && expired && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-2 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-semibold">
            <AlertTriangle size={13} />
            {t("rfqDetail.sidebar.tenderEnded")}
          </div>
        )}

        {!isVendor && rfq?.status === "active" && !expired && (
          <p className="mt-3 text-[11px] text-[var(--ui-text-muted)] text-center">
            {t("rfqDetail.sidebar.onlyVendors")}
          </p>
        )}
      </div>

      {canApproveOrAward && rfq && (rfq.status === "active" || rfq.status === "draft") && !expired && (
        <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
          <div className="flex items-start gap-2 mb-2">
            <User size={14} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[var(--ui-text-primary)]">{t("rfqDetail.sidebar.inviteVendorTitle")}</p>
              <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
                {t("rfqDetail.sidebar.inviteVendorDesc")}
              </p>
            </div>
          </div>
          <form onSubmit={onInviteVendor} className="flex flex-col gap-2">
            <input
              type="tel"
              required
              placeholder={t("rfqDetail.sidebar.invitePlaceholder")}
              value={inviteWhatsapp}
              onChange={(e) => setInviteWhatsapp(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={inviting || !inviteWhatsapp}
              className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {inviting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {inviting ? t("rfqDetail.sidebar.sending") : t("rfqDetail.sidebar.inviteBtn")}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5">
          <MapPin size={11} /> {t("rfqDetail.sidebar.deliveryPoint")}
        </div>
        <p className="text-xs text-[var(--ui-text-primary)] leading-relaxed">
          {rfq.delivery_point || rfq.company?.address || t("rfqDetail.sidebar.notSpecified")}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3">
        <div className="flex gap-2 items-start">
          <ShieldCheck size={14} className="text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
            {t("rfqDetail.sidebar.proposalProtected")}
          </p>
        </div>
      </div>
    </aside>
  );
}
