import React from "react";
import { ChevronLeft, Building2, DollarSign, Clock, Upload, CheckCircle2, Info, ShieldCheck, Loader2, CheckSquare, Square, PackageCheck } from "lucide-react";

export function VendorProposalForm({
  selectedRfq,
  form,
  loading,
  error,
  hasSubmittedForSelectedRfq,
  isProcessing,
  isDragging,
  fileInputRef,
  updateForm,
  handleDrag,
  handleDrop,
  handleSubmit,
  onCancel,
}: {
  selectedRfq: any;
  form: any;
  loading: boolean;
  error: string | null;
  hasSubmittedForSelectedRfq: boolean;
  isProcessing: React.MutableRefObject<boolean>;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  updateForm: (k: string, v: any) => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="w-full space-y-4">
      {/* Top back title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-center text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
          aria-label="Back to tender list"
          title="Back to tender list"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">SUBMIT PROPOSAL</span>
          <h2 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)]">{selectedRfq.title}</h2>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] overflow-hidden">
        <div className="p-3.5 px-4 border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] block">TARGET BUYER</span>
              <span className="font-bold text-[var(--ui-text-primary)]">{selectedRfq.company?.name}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] block">PR ID</span>
            <span className="font-mono font-bold text-[var(--ui-text-primary)]">PR-{selectedRfq.id ? String(selectedRfq.id).substring(0, 8).toUpperCase() : ""}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          
          {/* Itemized Price Offers with Item Participation Checklist */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--ui-border)] flex-wrap">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                <DollarSign size={14} className="text-orange-500" /> Penawaran Harga per Barang
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const newItems = form.items.map((it: any) => ({ ...it, is_participating: true }));
                    updateForm("items", newItems);
                  }}
                  className="text-[11px] font-semibold text-orange-500 hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-[var(--ui-text-muted)]">·</span>
                <button
                  type="button"
                  onClick={() => {
                    const newItems = form.items.map((it: any) => ({ ...it, is_participating: false }));
                    updateForm("items", newItems);
                  }}
                  className="text-[11px] font-semibold text-[var(--ui-text-muted)] hover:underline"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 text-xs text-[var(--ui-text-secondary)] flex items-start gap-2">
              <Info size={14} className="text-orange-500 mt-0.5 shrink-0" />
              <span>
                <b>Partisipasi Multi-Barang:</b> Centang hanya barang-barang yang dapat perusahaan Anda sediakan. Anda tidak wajib menawarkan semua barang di RFQ ini.
              </span>
            </div>

            <div className="space-y-2">
              {form.items.map((item: any, idx: number) => {
                const rfqItem = selectedRfq.items?.find((i: any) => i.id === item.rfq_item_id);
                const isParticipating = item.is_participating !== false;
                const unitPrice = parseFloat(item.price_offer) || 0;
                const subtotal = isParticipating ? unitPrice * (rfqItem?.qty || 1) : 0;

                return (
                  <div
                    key={item.rfq_item_id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 flex-wrap ${
                      isParticipating
                        ? "border-orange-500/40 bg-[var(--ui-bg-input)]"
                        : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...form.items];
                          newItems[idx].is_participating = !isParticipating;
                          updateForm("items", newItems);
                        }}
                        className="mt-0.5 text-orange-500 hover:opacity-80 transition shrink-0"
                        title={isParticipating ? "Hapus dari penawaran" : "Ikuti tender untuk barang ini"}
                      >
                        {isParticipating ? <CheckSquare size={16} /> : <Square size={16} className="text-[var(--ui-text-muted)]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[var(--ui-text-primary)]">{item.catalogue?.name}</p>
                          {isParticipating ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500">
                              Ditawarkan
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[var(--ui-border)] text-[var(--ui-text-muted)]">
                              Tidak Ditawarkan
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--ui-text-muted)] font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{item.catalogue?.item_code}</span>
                          <span>·</span>
                          <span className="font-bold text-orange-500">{rfqItem?.qty} Units Requested</span>
                          {rfqItem?.estimated_price > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-[var(--ui-text-secondary)] font-semibold bg-[var(--ui-bg-card)] px-1.5 py-0.5 rounded border border-[var(--ui-border)]">
                                Target Buyer: Rp {Number(rfqItem.estimated_price).toLocaleString()} / unit
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isParticipating && subtotal > 0 && (
                        <div className="text-right hidden sm:block">
                          <span className="text-[9px] font-bold uppercase text-[var(--ui-text-muted)] block">Subtotal</span>
                          <span className="text-xs font-bold text-orange-500">
                            Rp {subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                      <div className="relative w-44">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[var(--ui-text-muted)]">Rp</span>
                        <input
                          value={item.price_offer}
                          disabled={!isParticipating}
                          onChange={e => {
                            const newItems = [...form.items];
                            newItems[idx].price_offer = e.target.value;
                            updateForm("items", newItems);
                          }}
                          type="number"
                          min="0"
                          required={isParticipating}
                          placeholder={isParticipating ? "0" : "Tidak ditawarkan"}
                          className={`w-full pl-7 pr-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none transition ${
                            isParticipating
                              ? "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-primary)] focus:border-orange-400/60"
                              : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-muted)] cursor-not-allowed opacity-50"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Proposal Summary */}
            <div className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-[var(--ui-text-muted)]">
                Barang yang Diikuti:{" "}
                <b className="text-[var(--ui-text-primary)]">
                  {form.items.filter((it: any) => it.is_participating !== false).length} dari {form.items.length} Barang
                </b>
              </span>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] mr-2">Total Nilai Penawaran:</span>
                <span className="text-sm font-extrabold text-orange-500">
                  Rp{" "}
                  {form.items
                    .filter((it: any) => it.is_participating !== false)
                    .reduce((sum: number, it: any) => {
                      const rItem = selectedRfq.items?.find((i: any) => i.id === it.rfq_item_id);
                      return sum + ((parseFloat(it.price_offer) || 0) * (rItem?.qty || 1));
                    }, 0)
                    .toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </section>

          {/* Service Terms & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Service Terms */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--ui-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                <Clock size={14} className="text-orange-500" /> Service Terms
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] block">Lead Time (Days to Delivery)</label>
                  <select value={form.delivery_days} onChange={e => updateForm("delivery_days", e.target.value)} className="w-full p-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60">
                    <option value="3">3 Days (Express)</option>
                    <option value="7">7 Days (Standard)</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] block">Warranty Period (Months)</label>
                  <select value={form.warranty_months} onChange={e => updateForm("warranty_months", e.target.value)} className="w-full p-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60">
                    <option value="0">No Warranty</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)] block">Payment Scheme</label>
                  <select value={form.payment_term} onChange={e => updateForm("payment_term", e.target.value)} className="w-full p-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60">
                    <option value="7 days">Net 7 Days</option>
                    <option value="14 days">Net 14 Days</option>
                    <option value="30 days">Net 30 Days</option>
                    <option value="60 days">Net 60 Days</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Supporting Docs */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--ui-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                <Upload size={14} className="text-orange-500" /> Supporting Documents
              </div>
              <div className="space-y-2">
                <div 
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    isDragging ? "border-orange-500 bg-orange-500/5" : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-400/50"
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={e => updateForm("document", e.target.files?.[0] || null)} className="hidden" />
                  <div className="w-9 h-9 rounded-full bg-[var(--ui-bg-card)] flex items-center justify-center">
                    {form.document ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Upload size={18} className="text-[var(--ui-text-muted)]" />}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[var(--ui-text-primary)] truncate max-w-[200px]">
                      {form.document ? form.document.name : "Drag & Drop Supporting Document"}
                    </p>
                    <p className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">
                      {form.document ? "File ready for upload" : "PDF, JPG, or PNG (Max 5MB)"}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/15 flex items-start gap-2 text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
                  <Info size={13} className="text-orange-500 shrink-0 mt-0.5" />
                  <p><strong>Optional:</strong> Attaching company profile or specifications will increase evaluation score.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-[var(--ui-border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || hasSubmittedForSelectedRfq || isProcessing.current}
              style={(loading || hasSubmittedForSelectedRfq || isProcessing.current) ? {} : { color: 'white' }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                (loading || hasSubmittedForSelectedRfq || isProcessing.current)
                  ? "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] border border-[var(--ui-border)] cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
              }`}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <><ShieldCheck size={13} /> Submit Official Proposal</>}
            </button>
          </div>

          {hasSubmittedForSelectedRfq && (
            <p className="text-xs font-semibold text-amber-500">
              Duplicate submission is not allowed for this RFQ.
            </p>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
