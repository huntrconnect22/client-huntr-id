import React from "react";
import { Package, PackageCheck, Truck } from "lucide-react";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { PickerBrowseButton } from "../features/WmsPickerFields";
import {
  allocateStock,
  checkWmsStockAvailability,
  packWmsOrder,
  releaseWmsOrder,
  shipWmsOrder,
  startWmsPicking,
} from "~/modules/shared/api/wms";

interface Props {
  cardClass: string;
  inputClass: string;
  company: any;
  run: (fn: () => Promise<any>) => void;
  allocateForm: {
    warehouse_id: string;
    sku: string;
    quantity: string;
    order_number?: string;
  };
  setAllocateForm: React.Dispatch<React.SetStateAction<any>>;
  selections: Record<string, any>;
  openPicker: (kind: any) => void;
  allocationAvailable: number;
  allocationRequested: number;
  allocationSufficient: boolean;
  fulfillmentCounts: {
    total: number;
    allocated: number;
    picking: number;
    packed: number;
    shipped: number;
  };
  fulfillmentFilter: string;
  setFulfillmentFilter: (val: string) => void;
  filteredOrders: any[];
  shipping: Record<string, { carrier: string; tracking_number: string }>;
  setShipping: React.Dispatch<React.SetStateAction<Record<string, { carrier: string; tracking_number: string }>>>;
}

export function WmsAllocationTab({
  cardClass,
  inputClass,
  company,
  run,
  allocateForm,
  setAllocateForm,
  selections,
  openPicker,
  allocationAvailable,
  allocationRequested,
  allocationSufficient,
  fulfillmentCounts,
  fulfillmentFilter,
  setFulfillmentFilter,
  filteredOrders,
  shipping,
  setShipping,
}: Props) {
  return (
    <div className="space-y-4">
      <WmsWorkflowGuide
        title="Fulfilment flow"
        description="Allocation reserves stock. Pick it from the shown bins, confirm packing, then add carrier details before dispatch."
        steps={[
          "Allocate order",
          "Start picking",
          "Confirm packed",
          "Dispatch",
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <form
          className={cardClass + " space-y-3.5"}
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const availability = await checkWmsStockAvailability(
                company.id,
                {
                  warehouse_id: allocateForm.warehouse_id,
                  lines: [
                    {
                      sku: allocateForm.sku,
                      quantity: Number(allocateForm.quantity),
                    },
                  ],
                },
              );
              const line = availability?.data?.[0];
              if (!line?.sufficient) {
                throw new Error(
                  `Stok ${line?.sku || allocateForm.sku} tidak cukup. Dibutuhkan ${line?.requested || allocateForm.quantity}, tersedia ${line?.available || 0}.`,
                );
              }
              await allocateStock(company.id, {
                warehouse_id: allocateForm.warehouse_id,
                order_number:
                  allocateForm.order_number ||
                  `WMS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                lines: [
                  {
                    sku: allocateForm.sku,
                    quantity: Number(allocateForm.quantity),
                  },
                ],
              });
              setAllocateForm({
                ...allocateForm,
                sku: "",
                quantity: "",
              });
            });
          }}
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--ui-border)] pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <PackageCheck size={15} className="text-violet-500" />
            </span>
            <div>
              <h3 className="font-bold text-[var(--ui-text-primary)]">Alokasi Order</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">Sistem memilih bin picking secara otomatis.</p>
            </div>
          </div>
          <PickerBrowseButton
            label="Warehouse"
            placeholder="Select warehouse"
            selected={selections["allocate_warehouse"] || null}
            onClick={() => openPicker("allocate_warehouse")}
          />
          <div className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-input)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
            Order number is generated automatically when stock is
            allocated.
          </div>
          <PickerBrowseButton
            label="Inventory item"
            placeholder="Select inventory item"
            selected={selections["allocate_sku"] || null}
            onClick={() => openPicker("allocate_sku")}
          />
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
              Units to reserve
            </div>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              className={inputClass}
              placeholder="Units to reserve"
              value={allocateForm.quantity}
              onChange={(e) =>
                setAllocateForm({
                  ...allocateForm,
                  quantity: e.target.value,
                })
              }
            />
          </div>
          {allocateForm.warehouse_id &&
            allocateForm.sku &&
            allocationRequested > 0 && (
              <p
                className={`text-xs ${allocationSufficient ? "text-emerald-500" : "text-red-500"}`}
              >
                {allocationSufficient
                  ? `Stock available: ${allocationAvailable}. Ready to reserve ${allocationRequested}.`
                  : `Stock insufficient: ${allocationAvailable} available, ${allocationRequested} requested.`}
              </p>
            )}
          <button
            type="submit"
            disabled={!allocationSufficient}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PackageCheck size={14} /> Alokasi Stok
          </button>
        </form>
        <div className={cardClass + " space-y-3"}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Truck size={15} className="text-amber-500" />
              </span>
              <div>
                <h3 className="font-bold text-[var(--ui-text-primary)]">Antrian Fulfillment</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">Picking · Packing · Dispatch</p>
              </div>
            </div>
            <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-text-secondary)]">
              {filteredOrders.length} Pesanan
            </span>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "Semua", count: fulfillmentCounts.total },
              { id: "allocated", label: "Siap Pick", count: fulfillmentCounts.allocated },
              { id: "picking", label: "Sedang Pick", count: fulfillmentCounts.picking },
              { id: "packed", label: "Siap Kirim", count: fulfillmentCounts.packed },
              { id: "shipped", label: "Terkirim", count: fulfillmentCounts.shipped },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFulfillmentFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  fulfillmentFilter === f.id
                    ? "bg-[var(--ui-text-brand)] text-white shadow-sm"
                    : "bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-card)]"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    fulfillmentFilter === f.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)]"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-1">
            {filteredOrders.map((o: any) => {
              const lines =
                typeof o.lines === "string"
                  ? JSON.parse(o.lines)
                  : o.lines || [];
              const meta = shipping[String(o.id)] || {
                carrier: "",
                tracking_number: "",
              };

              const steps = [
                { id: "allocated", label: "Alokasi" },
                { id: "picking", label: "Picking" },
                { id: "packed", label: "Packing" },
                { id: "shipped", label: "Dikirim" },
              ];
              const currentIdx = steps.findIndex((s) => s.id === o.status);

              return (
                <div
                  key={o.id}
                  className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/30 p-3.5 transition-all hover:border-[var(--ui-border)]/80"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--ui-border)] pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[var(--ui-text-primary)]">{o.order_number}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            o.status === "allocated"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : o.status === "picking"
                              ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                              : o.status === "packed"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : o.status === "shipped"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{o.warehouse_name}</p>
                    </div>

                    {/* Quick Actions */}
                    {o.status === "allocated" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => run(() => startWmsPicking(company.id, o.id))}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-text-brand)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 shadow-sm"
                        >
                          <Package size={12} /> Mulai Picking
                        </button>
                        <button
                          type="button"
                          onClick={() => run(() => releaseWmsOrder(company.id, o.id))}
                          className="rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] hover:text-red-500"
                          title="Lepas Alokasi Stok"
                        >
                          Release
                        </button>
                      </div>
                    )}
                    {o.status === "picking" && (
                      <button
                        type="button"
                        onClick={() =>
                          run(() =>
                            packWmsOrder(company.id, o.id, "Packed and checked"),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
                      >
                        <PackageCheck size={12} /> Selesai Packing
                      </button>
                    )}
                  </div>

                  {/* Visual 4-Step Stepper */}
                  <div className="my-2.5 flex items-center justify-between text-[10px]">
                    {steps.map((st, i) => {
                      const isDone = currentIdx >= i;
                      const isCurrent = currentIdx === i;
                      return (
                        <div key={st.id} className="flex min-w-0 flex-1 items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                              }`}
                            >
                              {isDone ? "✓" : i + 1}
                            </span>
                            <span
                              className={`font-semibold ${
                                isCurrent
                                  ? "text-[var(--ui-text-brand)]"
                                  : isDone
                                  ? "text-[var(--ui-text-primary)]"
                                  : "text-[var(--ui-text-muted)]"
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              className={`mx-2 h-0.5 flex-1 ${
                                currentIdx > i ? "bg-emerald-500" : "bg-[var(--ui-border)]"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Line items to pick / pack */}
                  <div className="mt-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2.5 space-y-1 text-xs text-[var(--ui-text-secondary)]">
                    {lines.map((line: any, i: number) => (
                      <div
                        key={`${line.stock_id}-${i}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="font-mono text-xs text-[var(--ui-text-primary)]">
                          {line.quantity} × {line.sku}
                        </span>
                        <span className="rounded bg-[var(--ui-bg-input)] px-2 py-0.5 text-[11px] text-[var(--ui-text-muted)]">
                          Bin: <strong className="text-[var(--ui-text-brand)]">{line.bin_location || "STORAGE"}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {o.status === "packed" && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        className={inputClass}
                        placeholder="Kurir / Carrier (misal: JNE, GrabExpress)"
                        value={meta.carrier}
                        onChange={(e) =>
                          setShipping({
                            ...shipping,
                            [String(o.id)]: {
                              ...meta,
                              carrier: e.target.value,
                            },
                          })
                        }
                      />
                      <input
                        className={inputClass}
                        placeholder="No. Resi / Tracking number"
                        value={meta.tracking_number}
                        onChange={(e) =>
                          setShipping({
                            ...shipping,
                            [String(o.id)]: {
                              ...meta,
                              tracking_number: e.target.value,
                            },
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => run(() => shipWmsOrder(company.id, o.id, meta))}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm"
                      >
                        <Truck size={13} /> Kirim Sekarang
                      </button>
                    </div>
                  )}

                  {o.status === "shipped" && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Truck size={13} className="shrink-0" />
                      <span>
                        Kurir: <strong>{o.carrier || "Kurir Tercatat"}</strong> · No. Resi:{" "}
                        <strong className="font-mono">{o.tracking_number || "Tanpa Resi"}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {!filteredOrders.length && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Truck size={28} className="text-[var(--ui-text-muted)] opacity-30" />
                <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">
                  {fulfillmentFilter === "all"
                    ? "Antrian fulfillment kosong"
                    : `Tidak ada pesanan dengan status ${fulfillmentFilter}`}
                </p>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Alokasi order baru untuk memulai alur picking & packing.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

