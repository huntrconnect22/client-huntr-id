import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useState } from "react";
import {
  Trophy, MessageSquare, Award, Loader2, Sparkles, FileText, Info, Users, UserCheck, CheckCircle2, PackageCheck,
} from "lucide-react";
import { getAssetUrl } from "~/lib/assets";
import { useLanguage } from "~/context/LanguageContext";
import { MultiVendorAwardModal } from "./MultiVendorAwardModal";

const btnSecondary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors disabled:opacity-50";

const btnPrimary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50";

const btnAi =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/15 transition-colors disabled:opacity-50";

interface ProposalRankingsProps {
  rfq?: any;
  rankings: any[];
  canApproveOrAward: boolean;
  isRfqAlreadyAwarded: boolean;
  awardingProposal: string | number | null;
  isProcessing: boolean;
  onNegotiate: (proposal: any) => void;
  onAward: (proposalId: string | number, rfqId: string | number) => void;
  onAwardMulti?: (
    awards: Array<{ proposal_id: string; item_ids: string[] }>,
    awardMode: "multi_vendor"
  ) => Promise<void>;
  onAIRank: () => void;
  aiRankLoading: boolean;
  showAiPanel: boolean;
}

export function ProposalRankings({
  rfq,
  rankings,
  canApproveOrAward,
  isRfqAlreadyAwarded,
  awardingProposal,
  isProcessing,
  onNegotiate,
  onAward,
  onAwardMulti,
  onAIRank,
  aiRankLoading,
  showAiPanel,
}: ProposalRankingsProps) {
  const { t } = useLanguage();
  const topRank = rankings.find((r) => r.rank === 1);
  const [awardModeTab, setAwardModeTab] = useState<"single" | "multi">("single");
  const [showMultiModal, setShowMultiModal] = useState(false);

  if (rankings.length === 0) return null;

  const totalVendors = rankings.length;
  const isMultiVendorAvailable = totalVendors >= 2;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-orange-500" />
          <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
            {t("rfqDetail.proposals.sectionTitle")}
            <span className="text-[var(--ui-text-muted)] font-normal ml-1">({rankings.length})</span>
          </h2>
        </div>
        {canApproveOrAward && (
          <HuntrButton type="button" onClick={onAIRank} disabled={aiRankLoading} className={btnAi}>
            {aiRankLoading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Sparkles size={11} />
            )}
            {showAiPanel ? t("rfqDetail.proposals.aiRefresh") : t("rfqDetail.proposals.aiAnalysis")}
          </HuntrButton>
        )}
      </div>

      {/* Scheme Selector Tab (Only when awarding is possible) */}
      {canApproveOrAward && !isRfqAlreadyAwarded && (
        <div className="mb-3 p-1 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center gap-1">
          <HuntrButton
            type="button"
            onClick={() => setAwardModeTab("single")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              awardModeTab === "single"
                ? "bg-[var(--ui-bg-card)] text-orange-500 shadow-sm border border-[var(--ui-border)]"
                : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
            }`}
          >
            <Award size={13} />
            <span>Pemenang Tunggal (1 Vendor)</span>
          </HuntrButton>
          <HuntrButton
            type="button"
            onClick={() => {
              setAwardModeTab("multi");
              setShowMultiModal(true);
            }}
            disabled={!isMultiVendorAvailable}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              awardModeTab === "multi"
                ? "bg-gradient-to-r from-orange-500/15 to-purple-500/15 text-orange-500 shadow-sm border border-orange-500/30"
                : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
            }`}
          >
            <Users size={13} />
            <span>Multi-Vendor Split Award (2 - 5 Vendor)</span>
            <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.2 rounded font-extrabold">
              Baru
            </span>
          </HuntrButton>
        </div>
      )}

      {/* Evaluation criteria reminder */}
      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
          <Info size={11} /> {t("rfqDetail.proposals.evaluationCriteria")}
        </div>
        <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
          {t("rfqDetail.proposals.evaluationDetail")}
        </p>
      </div>

      {/* Multi-Vendor Action Card */}
      {canApproveOrAward && !isRfqAlreadyAwarded && awardModeTab === "multi" && isMultiVendorAvailable && (
        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-purple-500/10 p-3.5 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
              <Users size={13} /> Skema Pemenang Terpisah (Multi-Vendor)
            </div>
            <div className="text-xs font-bold text-[var(--ui-text-primary)] mt-0.5">
              Pilih 2 hingga 5 Vendor Pemenang & Checklist Item Terkait
            </div>
            <div className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">
              Hanya item-item yang di-checklist untuk masing-masing vendor yang akan diterbitkan ke Purchase Order (PO).
            </div>
          </div>
          <HuntrButton
            type="button"
            onClick={() => setShowMultiModal(true)}
            disabled={isProcessing}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 shrink-0"
          >
            <PackageCheck size={14} /> Atur Pemenang & Checklist Item
          </HuntrButton>
        </div>
      )}

      {/* Single Winner Recommendation */}
      {topRank && canApproveOrAward && !isRfqAlreadyAwarded && awardModeTab === "single" && (
        <div className="rounded-lg border border-orange-500/25 bg-orange-500/5 px-3 py-2 mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase text-orange-400">{t("rfqDetail.proposals.systemRecommendation")}</div>
            <div className="text-sm font-semibold text-[var(--ui-text-primary)] truncate">
              {topRank.proposal.company?.name || "Vendor"}
            </div>
            <div className="text-[11px] text-[var(--ui-text-muted)]">
              Rp {Number(topRank.proposal.price_offer).toLocaleString("id-ID")} · {t("rfqDetail.proposals.deliveryDays", { n: topRank.proposal.delivery_days })} · {t("rfqDetail.proposals.warrantyMonths", { n: topRank.proposal.warranty_months })} warranty
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <HuntrButton type="button" onClick={() => onNegotiate(topRank.proposal)} className={btnSecondary}>
              <MessageSquare size={11} /> {t("rfqDetail.proposals.negotiate")}
            </HuntrButton>
            <HuntrButton
              type="button"
              onClick={() => onAward(topRank.proposal.id, topRank.proposal.rfq?.id || topRank.proposal.rfq_id)}
              disabled={awardingProposal === topRank.proposal.id || isProcessing}
              className={btnPrimary}
            >
              {awardingProposal === topRank.proposal.id ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Award size={11} />
              )}
              {t("rfqDetail.proposals.award")}
            </HuntrButton>
          </div>
        </div>
      )}

      {/* Proposals Table */}
      <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
        <HuntrTable className="w-full text-sm border-collapse min-w-[640px]">
          <HuntrTableHead>
            <HuntrTableRow className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-12">#</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">{t("rfqDetail.proposals.tableVendor")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[140px]">{t("rfqDetail.proposals.tableOffer")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">{t("rfqDetail.proposals.tableDel")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">{t("rfqDetail.proposals.tableWarr")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">{t("rfqDetail.proposals.tableStatus")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[50px]">{t("rfqDetail.proposals.tableDoc")}</HuntrTableHeaderCell>
              {canApproveOrAward && !isRfqAlreadyAwarded && (
                <HuntrTableHeaderCell className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[140px]">{t("rfqDetail.proposals.tableActions")}</HuntrTableHeaderCell>
              )}
            </HuntrTableRow>
          </HuntrTableHead>
          <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
            {rankings.map((rankData) => {
              const p = rankData.proposal;
              const isWinner = rankData.is_winner || p.winner_status === "awarded" || p.winner_status === "approved";
              const rfqId = p.rfq?.id || p.rfq_id;

              // Check if specific items were checklisted/awarded
              const awardedItems = p.items?.filter((pi: any) => pi.is_awarded) || [];
              const hasSplitAwardItems = awardedItems.length > 0;
              const displayAmount = p.awarded_amount ? Number(p.awarded_amount) : Number(p.price_offer);

              return (
                <HuntrTableRow
                  key={p.id}
                  className={`hover:bg-[var(--ui-bg-input)] transition-colors ${
                    isWinner ? "bg-emerald-500/5" : rankData.rank === 1 ? "bg-orange-500/5" : ""
                  }`}
                >
                  <HuntrTableCell className="px-3 py-2 whitespace-nowrap">
                    {isWinner ? (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {t("rfqDetail.proposals.winBadge")}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[var(--ui-text-muted)]">#{rankData.rank}</span>
                    )}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2">
                    <div className="text-xs font-semibold text-[var(--ui-text-primary)] truncate">
                      {p.company?.name || "Vendor"}
                    </div>
                    <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>
                        Ikut tender untuk:{" "}
                        <b className="text-[var(--ui-text-secondary)]">
                          {(p.items || []).length} dari {rfq?.items?.length || 0} barang
                        </b>
                      </span>
                      {(p.items || []).length < (rfq?.items?.length || 0) && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded">
                          Spesialis
                        </span>
                      )}
                    </div>
                    {isWinner && hasSplitAwardItems && (
                      <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                        <PackageCheck size={11} /> {awardedItems.length} item diterbitkan ke PO
                      </div>
                    )}
                    {rankData.vendor_stats && (
                      <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">
                        {t("rfqDetail.proposals.winRate", { rate: rankData.vendor_stats.win_rate })}
                      </div>
                    )}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2 text-xs font-bold text-[var(--ui-text-brand)] whitespace-nowrap">
                    <div>Rp {displayAmount.toLocaleString("id-ID")}</div>
                    <div className="text-[10px] text-[var(--ui-text-muted)] font-normal">
                      Untuk {(p.items || []).length} barang
                    </div>
                    {isWinner && p.awarded_amount && Number(p.awarded_amount) !== Number(p.price_offer) && (
                      <div className="text-[10px] font-normal text-[var(--ui-text-muted)]">
                        Nilai Penawaran: Rp {Number(p.price_offer).toLocaleString("id-ID")}
                      </div>
                    )}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{t("rfqDetail.proposals.deliveryDays", { n: p.delivery_days })}</HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{t("rfqDetail.proposals.warrantyMonths", { n: p.warranty_months })}</HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2 whitespace-nowrap">
                    {isWinner ? (
                      <span className="text-[10px] font-semibold text-emerald-500">{t("rfqDetail.proposals.statusAwarded")}</span>
                    ) : p.winner_status === "rejected" ? (
                      <span className="text-[10px] font-semibold text-red-400">{t("rfqDetail.proposals.statusRejected")}</span>
                    ) : (
                      <span className="text-[10px] text-[var(--ui-text-muted)]">{t("rfqDetail.proposals.statusActive")}</span>
                    )}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-3 py-2 whitespace-nowrap">
                    {(p.document_path || p.document_url) ? (
                      <a
                        href={p.document_url || getAssetUrl(p.document_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-orange-500 hover:underline"
                      >
                        <FileText size={11} className="inline" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--ui-text-muted)]">—</span>
                    )}
                  </HuntrTableCell>
                  {canApproveOrAward && !isRfqAlreadyAwarded && (
                    <HuntrTableCell className="px-3 py-2">
                      {!isWinner && (
                        <div className="flex items-center justify-end gap-1.5">
                          <HuntrButton type="button" onClick={() => onNegotiate(p)} className={btnSecondary}>
                            <MessageSquare size={11} />
                          </HuntrButton>
                          <HuntrButton
                            type="button"
                            onClick={() => onAward(p.id, rfqId)}
                            disabled={awardingProposal === p.id || isProcessing}
                            className={btnPrimary}
                            title="Tetapkan sebagai pemenang tunggal"
                          >
                            {awardingProposal === p.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Award size={11} />
                            )}
                          </HuntrButton>
                        </div>
                      )}
                    </HuntrTableCell>
                  )}
                </HuntrTableRow>
              );
            })}
          </HuntrTableBody>
        </HuntrTable>
      </div>

      {/* Multi-Vendor Awarding Modal */}
      {showMultiModal && onAwardMulti && (
        <MultiVendorAwardModal
          rfq={rfq}
          rankings={rankings}
          isOpen={showMultiModal}
          onClose={() => setShowMultiModal(false)}
          onConfirm={async (awards, awardMode) => {
            setShowMultiModal(false);
            await onAwardMulti(awards, awardMode);
          }}
          isProcessing={isProcessing}
        />
      )}
    </section>
  );
}
