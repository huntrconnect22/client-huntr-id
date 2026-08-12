import React from "react";
import { RefreshCw, Loader2, Briefcase, FileText, Package, Calendar, ArrowRight } from "lucide-react";

export function VendorTendersView({
  openRfqs,
  rfqsLoading,
  vendorSubmittedRfqIds,
  isTenderExpired,
  onRefresh,
  onSelectRfq
}: {
  openRfqs: any[];
  rfqsLoading: boolean;
  vendorSubmittedRfqIds: string[];
  isTenderExpired: (rfq: any) => boolean;
  onRefresh: () => void;
  onSelectRfq: (rfq: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 px-4 rounded-xl">
        <div>
          <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
            Available Opportunities
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
            Review and participate in active buyer requests.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {rfqsLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <Loader2 className="animate-spin text-orange-500" size={28} />
          <span className="text-xs text-[var(--ui-text-muted)]">Loading opportunities...</span>
        </div>
      ) : openRfqs.length === 0 ? (
        <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
          <Briefcase size={36} className="text-[var(--ui-text-muted)] opacity-20" />
          <p className="text-sm font-semibold text-[var(--ui-text-primary)]">No Active Tenders</p>
          <p className="text-xs text-[var(--ui-text-muted)]">Check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {openRfqs.filter((rfq: any) => !isTenderExpired(rfq)).map(rfq => {
            const hasSubmitted = vendorSubmittedRfqIds.includes(rfq.id);
            return (
              <div 
                key={rfq.id} 
                onClick={() => { if (!hasSubmitted) onSelectRfq(rfq); }}
                className={`border rounded-xl bg-[var(--ui-bg-card)] p-4 flex flex-col justify-between space-y-3 transition-all ${
                  hasSubmitted ? "border-[var(--ui-border)] opacity-80" : "border-[var(--ui-border)] hover:border-orange-400/50 cursor-pointer"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[var(--ui-text-muted)] bg-[var(--ui-bg-input)] px-2 py-0.5 rounded">
                      #{rfq.id ? String(rfq.id).substring(0, 8).toUpperCase() : ""}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                      {rfq.company?.name}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] line-clamp-2 leading-snug">
                      {rfq.title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[var(--ui-border)]">
                  <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Package size={13} className="text-orange-500" /> {rfq.items?.length || 0} Items
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {new Date(rfq.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button 
                    disabled={hasSubmitted}
                    style={hasSubmitted ? {} : { color: 'white' }}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      hasSubmitted
                        ? "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] border border-[var(--ui-border)] cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    {hasSubmitted ? "Proposal Submitted" : "Submit Quotation"} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
