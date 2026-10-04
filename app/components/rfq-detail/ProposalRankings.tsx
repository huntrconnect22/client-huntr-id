import React from "react";
import {
  Trophy, MessageSquare, Award, Loader2, Sparkles, FileText, Info,
} from "lucide-react";
import { getAssetUrl } from "../../lib/assets";
import { useLanguage } from "../../context/LanguageContext";

const btnSecondary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors disabled:opacity-50";

const btnPrimary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50";

const btnAi =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/15 transition-colors disabled:opacity-50";

interface ProposalRankingsProps {
  rankings: any[];
  canApproveOrAward: boolean;
  isRfqAlreadyAwarded: boolean;
  awardingProposal: string | number | null;
  isProcessing: boolean;
  onNegotiate: (proposal: any) => void;
  onAward: (proposalId: string | number, rfqId: string | number) => void;
  onAIRank: () => void;
  aiRankLoading: boolean;
  showAiPanel: boolean;
}

export function ProposalRankings({
  rankings,
  canApproveOrAward,
  isRfqAlreadyAwarded,
  awardingProposal,
  isProcessing,
  onNegotiate,
  onAward,
  onAIRank,
  aiRankLoading,
  showAiPanel,
}: ProposalRankingsProps) {
  const { t } = useLanguage();
  const topRank = rankings.find((r) => r.rank === 1);

  if (rankings.length === 0) return null;

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
          <button type="button" onClick={onAIRank} disabled={aiRankLoading} className={btnAi}>
            {aiRankLoading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Sparkles size={11} />
            )}
            {showAiPanel ? t("rfqDetail.proposals.aiRefresh") : t("rfqDetail.proposals.aiAnalysis")}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
          <Info size={11} /> {t("rfqDetail.proposals.evaluationCriteria")}
        </div>
        <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
          {t("rfqDetail.proposals.evaluationDetail")}
        </p>
      </div>

      {topRank && canApproveOrAward && !isRfqAlreadyAwarded && (
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
            <button type="button" onClick={() => onNegotiate(topRank.proposal)} className={btnSecondary}>
              <MessageSquare size={11} /> {t("rfqDetail.proposals.negotiate")}
            </button>
            <button
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
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-12">#</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">{t("rfqDetail.proposals.tableVendor")}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">{t("rfqDetail.proposals.tableOffer")}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">{t("rfqDetail.proposals.tableDel")}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">{t("rfqDetail.proposals.tableWarr")}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[80px]">{t("rfqDetail.proposals.tableStatus")}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[50px]">{t("rfqDetail.proposals.tableDoc")}</th>
              {canApproveOrAward && !isRfqAlreadyAwarded && (
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[140px]">{t("rfqDetail.proposals.tableActions")}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ui-border)]">
            {rankings.map((rankData) => {
              const p = rankData.proposal;
              const isWinner = rankData.is_winner || p.winner_status === "awarded" || p.winner_status === "approved";
              const rfqId = p.rfq?.id || p.rfq_id;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-[var(--ui-bg-input)] transition-colors ${rankData.rank === 1 ? "bg-orange-500/5" : ""}`}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isWinner ? (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {t("rfqDetail.proposals.winBadge")}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[var(--ui-text-muted)]">#{rankData.rank}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-semibold text-[var(--ui-text-primary)] truncate">
                      {p.company?.name || "Vendor"}
                    </div>
                    {rankData.vendor_stats && (
                      <div className="text-[10px] text-[var(--ui-text-muted)]">
                        {t("rfqDetail.proposals.winRate", { rate: rankData.vendor_stats.win_rate })}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-bold text-[var(--ui-text-brand)] whitespace-nowrap">
                    Rp {Number(p.price_offer).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{t("rfqDetail.proposals.deliveryDays", { n: p.delivery_days })}</td>
                  <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{t("rfqDetail.proposals.warrantyMonths", { n: p.warranty_months })}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isWinner ? (
                      <span className="text-[10px] font-semibold text-emerald-500">{t("rfqDetail.proposals.statusAwarded")}</span>
                    ) : p.winner_status === "rejected" ? (
                      <span className="text-[10px] font-semibold text-red-400">{t("rfqDetail.proposals.statusRejected")}</span>
                    ) : (
                      <span className="text-[10px] text-[var(--ui-text-muted)]">{t("rfqDetail.proposals.statusActive")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
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
                  </td>
                  {canApproveOrAward && !isRfqAlreadyAwarded && (
                    <td className="px-3 py-2">
                      {!isWinner && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => onNegotiate(p)} className={btnSecondary}>
                            <MessageSquare size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAward(p.id, rfqId)}
                            disabled={awardingProposal === p.id || isProcessing}
                            className={btnPrimary}
                          >
                            {awardingProposal === p.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Award size={11} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
