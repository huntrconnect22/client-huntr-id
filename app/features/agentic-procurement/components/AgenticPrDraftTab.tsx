import React from "react";
import { Building, Calendar, ShieldCheck, DollarSign, Loader2, CheckCircle2 } from "lucide-react";

interface AgenticPrDraftTabProps {
  prDraft: any;
  intent: any;
  activeCompanyName?: string;
  isCreatingPr: boolean;
  onCreatePr: () => void;
  formatRupiah: (num: number) => string;
  getTotalBudget: (draft?: any, intent?: any) => number;
}

export default function AgenticPrDraftTab({
  prDraft,
  intent,
  activeCompanyName,
  isCreatingPr,
  onCreatePr,
  formatRupiah,
  getTotalBudget,
}: AgenticPrDraftTabProps) {
  const totalBudget = getTotalBudget(prDraft, intent);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: PR Document */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
          <div className="border-b border-[var(--ui-border)] pb-3">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              Purchase Requisition Draft
            </span>
            <h3 className="text-sm md:text-base font-bold text-[var(--ui-text-primary)] mt-0.5">
              {prDraft.title}
            </h3>
            <div className="flex items-center gap-2.5 mt-1 text-xs text-[var(--ui-text-muted)]">
              <span className="flex items-center gap-1">
                <Building size={11} /> {prDraft.department || "General Procurement"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={11} /> Tender: {prDraft.duration_days || 7} Hari
              </span>
              <span>•</span>
              <span
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                  prDraft.priority === "Urgent"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {prDraft.priority || "Normal"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
              Deskripsi Kebutuhan
            </span>
            <p className="text-xs text-[var(--ui-text-primary)] leading-relaxed bg-[var(--ui-bg-input)] p-3 rounded-md border border-[var(--ui-border)]">
              {prDraft.description}
            </p>
          </div>

          {/* Justification */}
          {prDraft.business_justification && (
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px] flex items-center gap-1">
                <ShieldCheck size={12} className="text-orange-400" />
                Justifikasi Bisnis
              </span>
              <div className="text-xs text-[var(--ui-text-primary)] bg-orange-500/5 p-3 rounded-md border border-orange-500/20">
                {prDraft.business_justification}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
              Line Items ({prDraft.suggested_items?.length || 0})
            </span>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--ui-bg-input)] border-b border-[var(--ui-border)] text-[var(--ui-text-muted)] font-semibold">
                    <th className="px-3 py-2">Item & Spesifikasi</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Harga Satuan</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {prDraft.suggested_items?.map((item: any, idx: number) => {
                    const price = item.estimated_price || 0;
                    const subtotal = (item.qty || 1) * price;
                    const status = item.price_status || (price > 0 ? (item.catalogue_id ? "verified_catalogue" : "buyer_budget") : "rfq_required");

                    return (
                      <tr key={idx} className="hover:bg-[var(--ui-bg-input)]/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--ui-text-primary)]">
                              {item.name}
                            </span>
                            {status === "verified_catalogue" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                ✓ Katalog Terdaftar
                              </span>
                            )}
                            {status === "market_estimate" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                Estimasi Pasar (HPS)
                              </span>
                            )}
                            {status === "buyer_budget" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                Target Pagu Buyer
                              </span>
                            )}
                            {status === "rfq_required" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Butuh Penawaran Vendor
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">
                            {item.detailed_specs || item.reason || "-"}
                          </div>
                          {item.item_code && (
                            <div className="text-[10px] text-[var(--ui-text-muted)] opacity-70 font-mono mt-0.5">
                              Kode: {item.item_code}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium text-[var(--ui-text-primary)]">
                          {item.qty} {item.uom || "unit"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[var(--ui-text-secondary)]">
                          {price > 0 ? (
                            formatRupiah(price)
                          ) : (
                            <span className="text-[11px] text-amber-400 italic">
                              Perlu Penawaran
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-400">
                          {price > 0 ? (
                            formatRupiah(subtotal)
                          ) : (
                            <span className="text-[11px] text-amber-400 font-medium">
                              TBD (Tender)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--ui-bg-input)] font-bold text-[var(--ui-text-primary)]">
                    <td colSpan={3} className="px-3 py-2 text-right">
                      Total Anggaran (IDR):
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-400">
                      {totalBudget > 0 ? (
                        formatRupiah(totalBudget)
                      ) : (
                        <span className="text-amber-400 font-semibold">TBD via Tender RFQ</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="sm:hidden flex flex-col gap-2">
              {prDraft.suggested_items?.map((item: any, idx: number) => {
                const price = item.estimated_price || 0;
                const subtotal = (item.qty || 1) * price;
                const status = item.price_status || (price > 0 ? (item.catalogue_id ? "verified_catalogue" : "buyer_budget") : "rfq_required");

                return (
                  <div key={idx} className="p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex flex-col gap-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[var(--ui-text-primary)] leading-tight">
                        {item.name}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 flex-shrink-0">
                        {item.qty} {item.uom || "unit"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {status === "verified_catalogue" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ✓ Terdaftar
                        </span>
                      )}
                      {status === "market_estimate" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          Estimasi Pasar
                        </span>
                      )}
                      {status === "buyer_budget" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          Pagu Buyer
                        </span>
                      )}
                      {status === "rfq_required" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Butuh Penawaran
                        </span>
                      )}
                    </div>

                    {item.detailed_specs && (
                      <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
                        {item.detailed_specs}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--ui-border)] text-[11px]">
                      <span className="text-[var(--ui-text-muted)]">
                        {price > 0 ? `@ ${formatRupiah(price)}` : "Perlu Penawaran"}
                      </span>
                      <span className="font-bold font-mono text-orange-400">
                        {price > 0 ? formatRupiah(subtotal) : "TBD"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Summary Panel */}
      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
          <span className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={13} className="text-emerald-400" />
            Ringkasan Finansial
          </span>

          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
            <span className="text-[10px] text-emerald-400 font-semibold">Total Estimasi Anggaran</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {totalBudget > 0 ? formatRupiah(totalBudget) : "TBD (Tender RFQ)"}
            </span>
            {totalBudget === 0 && (
              <span className="text-[10px] text-amber-400 mt-0.5">
                Menunggu penawaran harga resmi dari vendor
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 text-xs divide-y divide-[var(--ui-border)]">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">Perusahaan</span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {activeCompanyName || "Buyer"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">Departemen</span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {prDraft.department || "Procurement"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">Pengiriman</span>
              <span className="font-semibold text-[var(--ui-text-primary)] truncate max-w-[150px]">
                {prDraft.delivery_point_recommendation || "Kantor Pusat"}
              </span>
            </div>
          </div>

          <button
            onClick={onCreatePr}
            disabled={isCreatingPr}
            className="w-full mt-1 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCreatingPr ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Buat PR Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
