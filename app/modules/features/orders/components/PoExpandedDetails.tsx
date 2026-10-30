import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Package,
  Clock,
  Loader2,
  Truck,
  ArrowRight,
  CreditCard,
  ReceiptText,
  User,
  Calendar,
  Download,
  MapPin,
  X,
  QrCode,
  FileCheck,
} from "lucide-react";
import { openAuthenticatedDocument } from "../../../lib/open-auth-document";
import { downloadEFakturPdf } from "../../../lib/api/efaktur";
import { getInvoicePaymentBreakdown } from "../lib/paymentBreakdown";

const fmt = (n: number) => n.toLocaleString("id-ID");

const historicalValue = (value?: string | null) =>
  value && value !== "N/A" ? value : "Not recorded in historical data";

interface PoExpandedDetailsProps {
  po: any;
  company: any;
  user: any;
  processingId: string | null;
  issuingBastId: string | null;
  generateQRCode: (text: string) => Promise<string | null>;
  onSign: (
    type: "bast" | "do",
    id: string,
    role: "handed-by" | "received-by",
  ) => Promise<void>;
  onArrangeDelivery: (poId: string, buyerAddress?: string) => void;
  onUpdateTrackingStatus: (
    poId: string,
    status: "packing" | "in_transit" | "delivered",
    currentPoStatus: string,
  ) => void;
  onIssueBast: (poId: string) => void;
  onPayInvoice: (invoice: any) => void;
  onPublishInvoice: (invoiceId: string) => void;
}

export const PoExpandedDetails = ({
  po,
  company,
  user,
  processingId,
  issuingBastId,
  generateQRCode,
  onSign,
  onArrangeDelivery,
  onUpdateTrackingStatus,
  onIssueBast,
  onPayInvoice,
  onPublishInvoice,
}: PoExpandedDetailsProps) => {
  const [activeModal, setActiveModal] = useState<
    "do" | "bast" | "efaktur" | null
  >(null);
  const [downloadingEfakturId, setDownloadingEfakturId] = useState<string | null>(null);
  const [efakturDownloadError, setEfakturDownloadError] = useState("");

  const isDirectPurchase = po.procurement_mode === "direct";
  const includesServices = ["services", "mixed"].includes(po.procurement_type);
  const steps = isDirectPurchase
    ? [
        { key: "issued", label: "PO Issued", icon: FileText },
        { key: "confirmed", label: "Vendor Confirmed", icon: CheckCircle2 },
        { key: "in_transit", label: "Goods Dispatched", icon: Truck },
        { key: "delivered", label: "Received", icon: CheckCircle2 },
      ]
    : [
        { key: "issued", label: "PO Issued", icon: FileText },
        { key: "confirmed", label: "PO Confirmed", icon: CheckCircle2 },
        { key: "paid", label: "Payment Received", icon: CreditCard },
        { key: "packing", label: "Packing", icon: Package },
        { key: "in_transit", label: "In Transit", icon: Truck },
        { key: "delivered", label: "Delivered", icon: CheckCircle2 },
      ];

  const statusOrder = isDirectPurchase
    ? ["issued", "confirmed", "in_transit", "delivered"]
    : [
        "issued",
        "published",
        "confirmed",
        "paid",
        "packing",
        "in_transit",
        "delivery",
        "delivered",
        "completed",
        "done",
      ];
  const currentIdx = statusOrder.indexOf(po.status);
  const isReached = (stepKey: string) => {
    const stepIdx = statusOrder.indexOf(stepKey);
    return stepIdx !== -1 && currentIdx >= stepIdx;
  };
  const timelineMap: Record<string, any> = {};
  (po.tracking_timeline || []).forEach((entry: any) => {
    timelineMap[entry.status] = entry;
  });

  const displayedInvoice =
    po.invoices?.find((i: any) => i.type === "final") ||
    po.invoices?.find((i: any) => i.type === "proforma");
  const displayedInvoiceTotal = displayedInvoice
    ? getInvoicePaymentBreakdown(displayedInvoice).total
    : 0;
  const isManager = user?.role === "manager" || company?.owner_id === user?.id;
  const isVendor = company?.type === "vendor";
  const isBuyer = company?.type === "buyer";

  const handleDownloadEfakturPdf = async (efaktur: any) => {
    setDownloadingEfakturId(efaktur.id);
    setEfakturDownloadError("");
    try {
      const response = await downloadEFakturPdf(efaktur.id);
      const base64 = response?.pdf?.data?.arraybuff;
      if (!base64) {
        throw new Error(response?.pdf?.MsgStatus || "PDF belum tersedia. Pastikan e-Faktur telah disetujui.");
      }
      const content = base64.replace(/^data:application\/pdf;base64,/, "");
      const bytes = Uint8Array.from(atob(content), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `efaktur-${efaktur.nofa || efaktur.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error: any) {
      setEfakturDownloadError(error?.message || "PDF e-Faktur tidak dapat diunduh.");
    } finally {
      setDownloadingEfakturId(null);
    }
  };

  return (
    <div className="p-4 bg-[var(--ui-bg-input)] border-t border-[var(--ui-border)] space-y-4">
      {/* ── Order Progress Stepper ── */}
      <div className="bg-[var(--ui-bg-card)] p-3 rounded-xl border border-[var(--ui-border)] space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
          <span>
            {isDirectPurchase ? "Direct purchase progress" : "Order Timeline"}
          </span>
          {company?.type === "vendor" && (
            <a
              href="/track"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline flex items-center gap-1"
            >
              <MapPin size={11} /> Public Tracking
            </a>
          )}
        </div>
        {isDirectPurchase && (
          <p className="text-xs text-[var(--ui-text-muted)]">
            Buyer records vendor confirmation, dispatch, and receipt for this
            direct PO.
          </p>
        )}

        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const done = isReached(step.key);
            const entry = timelineMap[step.key];

            return (
              <div
                key={step.key}
                className="flex-1 flex flex-col items-center min-w-[70px] text-center"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    done
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-muted)]"
                  }`}
                >
                  {done ? <StepIcon size={12} /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-1 leading-tight ${done ? "text-[var(--ui-text-primary)]" : "text-[var(--ui-text-muted)]"}`}
                >
                  {step.label}
                </span>
                {entry?.timestamp && (
                  <span className="text-[9px] text-[var(--ui-text-muted)] mt-0.5">
                    {Number.isNaN(new Date(entry.timestamp).getTime())
                      ? "Date not recorded"
                      : new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {includesServices && (
        <section className="border-l-2 border-orange-500 bg-orange-500/5 px-3 py-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-bold text-[var(--ui-text-primary)]">Service delivery & acceptance</p><p className="mt-0.5 text-[var(--ui-text-muted)]">Layanan diterima melalui BAST setelah deliverable memenuhi kriteria, bukan melalui Goods Receipt.</p></div>
            <span className="border border-orange-500/30 px-2 py-1 font-semibold text-orange-600">{po.procurement_type === "mixed" ? "Goods + services" : "Services"}</span>
          </div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3"><div><dt className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">Period</dt><dd className="mt-0.5 text-[var(--ui-text-primary)]">{po.service_start_date || "—"} — {po.service_end_date || "—"}</dd></div><div><dt className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">Location</dt><dd className="mt-0.5 text-[var(--ui-text-primary)]">{po.service_location || po.delivery_point || "—"}</dd></div><div><dt className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">Acceptance criteria</dt><dd className="mt-0.5 text-[var(--ui-text-primary)]">{po.acceptance_criteria || "Refer to PR scope and BAST."}</dd></div></dl>
        </section>
      )}

      {/* ── Quick Action Badges / Modals Trigger Bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* DO Trigger */}
        <HuntrButton
          onClick={() => setActiveModal("do")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
        >
          <Package size={13} className="text-blue-500" />
          <span>Delivery Orders ({po.delivery_orders?.length || 0})</span>
        </HuntrButton>

        {/* BAST Trigger */}
        <HuntrButton
          onClick={() => setActiveModal("bast")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
        >
          <FileCheck size={13} className="text-orange-500" />
          <span>BAST Documents ({po.basts?.length || 0})</span>
        </HuntrButton>

        {/* E-Faktur Trigger */}
        <HuntrButton
          onClick={() => setActiveModal("efaktur")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
        >
          <FileText size={13} className="text-emerald-500" />
          <span>E-Faktur Pajak ({po.efakturs?.length || 0})</span>
        </HuntrButton>

        {/* Print PO */}
        <HuntrButton
          type="button"
          onClick={() => void openAuthenticatedDocument(`/api/orders/${po.id}/print`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-orange-500 hover:bg-orange-500/5 transition-all ml-auto"
        >
          <FileText size={13} /> Print PO
        </HuntrButton>
      </div>

      {/* ── Grid: Classification & Invoice Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Classification & Identity */}
        <div className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
            PO Classification & Info
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[var(--ui-text-muted)] block text-[10px]">
                Issued By
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {historicalValue(po.created_by)}
              </span>
            </div>
            <div>
              <span className="text-[var(--ui-text-muted)] block text-[10px]">
                Approved By
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {historicalValue(po.approved_by)}
              </span>
            </div>
            <div>
              <span className="text-[var(--ui-text-muted)] block text-[10px]">
                Category / Type
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {historicalValue(po.purchase_category)} •{" "}
                {historicalValue(po.purchase_type)}
              </span>
            </div>
            <div>
              <span className="text-[var(--ui-text-muted)] block text-[10px]">
                Department
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {historicalValue(po.department)}
              </span>
            </div>
          </div>
          {po.delivery_point && (
            <div className="text-xs pt-1 border-t border-[var(--ui-border)]">
              <span className="text-[var(--ui-text-muted)] block text-[10px]">
                Delivery Point
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)] line-clamp-1">
                {po.delivery_point}
              </span>
            </div>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Related Invoice
            </span>
            {displayedInvoice && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-500">
                {displayedInvoice.type === "final"
                  ? "Invoice Akhir"
                  : "Proforma Invoice"}
              </span>
            )}
          </div>

          {displayedInvoice ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ui-text-muted)]">
                  Invoice Total
                </span>
                <span className="font-bold text-orange-500 text-sm">
                  IDR{" "}
                  {fmt(displayedInvoiceTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ui-text-muted)]">Status</span>
                <span className="font-semibold uppercase text-[10px] text-[var(--ui-text-secondary)]">
                  {displayedInvoice.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--ui-border)]">
                <HuntrButton
                  type="button"
                  onClick={() => void openAuthenticatedDocument(`/api/invoices/${displayedInvoice.id}/print`)}
                  className="text-xs font-semibold text-orange-500 hover:underline flex items-center gap-1"
                >
                  <FileText size={12} /> Print Invoice
                </HuntrButton>
                {displayedInvoice.status === "unpaid" &&
                  company?.type === "buyer" && (
                    <HuntrButton
                      onClick={() => onPayInvoice(displayedInvoice)}
                      style={{ color: "white" }}
                      className="ml-auto px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold transition-all"
                    >
                      Bayar Sekarang
                    </HuntrButton>
                  )}
                {displayedInvoice.type === "final" &&
                  displayedInvoice.status === "draft" &&
                  company?.type === "vendor" && (
                    <HuntrButton
                      onClick={() => onPublishInvoice(displayedInvoice.id)}
                      disabled={processingId === displayedInvoice.id}
                      style={{ color: "white" }}
                      className="ml-auto px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold transition-all"
                    >
                      Terbitkan Invoice
                    </HuntrButton>
                  )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--ui-text-muted)] italic py-2">
              {po.status === "confirmed"
                ? "Generating invoice data..."
                : "Invoice will be available after vendor confirms PO."}
            </p>
          )}
        </div>
      </div>

      {/* ── Item Breakdown Table ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
          <span>Item Breakdown</span>
          <span>{po.items?.length || 0} items</span>
        </div>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)]">
          <HuntrTable className="w-full text-xs text-left">
            <HuntrTableHead>
              <HuntrTableRow className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] font-bold text-[10px] uppercase">
                <HuntrTableHeaderCell className="p-2.5 w-8 text-center">#</HuntrTableHeaderCell>
                <HuntrTableHeaderCell className="p-2.5">Item Name & Code</HuntrTableHeaderCell>
                <HuntrTableHeaderCell className="p-2.5">Qty</HuntrTableHeaderCell>
                <HuntrTableHeaderCell className="p-2.5">Unit Price</HuntrTableHeaderCell>
                <HuntrTableHeaderCell className="p-2.5 text-right">Subtotal</HuntrTableHeaderCell>
              </HuntrTableRow>
            </HuntrTableHead>
            <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
              {po.items?.length ? (
                po.items.map((item: any, idx: number) => (
                  <HuntrTableRow key={idx}>
                    <HuntrTableCell className="p-2.5 text-center text-[var(--ui-text-muted)]">
                      {idx + 1}
                    </HuntrTableCell>
                    <HuntrTableCell className="p-2.5">
                      <p className="font-semibold text-[var(--ui-text-primary)]">
                        {item.inventory_name}
                      </p>
                      <p className="text-[10px] text-[var(--ui-text-muted)] font-mono">
                        {item.inventory_code || "NO-CODE"}
                      </p>
                    </HuntrTableCell>
                    <HuntrTableCell className="p-2.5 font-bold text-orange-500">
                      {item.qty} {item.uom}
                    </HuntrTableCell>
                    <HuntrTableCell className="p-2.5 text-[var(--ui-text-secondary)]">
                      {fmt(Number(item.unit_price))}
                    </HuntrTableCell>
                    <HuntrTableCell className="p-2.5 text-right font-semibold text-[var(--ui-text-primary)] tabular-nums">
                      {fmt(Number(item.total_amount))}
                    </HuntrTableCell>
                  </HuntrTableRow>
                ))
              ) : (
                <HuntrTableRow>
                  <HuntrTableCell
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-[var(--ui-text-muted)]"
                  >
                    No line item data was found in this restored historical PO.
                  </HuntrTableCell>
                </HuntrTableRow>
              )}
            </HuntrTableBody>
          </HuntrTable>
        </div>
      </div>

      {/* ── MODALS (DO, BAST, E-FAKTUR) ── */}

      {/* DO Modal */}
      {activeModal === "do" && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <h3 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                <Package size={16} className="text-blue-500" /> Delivery Orders
                (DO)
              </h3>
              <HuntrButton
                onClick={() => setActiveModal(null)}
                className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
              >
                <X size={16} />
              </HuntrButton>
            </div>

            {po.delivery_orders && po.delivery_orders.length > 0 ? (
              <div className="space-y-3">
                {po.delivery_orders.map((doItem: any) => (
                  <div
                    key={doItem.id}
                    className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-500">
                        {doItem.do_number}
                      </span>
                      <HuntrButton
                        type="button"
                        onClick={() => void openAuthenticatedDocument(`/api/do/${doItem.id}/print`)}
                        className="text-[10px] font-semibold text-orange-500 hover:underline"
                      >
                        Print DO
                      </HuntrButton>
                    </div>
                    {doItem.tracking_number && (
                      <p className="text-[var(--ui-text-muted)] text-[11px]">
                        Resi / Tracking:{" "}
                        <span className="font-mono text-[var(--ui-text-primary)]">
                          {doItem.tracking_number}
                        </span>
                      </p>
                    )}
                    {doItem.delivery_address && (
                      <p className="text-[var(--ui-text-muted)] text-[11px]">
                        Delivery Point: {doItem.delivery_address}
                      </p>
                    )}

                    {/* Signature Status Row */}
                    <div className="pt-2 border-t border-[var(--ui-border)] grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
                        <span className="text-[10px] text-[var(--ui-text-muted)] block">
                          Vendor Signature
                        </span>
                        {doItem.handed_by_signed_at ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} /> Signed
                          </span>
                        ) : (
                          <HuntrButton
                            onClick={() => onSign("do", doItem.id, "handed-by")}
                            disabled={
                              processingId === doItem.id ||
                              !isVendor ||
                              !isManager
                            }
                            style={
                              isVendor && isManager ? { color: "white" } : {}
                            }
                            className="mt-1 w-full py-1 rounded bg-orange-500 hover:bg-orange-600 text-[10px] font-bold disabled:opacity-40"
                          >
                            Sign
                          </HuntrButton>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
                        <span className="text-[10px] text-[var(--ui-text-muted)] block">
                          Buyer Signature
                        </span>
                        {doItem.received_by_signed_at ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} /> Signed
                          </span>
                        ) : (
                          <HuntrButton
                            onClick={() =>
                              onSign("do", doItem.id, "received-by")
                            }
                            disabled={
                              processingId === doItem.id ||
                              !isBuyer ||
                              !isManager
                            }
                            style={
                              isBuyer && isManager ? { color: "white" } : {}
                            }
                            className="mt-1 w-full py-1 rounded bg-orange-500 hover:bg-orange-600 text-[10px] font-bold disabled:opacity-40"
                          >
                            Sign
                          </HuntrButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ui-text-muted)] text-center py-6">
                No Delivery Orders issued for this PO.
              </p>
            )}
          </div>
        </div>
      )}

      {/* BAST Modal */}
      {activeModal === "bast" && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <h3 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                <FileCheck size={16} className="text-orange-500" /> BAST
                Documents
              </h3>
              <HuntrButton
                onClick={() => setActiveModal(null)}
                className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
              >
                <X size={16} />
              </HuntrButton>
            </div>

            {/* Issue BAST Button */}
            {isVendor &&
              ["delivered", "completed", "done", "paid"].includes(po.status) &&
              (!po.basts || po.basts.length === 0) && (
                <HuntrButton
                  onClick={() => onIssueBast(po.id)}
                  disabled={issuingBastId === po.id}
                  style={{ color: "white" }}
                  className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {issuingBastId === po.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Issue BAST (Auto-Generated)
                </HuntrButton>
              )}

            {po.basts && po.basts.length > 0 ? (
              <div className="space-y-3">
                {po.basts.map((bast: any) => (
                  <div
                    key={bast.id}
                    className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-500">
                        {bast.bast_number}
                      </span>
                      <HuntrButton
                        type="button"
                        onClick={() => void openAuthenticatedDocument(`/api/basts/${bast.id}/pdf`)}
                        className="text-[10px] font-semibold text-orange-500 hover:underline"
                      >
                        View BAST PDF
                      </HuntrButton>
                    </div>
                    <p className="text-[var(--ui-text-muted)] text-[11px]">
                      Date: {bast.bast_date} • Issued by:{" "}
                      {bast.handed_by_name || "N/A"}
                    </p>

                    {/* Signature Status Row */}
                    <div className="pt-2 border-t border-[var(--ui-border)] grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
                        <span className="text-[10px] text-[var(--ui-text-muted)] block">
                          Vendor Signature
                        </span>
                        {bast.handed_by_signed_at ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} /> Signed
                          </span>
                        ) : (
                          <HuntrButton
                            onClick={() => onSign("bast", bast.id, "handed-by")}
                            disabled={
                              processingId === bast.id ||
                              !isVendor ||
                              !isManager
                            }
                            style={
                              isVendor && isManager ? { color: "white" } : {}
                            }
                            className="mt-1 w-full py-1 rounded bg-orange-500 hover:bg-orange-600 text-[10px] font-bold disabled:opacity-40"
                          >
                            Sign
                          </HuntrButton>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
                        <span className="text-[10px] text-[var(--ui-text-muted)] block">
                          Buyer Signature
                        </span>
                        {bast.received_by_signed_at ? (
                          <span className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 size={12} /> Signed
                          </span>
                        ) : (
                          <HuntrButton
                            onClick={() =>
                              onSign("bast", bast.id, "received-by")
                            }
                            disabled={
                              processingId === bast.id || !isBuyer || !isManager
                            }
                            style={
                              isBuyer && isManager ? { color: "white" } : {}
                            }
                            className="mt-1 w-full py-1 rounded bg-orange-500 hover:bg-orange-600 text-[10px] font-bold disabled:opacity-40"
                          >
                            Sign
                          </HuntrButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ui-text-muted)] text-center py-6">
                No BAST documents issued for this PO yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* E-Faktur Modal */}
      {activeModal === "efaktur" && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <h3 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" /> E-Faktur
                Pajak
              </h3>
              <HuntrButton
                onClick={() => setActiveModal(null)}
                className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
              >
                <X size={16} />
              </HuntrButton>
            </div>

            {po.efakturs && po.efakturs.length > 0 ? (
              <div className="space-y-3">
                {efakturDownloadError && (
                  <p className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                    {efakturDownloadError}
                  </p>
                )}
                {po.efakturs.map((ef: any) => (
                  <div
                    key={ef.id}
                    className="p-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-500">
                        {ef.nofa || "NOFA PENDING"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        {ef.status}
                      </span>
                    </div>
                    <p className="text-[var(--ui-text-muted)] text-[11px]">
                      Date: {ef.tanggal_faktur}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--ui-border)] text-[11px]">
                      <span>DPP: Rp {fmt(Number(ef.dpp || 0))}</span>
                      <span>PPN: Rp {fmt(Number(ef.ppn || 0))}</span>
                    </div>
                    {String(ef.status || "").toUpperCase() === "APPROVED" ? (
                      <HuntrButton
                        type="button"
                        onClick={() => void handleDownloadEfakturPdf(ef)}
                        disabled={downloadingEfakturId === ef.id}
                        className="inline-flex w-full items-center justify-center gap-1.5 border border-[var(--ui-border-input)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)] disabled:cursor-wait disabled:opacity-60"
                      >
                        {downloadingEfakturId === ef.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        {downloadingEfakturId === ef.id ? "Menyiapkan PDF…" : "Unduh PDF e-Faktur"}
                      </HuntrButton>
                    ) : (
                      <p className="text-[10px] text-[var(--ui-text-muted)]">PDF tersedia setelah e-Faktur disetujui.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ui-text-muted)] text-center py-6">
                No e-Faktur issued yet. Generated automatically after BAST is
                signed.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


