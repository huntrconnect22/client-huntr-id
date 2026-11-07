import React, { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Printer,
} from "lucide-react";
import Swal from "sweetalert2";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import {
  CatalogueSkuInput,
  PickerBrowseButton,
} from "../features/WmsPickerFields";
import { formatQuantity, toNumeric } from "../data/quantity";
import {
  Table as HuntrTable,
  TableBody as HuntrTableBody,
  TableCell as HuntrTableCell,
  TableHead as HuntrTableHead,
  TableHeaderCell as HuntrTableHeaderCell,
  TableRow as HuntrTableRow,
} from "~/shared/ui/Table";
import {
  importExistingGoodsReceipts,
  putAwayStock,
  receiveStock,
} from "~/modules/shared/api/wms";

interface Props {
  cardClass: string;
  inputClass: string;
  receivingBinItems: any[];
  warehouses: any[];
  receiveForm: {
    warehouse_id: string;
    purchase_order_id: string;
    catalogue_id: string;
    sku: string;
    item_name: string;
    quantity: string;
    bin_location: string;
    rejected_quantity: string;
    condition: string;
    inspection_notes: string;
  };
  setReceiveForm: React.Dispatch<React.SetStateAction<any>>;
  receiveLines: any[];
  setReceiveLines: React.Dispatch<React.SetStateAction<any[]>>;
  putawayForm: {
    warehouse_id: string;
    sku: string;
    from_bin_id: string;
    to_bin_id: string;
    quantity: string;
  };
  setPutawayForm: React.Dispatch<React.SetStateAction<any>>;
  selections: Record<string, any>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openPicker: (kind: any) => void;
  company: any;
  run: (fn: () => Promise<any>) => void;
  busy: boolean;
  receipts: any[];
  catalogue: any[];
  cataloguePickerItems: any[];
  setError: (err: string | null) => void;
}

export function WmsReceivingTab({
  cardClass,
  inputClass,
  receivingBinItems,
  warehouses,
  receiveForm,
  setReceiveForm,
  receiveLines,
  setReceiveLines,
  putawayForm,
  setPutawayForm,
  selections,
  setSelections,
  openPicker,
  company,
  run,
  busy,
  receipts,
  catalogue,
  cataloguePickerItems,
  setError,
}: Props) {
  const [receiveKey, setReceiveKey] = useState(() => crypto.randomUUID());
  const [receiptLineNotice, setReceiptLineNotice] = useState("");

  const buildReceiveLine = () => {
    if (
      (!receiveForm.catalogue_id && !receiveForm.sku) ||
      !Number(receiveForm.quantity)
    ) {
      throw new Error("Select an item and enter its received quantity first.");
    }

    const receivedQuantity = Number(receiveForm.quantity);
    const rejectedQuantity = Number(receiveForm.rejected_quantity || 0);
    if (rejectedQuantity > receivedQuantity) {
      throw new Error("Rejected quantity cannot exceed received quantity.");
    }

    return {
      ...(receiveForm.catalogue_id
        ? { catalogue_id: receiveForm.catalogue_id }
        : { sku: receiveForm.sku }),
      item_name: receiveForm.item_name || undefined,
      received_quantity: receivedQuantity,
      accepted_quantity: receivedQuantity - rejectedQuantity,
      rejected_quantity: rejectedQuantity,
      condition: receiveForm.condition,
      inspection_notes: receiveForm.inspection_notes || undefined,
    };
  };

  const clearReceiveLine = () => {
    setReceiveForm({
      ...receiveForm,
      catalogue_id: "",
      sku: "",
      item_name: "",
      quantity: "",
      rejected_quantity: "0",
      condition: "good",
      inspection_notes: "",
    });
  };

  const hasReceiveLineInput = Boolean(
    receiveForm.catalogue_id ||
      receiveForm.sku ||
      receiveForm.item_name ||
      receiveForm.quantity,
  );

  const readyReceiveLineCount =
    receiveLines.length +
    ((receiveForm.catalogue_id || receiveForm.sku) &&
    Number(receiveForm.quantity)
      ? 1
      : 0);

  const printGrn = (receipt: any) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Pop-up diblokir browser. Izinkan pop-up untuk mencetak GRN.");
      return;
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const lines = receipt.lines || [];
    const rows = lines
      .map(
        (line: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(line.item_name)}</strong><br /><small>${escapeHtml(line.sku)}</small></td>
            <td>${escapeHtml(line.uom)}</td>
            <td>${formatQuantity(line.received_quantity)}</td>
            <td>${formatQuantity(line.accepted_quantity)}</td>
            <td>${formatQuantity(line.rejected_quantity)}</td>
            <td>${escapeHtml(line.condition)}</td>
          </tr>`,
      )
      .join("");
    const totalReceived = lines.reduce(
      (total: number, line: any) => total + Number(line.received_quantity || 0),
      0,
    );
    const totalAccepted = lines.reduce(
      (total: number, line: any) => total + Number(line.accepted_quantity || 0),
      0,
    );
    const totalRejected = lines.reduce(
      (total: number, line: any) => total + Number(line.rejected_quantity || 0),
      0,
    );

    printWindow.document.write(`<!doctype html>
      <html><head><title>GRN ${escapeHtml(receipt.receipt_number)}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { color: #172033; font: 12px Arial, sans-serif; margin: 0; }
        header { border-bottom: 2px solid #ef7d00; display: flex; justify-content: space-between; padding-bottom: 14px; }
        h1 { font-size: 21px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 24px 0 8px; }
        .muted { color: #65758b; } .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; margin-top: 18px; }
        .meta b { display: block; font-size: 10px; color: #65758b; text-transform: uppercase; }
        table { border-collapse: collapse; margin-top: 12px; width: 100%; } th, td { border: 1px solid #d9e0ea; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f5f7fa; font-size: 10px; text-transform: uppercase; } tfoot td { font-weight: bold; background: #f9fafb; }
        footer { border-top: 1px solid #d9e0ea; color: #65758b; display: flex; justify-content: space-between; margin-top: 42px; padding-top: 12px; }
      </style></head><body>
        <header><div><h1>Goods Received Note</h1><div class="muted">Huntr WMS &amp; Inventory</div></div><div><b>GRN NO.</b><br /><strong>${escapeHtml(receipt.receipt_number)}</strong></div></header>
        <section class="meta">
          <div><b>Company</b>${escapeHtml(company?.name)}</div>
          <div><b>Warehouse</b>${escapeHtml(receipt.warehouse_name)}</div>
          <div><b>Reference / PO</b>${escapeHtml(receipt.reference)}</div>
          <div><b>Received at</b>${receipt.received_at ? escapeHtml(new Date(receipt.received_at).toLocaleString("id-ID")) : "—"}</div>
          <div><b>Status</b>${escapeHtml(receipt.status)}</div>
          <div><b>Received by</b>${escapeHtml(receipt.received_by)}</div>
        </section>
        <h2>Received items</h2>
        <table><thead><tr><th>#</th><th>Item / SKU</th><th>UoM</th><th>Received</th><th>Accepted</th><th>Rejected</th><th>Condition</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No receipt lines.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3">Total</td><td>${formatQuantity(totalReceived)}</td><td>${formatQuantity(totalAccepted)}</td><td>${formatQuantity(totalRejected)}</td><td></td></tr></tfoot></table>
        <footer><span>Generated ${escapeHtml(new Date().toLocaleString("id-ID"))}</span><span>GRN is system generated.</span></footer>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
      </body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <WmsWorkflowGuide
        title="Inbound flow: receive, inspect, then store"
        description="Goods first enter Receiving. Only accepted quantity increases inventory; put away moves it to a storage or picking bin."
        steps={[
          "Select warehouse and PO",
          "Add and inspect lines",
          "Confirm receipt",
          "Put away accepted stock",
        ]}
      />
      {/* Staging / Receiving Bin Queue Status */}
      <div className={cardClass + " border-blue-500/30 bg-blue-500/5 p-4"}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
              <ArrowDownToLine size={16} />
            </span>
            <div>
              <h4 className="font-bold text-sm text-[var(--ui-text-primary)]">
                Area Penerimaan (Staging Menunggu Put Away)
              </h4>
              <p className="text-xs text-[var(--ui-text-muted)]">
                Barang yang baru diterima ditampung di area Receiving sebelum dipindahkan ke rak penyimpanan tetap
              </p>
            </div>
          </div>
          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-500">
            {receivingBinItems.length} SKU di Receiving
          </span>
        </div>
        {receivingBinItems.length > 0 ? (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {receivingBinItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs text-[var(--ui-text-primary)] truncate">
                    {item.item_name}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--ui-text-brand)]">
                    {item.sku}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                    Gudang: <strong>{item.warehouse_name}</strong> · Jumlah:{" "}
                    <strong className="text-blue-500">
                      {formatQuantity(item.on_hand)} {item.uom || "unit"}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPutawayForm((prev: any) => ({
                      ...prev,
                      warehouse_id: String(item.warehouse_id),
                      sku: item.sku,
                      quantity: String(
                        toNumeric(item.on_hand) - toNumeric(item.allocated),
                      ),
                      from_bin_id: String(item.bin_id || ""),
                    }));
                    setSelections((prev) => ({
                      ...prev,
                      putaway_warehouse: warehouses.find(
                        (w: any) => String(w.id) === String(item.warehouse_id),
                      )
                        ? {
                            id: String(item.warehouse_id),
                            title: item.warehouse_name,
                            subtitle: "",
                          }
                        : null,
                      putaway_sku: {
                        id: String(item.id),
                        sku: item.sku,
                        item_name: item.item_name,
                        warehouse_name: item.warehouse_name,
                        bin_location: item.bin_location,
                      } as any,
                    }));
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--ui-text-brand)] px-2.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                >
                  Put Away <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>Area Receiving bersih · Semua barang masuk sudah dipindahkan ke rak penyimpanan.</span>
          </div>
        )}
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <form
          className={cardClass + " space-y-3 p-3.5"}
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const lines = hasReceiveLineInput
                ? [...receiveLines, buildReceiveLine()]
                : receiveLines;
              if (!lines.length) {
                throw new Error(
                  "Select an item and enter its received quantity first.",
                );
              }
              await receiveStock(company.id, {
                warehouse_id: receiveForm.warehouse_id,
                purchase_order_id:
                  receiveForm.purchase_order_id || undefined,
                idempotency_key: receiveKey,
                reference: receiveForm.bin_location || undefined,
                lines,
              });
              setReceiveForm({
                ...receiveForm,
                purchase_order_id: "",
                catalogue_id: "",
                sku: "",
                item_name: "",
                quantity: "",
                bin_location: "",
                rejected_quantity: "0",
                condition: "good",
                inspection_notes: "",
              });
              setReceiveKey(crypto.randomUUID());
              setReceiveLines([]);
              setReceiptLineNotice(
                "Receipt confirmed and sent to the receiving bin.",
              );
            });
          }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowDownToLine size={15} className="text-emerald-500" />
              </span>
              <div>
                <h3 className="font-bold text-[var(--ui-text-primary)]">Penerimaan Barang Masuk</h3>
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Konfirmasi langsung atau tambah baris jika satu pengiriman memuat beberapa item.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-[10px] font-bold tracking-wider text-[var(--ui-text-muted)] uppercase">
              DRAFT
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <PickerBrowseButton
              label="Warehouse"
              placeholder="Select warehouse"
              selected={selections["receive_warehouse"] || null}
              onClick={() => openPicker("receive_warehouse")}
            />
            <PickerBrowseButton
              label="Purchase order"
              placeholder="No linked purchase order (optional)"
              selected={selections["receive_po"] || null}
              onClick={() => openPicker("receive_po")}
            />
          </div>
          <div className="space-y-2 border-t border-[var(--ui-border)] pt-3">
            <p className="text-[10px] font-bold tracking-wider text-[var(--ui-text-muted)] uppercase">
              Item and inspection
            </p>
            <CatalogueSkuInput
              label="Product variant / SKU"
              placeholder="Type SKU or browse Huntr Catalogue"
              helperText="Browse opens the catalogue modal. You can still type any SKU that is not listed."
              value={receiveForm.sku}
              onBrowse={() => openPicker("receive_catalogue_sku")}
              onValueChange={(sku) => {
                const item = catalogue.find(
                  (x: any) =>
                    String(x.item_code).toLowerCase() ===
                    sku.trim().toLowerCase(),
                );
                setReceiveForm({
                  ...receiveForm,
                  catalogue_id: item ? String(item.id) : "",
                  sku,
                  item_name: item?.name || receiveForm.item_name,
                });
                setSelections((prev) => {
                  if (!item) {
                    return { ...prev, receive_catalogue_sku: null };
                  }
                  const pickerItem = cataloguePickerItems.find(
                    (p) => p.id === String(item.id),
                  );
                  return {
                    ...prev,
                    receive_catalogue_sku: pickerItem ?? null,
                  };
                });
              }}
            />
            {receiveForm.sku && (
              <p className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-input)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
                Selected SKU identity:{" "}
                <span className="font-mono font-semibold">
                  {receiveForm.sku}
                </span>
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <PickerBrowseButton
                label="Inspection condition"
                placeholder="Select condition"
                selected={selections["receive_condition"] || null}
                onClick={() => openPicker("receive_condition")}
              />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Inspection notes
                </div>
                <input
                  className={inputClass}
                  placeholder="Inspection notes"
                  value={receiveForm.inspection_notes}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      inspection_notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <input
              required={!receiveForm.catalogue_id}
              className={inputClass}
              placeholder="Item name (required for a new SKU)"
              value={receiveForm.item_name}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  item_name: e.target.value,
                })
              }
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Delivered quantity
                </div>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  className={inputClass}
                  placeholder="Delivered units"
                  value={receiveForm.quantity}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      quantity: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Rejected quantity
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className={inputClass}
                  placeholder="Rejected units"
                  value={receiveForm.rejected_quantity}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      rejected_quantity: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Bin location / note
                </div>
                <input
                  className={inputClass}
                  placeholder="Staging / receiving note"
                  value={receiveForm.bin_location}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      bin_location: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          {receiptLineNotice && (
            <p className="border-l-2 border-emerald-500 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              {receiptLineNotice}
            </p>
          )}
          {receiveLines.length > 0 && (
            <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/30 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--ui-border)] px-3 py-2">
                <p className="font-semibold">Ready to receive</p>
                <span className="font-mono text-[var(--ui-text-brand)]">
                  {receiveLines.length} line
                  {receiveLines.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="divide-y divide-[var(--ui-border)] px-3">
                {receiveLines.map((line, index) => (
                  <div
                    key={`${line.sku || line.catalogue_id}-${index}`}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate font-mono text-[var(--ui-text-secondary)]">
                      {line.sku || line.catalogue_id}
                    </span>
                    <span className="ml-auto shrink-0 tabular-nums text-[var(--ui-text-muted)]">
                      {formatQuantity(line.accepted_quantity)} accepted
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReceiveLines(
                          receiveLines.filter((_, i) => i !== index),
                        )
                      }
                      className="shrink-0 text-[var(--ui-text-muted)] hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] px-3 py-2">
                <span className="text-[var(--ui-text-muted)]">
                  Accepted total
                </span>
                <strong className="tabular-nums">
                  {formatQuantity(
                    receiveLines.reduce(
                      (sum, line) =>
                        sum + Number(line.accepted_quantity || 0),
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-3">
            <button
              type="button"
              onClick={() => {
                try {
                  const line = buildReceiveLine();
                  setReceiveLines([...receiveLines, line]);
                  setReceiptLineNotice(
                    `Receipt line added. ${receiveLines.length + 1} line(s) ready to confirm.`,
                  );
                  clearReceiveLine();
                } catch (lineError: any) {
                  setError(
                    lineError.message ||
                      "Select an item and enter its received quantity first.",
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
            >
              + Add receipt line
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : null}
              {busy
                ? "Confirming receipt…"
                : `Confirm receiving (${readyReceiveLineCount})`}
            </button>
          </div>
        </form>
        <form
          className={cardClass + " space-y-3"}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!putawayForm.warehouse_id) {
              await Swal.fire({
                icon: "warning",
                title: "Pilih Gudang",
                text: "Silakan pilih gudang terlebih dahulu.",
                confirmButtonColor: "#f97316",
              });
              return;
            }
            if (!putawayForm.sku) {
              await Swal.fire({
                icon: "warning",
                title: "Pilih Item",
                text: "Silakan pilih item inventori yang akan dipindahkan.",
                confirmButtonColor: "#f97316",
              });
              return;
            }
            if (!putawayForm.quantity || Number(putawayForm.quantity) <= 0) {
              await Swal.fire({
                icon: "warning",
                title: "Jumlah Tidak Valid",
                text: "Masukkan jumlah unit yang valid (lebih dari 0).",
                confirmButtonColor: "#f97316",
              });
              return;
            }
            if (!putawayForm.from_bin_id) {
              await Swal.fire({
                icon: "warning",
                title: "Pilih Bin Asal",
                text: "Silakan pilih bin asal (from bin).",
                confirmButtonColor: "#f97316",
              });
              return;
            }
            if (!putawayForm.to_bin_id) {
              await Swal.fire({
                icon: "warning",
                title: "Pilih Bin Tujuan",
                text: "Silakan pilih bin tujuan (destination bin).",
                confirmButtonColor: "#f97316",
              });
              return;
            }
            if (putawayForm.from_bin_id === putawayForm.to_bin_id) {
              await Swal.fire({
                icon: "warning",
                title: "Bin Tidak Valid",
                text: "Bin asal dan bin tujuan tidak boleh sama.",
                confirmButtonColor: "#f97316",
              });
              return;
            }

            const fromBinItem = selections["putaway_from_bin"];
            const fromBinName =
              (fromBinItem && "title" in fromBinItem
                ? fromBinItem.title
                : null) ||
              warehouses
                .find((w: any) => String(w.id) === putawayForm.warehouse_id)
                ?.bins?.find(
                  (b: any) => String(b.id) === putawayForm.from_bin_id,
                )?.code ||
              "bin asal";

            const toBinItem = selections["putaway_to_bin"];
            const toBinName =
              (toBinItem && "title" in toBinItem
                ? toBinItem.title
                : null) ||
              warehouses
                .find((w: any) => String(w.id) === putawayForm.warehouse_id)
                ?.bins?.find(
                  (b: any) => String(b.id) === putawayForm.to_bin_id,
                )?.code ||
              "bin tujuan";

            const confirmResult = await Swal.fire({
              title: "Konfirmasi Put Away",
              text: `Pindahkan ${formatQuantity(putawayForm.quantity)} unit ${putawayForm.sku} dari ${fromBinName} ke ${toBinName}?`,
              icon: "question",
              showCancelButton: true,
              confirmButtonText: "Ya, Put Away",
              cancelButtonText: "Batal",
              confirmButtonColor: "#f97316",
            });

            if (!confirmResult.isConfirmed) return;

            const movedQty = putawayForm.quantity;
            const movedSku = putawayForm.sku;

            run(async () => {
              try {
                await putAwayStock(company.id, putawayForm);
                setPutawayForm({
                  ...putawayForm,
                  sku: "",
                  to_bin_id: "",
                  quantity: "",
                });
                setSelections((prev) => ({
                  ...prev,
                  putaway_sku: null,
                  putaway_to_bin: null,
                }));
                await Swal.fire({
                  icon: "success",
                  title: "Put Away Berhasil",
                  text: `${formatQuantity(movedQty)} unit ${movedSku} berhasil dipindahkan ke ${toBinName}.`,
                  timer: 2000,
                  showConfirmButton: false,
                });
              } catch (err: any) {
                await Swal.fire({
                  icon: "error",
                  title: "Put Away Gagal",
                  text: err.message || "Gagal memproses put away.",
                  confirmButtonColor: "#f97316",
                });
                throw err;
              }
            });
          }}
        >
          <h3 className="font-bold">Put away to storage bin</h3>
          <p className="text-xs text-[var(--ui-text-muted)]">
            Move received goods from staging to the assigned storage bin.
          </p>
          <PickerBrowseButton
            label="Warehouse"
            placeholder="Select warehouse"
            selected={selections["putaway_warehouse"] || null}
            onClick={() => openPicker("putaway_warehouse")}
          />
          <div className="grid grid-cols-2 gap-3">
            <PickerBrowseButton
              label="Inventory item"
              placeholder="Select inventory item"
              selected={selections["putaway_sku"] || null}
              onClick={() => openPicker("putaway_sku")}
            />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                Units to move
              </div>
              <input
                required
                type="number"
                min="0.001"
                step="0.001"
                className={inputClass}
                placeholder="Units to move"
                value={putawayForm.quantity}
                onChange={(e) =>
                  setPutawayForm({
                    ...putawayForm,
                    quantity: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PickerBrowseButton
              label="From bin"
              placeholder="Select source bin"
              selected={selections["putaway_from_bin"] || null}
              onClick={() => openPicker("putaway_from_bin")}
            />
            <PickerBrowseButton
              label="Destination bin"
              placeholder="Select destination bin"
              selected={selections["putaway_to_bin"] || null}
              onClick={() => openPicker("putaway_to_bin")}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            {busy ? "Confirming put away…" : "Confirm put away"}
          </button>
        </form>
      </div>
      <div className={cardClass + " overflow-x-auto"}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <PackageCheck size={15} className="text-emerald-500" />
            </span>
            <div>
              <h3 className="font-bold text-[var(--ui-text-primary)]">Receiving Receipts (GRN)</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">Riwayat penerimaan barang masuk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              run(() =>
                importExistingGoodsReceipts(
                  company.id,
                  receiveForm.warehouse_id || warehouses[0]?.id,
                ),
              )
            }
            disabled={!receiveForm.warehouse_id && !warehouses[0]?.id}
            className="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] disabled:opacity-50 hover:bg-[var(--ui-bg-input)] transition-colors"
          >
            Import existing Goods Receipts
          </button>
        </div>
        <HuntrTable className="w-full min-w-[650px] text-left text-sm">
          <HuntrTableHead className="text-xs text-[var(--ui-text-muted)]">
            <HuntrTableRow>
              <HuntrTableHeaderCell className="py-2">Receipt</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>Warehouse</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>Lines</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>Accepted</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>Rejected</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>Reference</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="text-right">Action</HuntrTableHeaderCell>
            </HuntrTableRow>
          </HuntrTableHead>
          <HuntrTableBody>
            {receipts.map((x: any) => (
              <HuntrTableRow
                key={x.id}
                className="border-t border-[var(--ui-border)]"
              >
                <HuntrTableCell className="py-2">{x.receipt_number}</HuntrTableCell>
                <HuntrTableCell>{x.warehouse_name}</HuntrTableCell>
                <HuntrTableCell>{x.lines?.length || 0}</HuntrTableCell>
                <HuntrTableCell>
                  {formatQuantity(
                    (x.lines || []).reduce(
                      (sum: number, line: any) =>
                        sum + Number(line.accepted_quantity || 0),
                      0,
                    ),
                  )}
                </HuntrTableCell>
                <HuntrTableCell>
                  {formatQuantity(
                    (x.lines || []).reduce(
                      (sum: number, line: any) =>
                        sum + Number(line.rejected_quantity || 0),
                      0,
                    ),
                  )}
                </HuntrTableCell>
                <HuntrTableCell>{x.reference || "—"}</HuntrTableCell>
                <HuntrTableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => printGrn(x)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs font-semibold hover:border-[var(--ui-text-brand)]"
                  >
                    <Printer size={13} /> Print GRN
                  </button>
                </HuntrTableCell>
              </HuntrTableRow>
            ))}
            {!receipts.length && (
              <HuntrTableRow>
                <HuntrTableCell
                  colSpan={7}
                  className="py-4 text-[var(--ui-text-muted)]"
                >
                  No receiving activity recorded yet.
                </HuntrTableCell>
              </HuntrTableRow>
            )}
          </HuntrTableBody>
        </HuntrTable>
      </div>
    </div>
  );
}
