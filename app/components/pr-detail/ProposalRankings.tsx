import React from "react";
import { Trophy, Building2, Package, MessageSquare, Loader2, FileText } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

const btnSecondary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors disabled:opacity-50";

const btnPrimary =
  "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50";

interface ProposalRankingsProps {
  rankings: any[];
  onAwardWinner?: (proposalId: string | number, rfqId: string | number) => Promise<void>;
  onOpenNegotiation?: (proposal: any) => void;
  awardingProposal?: string | number | null;
  requestId: string;
}

export function ProposalRankings({
  rankings,
  onAwardWinner,
  onOpenNegotiation,
  awardingProposal,
  requestId,
}: ProposalRankingsProps) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
        <Package size={22} className="text-[var(--ui-text-muted)] opacity-25" />
        <p className="text-xs text-[var(--ui-text-muted)]">No vendor proposals yet.</p>
      </div>
    );
  }

  const winners = rankings.filter((r) => r.is_winner);
  const regularRankings = rankings.filter((r) => !r.is_winner);
  const allRows = [...winners, ...regularRankings];

  return (
    <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-12">#</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Vendor</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">Offer</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">Delivery</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[100px]">Payment</th>
            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[70px]">Doc</th>
            {(onAwardWinner || onOpenNegotiation) && (
              <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[140px]">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ui-border)]">
          {allRows.map((rankData) => {
            const proposal = rankData.proposal;
            const isWinner = rankData.is_winner;
            return (
              <tr
                key={proposal.id}
                className={`hover:bg-[var(--ui-bg-input)] transition-colors ${isWinner ? "bg-emerald-500/5" : ""}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {isWinner ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      <Trophy size={10} /> Win
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[var(--ui-text-muted)]">#{rankData.rank}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={13} className="text-[var(--ui-text-muted)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--ui-text-primary)] truncate">
                      {proposal.company?.name || "Vendor"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-[var(--ui-text-brand)]">
                  Rp {Number(proposal.price_offer).toLocaleString("id-ID")}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-[var(--ui-text-secondary)]">
                  {proposal.delivery_days}d
                </td>
                <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)] truncate max-w-[100px]">
                  {proposal.payment_term}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {(proposal.document_path || proposal.document_url) ? (
                    <a
                      href={proposal.document_url || getAssetUrl(proposal.document_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500 hover:underline"
                    >
                      <FileText size={11} /> View
                    </a>
                  ) : (
                    <span className="text-[11px] text-[var(--ui-text-muted)]">—</span>
                  )}
                </td>
                {(onAwardWinner || onOpenNegotiation) && (
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {onOpenNegotiation && !isWinner && (
                        <button type="button" onClick={() => onOpenNegotiation(proposal)} className={btnSecondary}>
                          <MessageSquare size={11} /> Negotiate
                        </button>
                      )}
                      {onAwardWinner && !isWinner && (
                        <button
                          type="button"
                          onClick={() => onAwardWinner(proposal.id, requestId)}
                          disabled={awardingProposal === proposal.id}
                          className={btnPrimary}
                        >
                          {awardingProposal === proposal.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Trophy size={11} />
                          )}
                          Award
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
