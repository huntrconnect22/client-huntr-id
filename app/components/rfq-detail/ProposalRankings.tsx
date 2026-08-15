import React from "react";
import {
  Trophy, MessageSquare, Award, Loader2, Sparkles, FileText, Info,
} from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

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
  const topRank = rankings.find((r) => r.rank === 1);

  if (rankings.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-orange-500" />
          <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
            Vendor Proposals
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
            {showAiPanel ? "Refresh AI" : "AI Analysis"}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
          <Info size={11} /> Evaluation criteria
        </div>
        <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
          Price (primary) → delivery lead time → warranty period.
        </p>
      </div>

      {topRank && canApproveOrAward && !isRfqAlreadyAwarded && (
        <div className="rounded-lg border border-orange-500/25 bg-orange-500/5 px-3 py-2 mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase text-orange-400">System recommendation</div>
            <div className="text-sm font-semibold text-[var(--ui-text-primary)] truncate">
              {topRank.proposal.company?.name || "Vendor"}
            </div>
            <div className="text-[11px] text-[var(--ui-text-muted)]">
              Rp {Number(topRank.proposal.price_offer).toLocaleString("id-ID")} · {topRank.proposal.delivery_days}d · {topRank.proposal.warranty_months}mo warranty
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button type="button" onClick={() => onNegotiate(topRank.proposal)} className={btnSecondary}>
              <MessageSquare size={11} /> Negotiate
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
              Award
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-12">#</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Vendor</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">Offer</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">Del.</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[60px]">Warr.</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[80px]">Status</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[50px]">Doc</th>
              {canApproveOrAward && !isRfqAlreadyAwarded && (
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[140px]">Actions</th>
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
                        Win
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
                        Win rate {rankData.vendor_stats.win_rate}%
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-bold text-[var(--ui-text-brand)] whitespace-nowrap">
                    Rp {Number(p.price_offer).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{p.delivery_days}d</td>
                  <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)]">{p.warranty_months}mo</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isWinner ? (
                      <span className="text-[10px] font-semibold text-emerald-500">Awarded</span>
                    ) : p.winner_status === "rejected" ? (
                      <span className="text-[10px] font-semibold text-red-400">Rejected</span>
                    ) : (
                      <span className="text-[10px] text-[var(--ui-text-muted)]">Active</span>
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
