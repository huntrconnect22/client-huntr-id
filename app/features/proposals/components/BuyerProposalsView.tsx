import React from "react";
import { RefreshCw, Loader2, Briefcase, Building2, Clock, ShieldCheck, DollarSign, Calendar, MessageSquare, Trophy } from "lucide-react";

export function BuyerProposalsView({ 
  receivedProposals, 
  proposalsLoading, 
  activeCompany, 
  awardingId, 
  onRefresh, 
  onNegotiate, 
  onAward 
}: { 
  receivedProposals: any[]; 
  proposalsLoading: boolean; 
  activeCompany: any; 
  awardingId: string | null;
  onRefresh: (companyId: string | number) => void;
  onNegotiate: (proposal: any) => void;
  onAward: (proposalId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 px-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
            Received Proposals ({receivedProposals.length})
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
            Evaluate vendor offers and proceed to negotiation or award.
          </p>
        </div>
        <button
          onClick={() => onRefresh(activeCompany.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {proposalsLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="animate-spin text-orange-500" size={28} />
          <span className="text-xs text-[var(--ui-text-muted)]">Loading proposals...</span>
        </div>
      ) : receivedProposals.length === 0 ? (
        <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
          <Briefcase size={36} className="text-[var(--ui-text-muted)] opacity-20" />
          <p className="text-sm font-semibold text-[var(--ui-text-primary)]">No Proposals Received</p>
          <p className="text-xs text-[var(--ui-text-muted)]">Vendors haven't submitted any offers for your RFQs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receivedProposals.map(p => (
            <div key={p.id} className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ui-text-primary)]">{p.company?.name}</h4>
                    <p className="text-xs font-semibold text-orange-500 mt-0.5">RFQ: {p.rfq?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Total Offer</span>
                  <span className="text-base font-bold text-orange-500">Rp {Number(p.price_offer).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Offer attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-[var(--ui-border)] text-xs">
                <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                  <Clock size={13} className="text-[var(--ui-text-muted)]" /> Lead Time: <span className="font-semibold text-[var(--ui-text-primary)]">{p.delivery_days} Days</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                  <ShieldCheck size={13} className="text-[var(--ui-text-muted)]" /> Warranty: <span className="font-semibold text-[var(--ui-text-primary)]">{p.warranty_months} Mo</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                  <DollarSign size={13} className="text-[var(--ui-text-muted)]" /> Terms: <span className="font-semibold text-[var(--ui-text-primary)]">{p.payment_term}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                  <Calendar size={13} className="text-[var(--ui-text-muted)]" /> Date: <span className="font-semibold text-[var(--ui-text-primary)]">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {p.rfq?.status === 'active' && p.winner_status !== 'rejected' && p.winner_status !== 'awarded' && p.winner_status !== 'approved' && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button 
                    onClick={() => onNegotiate(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-orange-500 hover:border-orange-400/50 transition-all"
                  >
                    <MessageSquare size={13} /> Negotiate
                  </button>
                  <button 
                    onClick={() => onAward(p.id)}
                    disabled={awardingId === p.id}
                    style={{ color: 'white' }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold transition-all disabled:opacity-60"
                  >
                    {awardingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <><Trophy size={13} /> Award Proposal</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
