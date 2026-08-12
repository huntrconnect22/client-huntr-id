import React from "react";

export function VendorSubmissionsList({
  vendorSubmissions
}: {
  vendorSubmissions: any[];
}) {
  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">My Submissions</h2>
      {vendorSubmissions.length === 0 ? (
        <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-10 text-center">
          <p className="text-xs text-[var(--ui-text-muted)]">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendorSubmissions.map(p => (
            <div key={p.id} className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] truncate">{p.rfq?.title}</h4>
                  <p className="text-xs text-[var(--ui-text-muted)]">Buyer: <span className="font-semibold text-[var(--ui-text-secondary)]">{p.buyer_name}</span></p>
                  <p className="text-xs font-bold text-orange-500">Your Bid: Rp {Number(p.price_offer).toLocaleString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    p.is_winner
                      ? "bg-emerald-500/10 text-emerald-500"
                      : p.rank <= 3
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
                  }`}>
                    {p.is_winner ? "WINNER" : `RANK #${p.rank}`}
                  </span>
                  <p className="text-[10px] text-[var(--ui-text-muted)] mt-1">of {p.total_participants} vendors</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
                Submitted: <span className="font-semibold text-[var(--ui-text-secondary)]">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
