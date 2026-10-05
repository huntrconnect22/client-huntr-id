import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  Boxes,
  Building2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Truck,
} from "lucide-react";
import Layout from "../components/Layout";
import { WmsOverview, WmsWorkflowGuide } from "../components/wms/WmsOverview";
import {
  adjustStock,
  allocateStock,
  createWarehouse,
  getInboundPurchaseOrders,
  getWmsCatalogue,
  getWmsDashboard,
  getWmsOrders,
  getWmsReceipts,
  getWmsReport,
  getWmsStock,
  getWarehouses,
  installWms,
  importExistingGoodsReceipts,
  putAwayStock,
  packWmsOrder,
  receiveStock,
  releaseWmsOrder,
  setWmsReorderLevel,
  shipWmsOrder,
  startWmsPicking,
  transferStock,
  updateWarehouse,
} from "../lib/api/wms";

const card = "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4";
const input =
  "w-full rounded-md border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none";

export default function WmsPage() {
  const [company, setCompany] = useState<any>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dash, setDash] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inboundOrders, setInboundOrders] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [tab, setTab] = useState("Overview");
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
  });
  const [receiveForm, setReceiveForm] = useState({
    warehouse_id: "",
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
  const [receiveKey, setReceiveKey] = useState(() => crypto.randomUUID());
  const [receiveLines, setReceiveLines] = useState<any[]>([]);
  const [allocateForm, setAllocateForm] = useState({
    warehouse_id: "",
    order_number: "",
    sku: "",
    quantity: "",
  });
  const [putawayForm, setPutawayForm] = useState({
    warehouse_id: "",
    sku: "",
    from_bin_id: "",
    to_bin_id: "",
    quantity: "",
  });
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    sku: "",
    from_bin: "",
    to_bin: "",
    quantity: "",
  });
  const [adjustForm, setAdjustForm] = useState({
    warehouse_id: "",
    sku: "",
    bin_location: "",
    quantity: "",
    reason: "",
  });
  const [shipping, setShipping] = useState<
    Record<string, { carrier: string; tracking_number: string }>
  >({});
  const [reorderLevels, setReorderLevels] = useState<Record<number, string>>(
    {},
  );
  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (!company?.id) return;
    try {
      const [d, w, s, r, c, rcv, o, po] = await Promise.all([
        getWmsDashboard(company.id),
        getWarehouses(company.id),
        getWmsStock(company.id),
        getWmsReport(company.id),
        getWmsCatalogue(company.id),
        getWmsReceipts(company.id),
        getWmsOrders(company.id),
        getInboundPurchaseOrders(company.id),
      ]);
      setDash(d);
      setWarehouses(w?.data || []);
      setStock(s?.data?.data || s?.data || []);
      setReport(r);
      setCatalogue(c?.data || []);
      setReceipts(rcv?.data?.data || []);
      setOrders(o?.data?.data || []);
      setInboundOrders(po?.data || []);
      setInstalled(true);
    } catch (e: any) {
      if ((e.message || "").toLowerCase().includes("install"))
        setInstalled(false);
      else setError(e.message || "Gagal memuat data gudang.");
    }
  }, [company]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e: any) {
      setError(e.message || "Operasi gagal.");
    } finally {
      setBusy(false);
    }
  };
  if (!company?.id)
    return (
      <Layout
        title="WMS & Inventory"
        subtitle="Pilih company workspace untuk melanjutkan."
      >
        <div className={card}>Pilih perusahaan aktif terlebih dahulu.</div>
      </Layout>
    );
  if (installed === false)
    return (
      <Layout
        title="WMS & Inventory"
        subtitle="Modul gudang belum diaktifkan untuk workspace ini."
      >
        <div className={`${card} max-w-2xl`}>
          <PackageCheck size={30} className="text-[var(--ui-text-brand)]" />
          <h2 className="mt-3 text-lg font-bold">Install dari App Market</h2>
          <p className="my-2 text-sm text-[var(--ui-text-secondary)]">
            Aktifkan WMS &amp; Inventory untuk perusahaan ini. Instalasi siap
            digunakan langsung.
          </p>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await installWms(company.id);
                setInstalled(true);
              })
            }
            className="mt-3 rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white"
          >
            Install module
          </button>
        </div>
      </Layout>
    );
  const tabs = [
    ["Overview", BarChart3],
    ["Stock", Boxes],
    ["Receiving & Put Away", ArrowDownToLine],
    ["Allocation & Packing", PackageCheck],
    ["Transfers", Truck],
    ["Adjustments", Activity],
    ["Warehouses", Building2],
    ["Reports", BarChart3],
  ] as const;
  return (
    <Layout
      title="WMS & Inventory"
      subtitle="Warehouse operations · connected to Huntr Catalogue"
    >
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {tabs.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-semibold whitespace-nowrap ${tab === name ? "border-[var(--ui-text-brand)] bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]" : "border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-secondary)]"}`}
              >
                <Icon size={14} />
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            className="shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2 text-[var(--ui-text-secondary)]"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
        {error && (
          <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 text-sm text-[var(--ui-text-brand)]">
            {error}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Saving transaction…
          </div>
        )}
        {tab === "Overview" && (
          <WmsOverview
            dash={dash}
            warehouses={warehouses}
            receipts={receipts}
            stock={stock}
            orders={orders}
            onTabChange={setTab}
          />
        )}
        {tab === "Warehouses" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Start with the physical warehouse"
              description="A warehouse automatically receives Receiving, Storage, and Quarantine bins. Use the code consistently on labels and documents."
              steps={[
                "Create warehouse",
                "Review default bins",
                "Receive first goods",
              ]}
            />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className={card}>
                <h3 className="mb-4 font-bold">Warehouse network</h3>
                <div className="space-y-2">
                  {warehouses.map((w) => (
                    <div
                      key={w.id}
                      className="flex justify-between border border-[var(--ui-border)] p-3"
                    >
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">
                          {w.code} · {w.address || "Address not set"}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          run(() =>
                            updateWarehouse(company.id, w.id, {
                              status:
                                w.status === "active" ? "inactive" : "active",
                            }),
                          )
                        }
                        className="rounded-md border border-[var(--ui-border)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-secondary)]"
                      >
                        {w.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                  {!warehouses.length && (
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Create a warehouse to begin.
                    </p>
                  )}
                </div>
              </div>
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await createWarehouse(company.id, warehouseForm);
                    setWarehouseForm({ code: "", name: "", address: "" });
                  });
                }}
              >
                <h3 className="font-bold">Add warehouse</h3>
                <input
                  className={input}
                  placeholder="Warehouse code"
                  required
                  value={warehouseForm.code}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, code: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Warehouse name"
                  required
                  value={warehouseForm.name}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, name: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Address"
                  value={warehouseForm.address}
                  onChange={(e) =>
                    setWarehouseForm({
                      ...warehouseForm,
                      address: e.target.value,
                    })
                  }
                />
                <button className="inline-flex items-center gap-2 rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  <Plus size={15} />
                  Create warehouse
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Stock" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Read stock before making changes"
              description="On hand is the physical quantity. Allocated is reserved for an order. Available is what can still be promised."
              steps={[
                "Find SKU",
                "Check bin availability",
                "Set reorder level",
              ]}
            />
            <div className={card + " overflow-x-auto"}>
              <h3 className="mb-4 font-bold">Inventory by warehouse</h3>
              {stock.length > 0 ? (
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-xs text-[var(--ui-text-muted)]">
                    <tr>
                      <th className="py-2">SKU / Catalogue</th>
                      <th>Item</th>
                      <th>Warehouse</th>
                      <th>Bin</th>
                      <th>On hand</th>
                      <th>Allocated</th>
                      <th>Available</th>
                      <th>Reorder level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((x: any) => (
                      <tr
                        key={x.id}
                        className="border-t border-[var(--ui-border)]"
                      >
                        <td className="py-3 font-mono text-xs">
                          {x.sku}
                          {x.catalogue_id && (
                            <span className="ml-1 text-[var(--ui-text-brand)]">
                              · linked
                            </span>
                          )}
                        </td>
                        <td>{x.item_name}</td>
                        <td>{x.warehouse_name}</td>
                        <td>{x.bin_location || "—"}</td>
                        <td>
                          {x.on_hand} {x.uom}
                        </td>
                        <td>{x.allocated}</td>
                        <td>{Number(x.on_hand) - Number(x.allocated)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <input
                              aria-label={`Reorder level ${x.sku}`}
                              type="number"
                              min="0"
                              step="0.001"
                              className={input + " w-24 px-2 py-1"}
                              value={
                                reorderLevels[x.id] ??
                                String(x.reorder_level || 0)
                              }
                              onChange={(e) =>
                                setReorderLevels({
                                  ...reorderLevels,
                                  [x.id]: e.target.value,
                                })
                              }
                            />
                            <button
                              onClick={() =>
                                run(async () => {
                                  await setWmsReorderLevel(
                                    company.id,
                                    x.id,
                                    Number(
                                      reorderLevels[x.id] ??
                                        x.reorder_level ??
                                        0,
                                    ),
                                  );
                                })
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-2 py-1 text-xs"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center">
                  <Boxes
                    size={24}
                    className="mx-auto text-[var(--ui-text-brand)]"
                  />
                  <p className="mt-2 text-sm font-semibold">No inventory yet</p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                    Receive incoming goods first. Approved quantities will
                    appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("Receiving & Put Away")}
                    className="mt-3 text-xs font-semibold text-[var(--ui-text-brand)]"
                  >
                    Go to receiving
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "Receiving & Put Away" && (
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
            <div className="grid gap-4 xl:grid-cols-2">
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    if (!receiveLines.length) {
                      throw new Error(
                        "Add at least one receipt line before confirming.",
                      );
                    }
                    await receiveStock(company.id, {
                      warehouse_id: receiveForm.warehouse_id,
                      purchase_order_id:
                        receiveForm.purchase_order_id || undefined,
                      idempotency_key: receiveKey,
                      reference: receiveForm.bin_location || undefined,
                      lines: receiveLines,
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
                  });
                }}
              >
                <h3 className="font-bold">Receive order / incoming goods</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Goods enter the RECEIVING staging bin before put away.
                </p>
                <select
                  required
                  className={input}
                  value={receiveForm.warehouse_id}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      warehouse_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <select
                  required={!receiveForm.purchase_order_id}
                  className={input}
                  value={receiveForm.catalogue_id}
                  onChange={(e) => {
                    const item = catalogue.find(
                      (x: any) => x.id === e.target.value,
                    );
                    setReceiveForm({
                      ...receiveForm,
                      catalogue_id: e.target.value,
                      sku: item?.item_code || "",
                      item_name: item?.name || "",
                    });
                  }}
                >
                  <option value="">
                    Select the product variant from Huntr Catalogue
                  </option>
                  {catalogue.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} · {item.name}
                    </option>
                  ))}
                </select>
                {receiveForm.sku && (
                  <p className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-input)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
                    Selected SKU identity:{" "}
                    <span className="font-mono font-semibold">
                      {receiveForm.sku}
                    </span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className={input}
                    value={receiveForm.condition}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        condition: e.target.value,
                      })
                    }
                  >
                    <option value="good">Inspection: good</option>
                    <option value="damaged">Inspection: damaged</option>
                    <option value="short">Inspection: short</option>
                    <option value="other">Inspection: other</option>
                  </select>
                  <input
                    className={input}
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
                <input
                  className={input}
                  placeholder="Item name"
                  value={receiveForm.item_name}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      item_name: e.target.value,
                    })
                  }
                />
                <select
                  className={input}
                  value={receiveForm.purchase_order_id}
                  onChange={(e) => {
                    const po = inboundOrders.find(
                      (x: any) => x.id === e.target.value,
                    );
                    const line = po?.lines?.find(
                      (x: any) => x.remaining_quantity > 0,
                    );
                    setReceiveForm({
                      ...receiveForm,
                      purchase_order_id: e.target.value,
                      bin_location: po?.po_number || "",
                      catalogue_id: line?.catalogue_id || "",
                      sku: line?.sku || "",
                      item_name: line?.name || "",
                      quantity: line ? String(line.remaining_quantity) : "",
                    });
                  }}
                >
                  <option value="">Link to Purchase Order (optional)</option>
                  {inboundOrders.map((po: any) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} · {po.vendor_name || "Vendor"} ·{" "}
                      {po.status}
                    </option>
                  ))}
                </select>
                {receiveForm.purchase_order_id && (
                  <select
                    className={input}
                    value={receiveForm.sku}
                    onChange={(e) => {
                      const po = inboundOrders.find(
                        (x: any) => x.id === receiveForm.purchase_order_id,
                      );
                      const line = po?.lines?.find(
                        (x: any) => x.sku === e.target.value,
                      );
                      setReceiveForm({
                        ...receiveForm,
                        catalogue_id: line?.catalogue_id || "",
                        sku: line?.sku || "",
                        item_name: line?.name || "",
                        quantity: line ? String(line.remaining_quantity) : "",
                      });
                    }}
                  >
                    <option value="">Select outstanding PO line</option>
                    {(
                      inboundOrders.find(
                        (x: any) => x.id === receiveForm.purchase_order_id,
                      )?.lines || []
                    ).map((line: any) => (
                      <option key={line.sku} value={line.sku}>
                        {line.sku} · {line.name} · remaining{" "}
                        {line.remaining_quantity}
                      </option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={input}
                    placeholder="Received quantity"
                    value={receiveForm.quantity}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        quantity: e.target.value,
                      })
                    }
                  />
                  <input
                    className={input}
                    placeholder="Reference / PO"
                    value={receiveForm.bin_location}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        bin_location: e.target.value,
                      })
                    }
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  max={receiveForm.quantity || undefined}
                  className={input}
                  placeholder="Rejected quantity after inspection"
                  value={receiveForm.rejected_quantity}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      rejected_quantity: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    if (
                      (!receiveForm.catalogue_id && !receiveForm.sku) ||
                      !Number(receiveForm.quantity)
                    ) {
                      setError(
                        "Select an item and enter its received quantity first.",
                      );
                      return;
                    }
                    setReceiveLines([
                      ...receiveLines,
                      {
                        ...(receiveForm.catalogue_id
                          ? { catalogue_id: receiveForm.catalogue_id }
                          : { sku: receiveForm.sku }),
                        item_name: receiveForm.item_name || undefined,
                        received_quantity: Number(receiveForm.quantity),
                        accepted_quantity:
                          Number(receiveForm.quantity) -
                          Number(receiveForm.rejected_quantity || 0),
                        rejected_quantity: Number(
                          receiveForm.rejected_quantity || 0,
                        ),
                        condition: receiveForm.condition,
                        inspection_notes:
                          receiveForm.inspection_notes || undefined,
                      },
                    ]);
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
                  }}
                  className="rounded-md border border-[var(--ui-border)] px-4 py-2 text-sm font-semibold"
                >
                  Add receipt line
                </button>
                {receiveLines.length > 0 && (
                  <div className="border border-[var(--ui-border)] p-3 text-xs">
                    <p className="mb-2 font-semibold">
                      Receipt lines ({receiveLines.length})
                    </p>
                    {receiveLines.map((line, index) => (
                      <div
                        key={`${line.sku || line.catalogue_id}-${index}`}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <span>
                          {line.sku || line.catalogue_id} ·{" "}
                          {line.accepted_quantity} accepted
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReceiveLines(
                              receiveLines.filter((_, i) => i !== index),
                            )
                          }
                          className="text-[var(--ui-text-muted)]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Confirm receiving
                </button>
              </form>
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await putAwayStock(company.id, putawayForm);
                    setPutawayForm({
                      ...putawayForm,
                      sku: "",
                      to_bin_id: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <h3 className="font-bold">Put away to storage bin</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Move received goods from staging to the assigned storage bin.
                </p>
                <select
                  required
                  className={input}
                  value={putawayForm.warehouse_id}
                  onChange={(e) =>
                    setPutawayForm({
                      ...putawayForm,
                      warehouse_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    required
                    className={input}
                    value={putawayForm.sku}
                    onChange={(e) =>
                      setPutawayForm({ ...putawayForm, sku: e.target.value })
                    }
                  >
                    <option value="">Select inventory item</option>
                    {stock
                      .filter(
                        (x: any) => x.warehouse_id === putawayForm.warehouse_id,
                      )
                      .filter(
                        (x: any, index: number, items: any[]) =>
                          items.findIndex((item: any) => item.sku === x.sku) ===
                          index,
                      )
                      .map((item: any) => (
                        <option key={item.sku} value={item.sku}>
                          {item.item_name} · {item.sku}
                        </option>
                      ))}
                  </select>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={input}
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
                <div className="grid grid-cols-2 gap-3">
                  <select
                    required
                    className={input}
                    value={putawayForm.from_bin_id}
                    onChange={(e) =>
                      setPutawayForm({
                        ...putawayForm,
                        from_bin_id: e.target.value,
                      })
                    }
                  >
                    <option value="">From bin</option>
                    {(
                      warehouses.find(
                        (w: any) => w.id === putawayForm.warehouse_id,
                      )?.bins || []
                    ).map((bin: any) => (
                      <option key={bin.id} value={bin.id}>
                        {bin.code} · {bin.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    className={input}
                    value={putawayForm.to_bin_id}
                    onChange={(e) =>
                      setPutawayForm({
                        ...putawayForm,
                        to_bin_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Destination bin</option>
                    {(
                      warehouses.find(
                        (w: any) => w.id === putawayForm.warehouse_id,
                      )?.bins || []
                    )
                      .filter(
                        (bin: any) =>
                          ["storage", "picking", "packing"].includes(
                            bin.type,
                          ) && bin.status === "active",
                      )
                      .map((bin: any) => (
                        <option key={bin.id} value={bin.id}>
                          {bin.code} · {bin.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Confirm put away
                </button>
              </form>
            </div>
            <div className={card + " overflow-x-auto"}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Receiving receipts</h3>
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
                  className="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Import existing Goods Receipts
                </button>
              </div>
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="text-xs text-[var(--ui-text-muted)]">
                  <tr>
                    <th className="py-2">Receipt</th>
                    <th>Warehouse</th>
                    <th>Lines</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((x: any) => (
                    <tr
                      key={x.id}
                      className="border-t border-[var(--ui-border)]"
                    >
                      <td className="py-2">{x.receipt_number}</td>
                      <td>{x.warehouse_name}</td>
                      <td>{x.lines?.length || 0}</td>
                      <td>
                        {(x.lines || []).reduce(
                          (sum: number, line: any) =>
                            sum + Number(line.accepted_quantity || 0),
                          0,
                        )}
                      </td>
                      <td>
                        {(x.lines || []).reduce(
                          (sum: number, line: any) =>
                            sum + Number(line.rejected_quantity || 0),
                          0,
                        )}
                      </td>
                      <td>{x.reference || "—"}</td>
                    </tr>
                  ))}
                  {!receipts.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 text-[var(--ui-text-muted)]"
                      >
                        No receiving activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "Allocation & Packing" && (
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
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await allocateStock(company.id, {
                      warehouse_id: allocateForm.warehouse_id,
                      order_number: allocateForm.order_number,
                      lines: [
                        {
                          sku: allocateForm.sku,
                          quantity: Number(allocateForm.quantity),
                        },
                      ],
                    });
                    setAllocateForm({
                      ...allocateForm,
                      order_number: "",
                      sku: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <h3 className="font-bold">Allocate for order</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  The system reserves available stock and selects pick bins
                  automatically.
                </p>
                <select
                  required
                  className={input}
                  value={allocateForm.warehouse_id}
                  onChange={(e) =>
                    setAllocateForm({
                      ...allocateForm,
                      warehouse_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  className={input}
                  placeholder="Order number"
                  value={allocateForm.order_number}
                  onChange={(e) =>
                    setAllocateForm({
                      ...allocateForm,
                      order_number: e.target.value,
                    })
                  }
                />
                <select
                  required
                  className={input}
                  value={allocateForm.sku}
                  onChange={(e) =>
                    setAllocateForm({ ...allocateForm, sku: e.target.value })
                  }
                >
                  <option value="">Select inventory item</option>
                  {stock
                    .filter(
                      (x: any) =>
                        x.warehouse_id === allocateForm.warehouse_id &&
                        Number(x.on_hand) - Number(x.allocated) > 0,
                    )
                    .filter(
                      (x: any, index: number, items: any[]) =>
                        items.findIndex((item: any) => item.sku === x.sku) ===
                        index,
                    )
                    .map((item: any) => (
                      <option key={item.sku} value={item.sku}>
                        {item.item_name} · {item.sku} · available{" "}
                        {Number(item.on_hand) - Number(item.allocated)}
                      </option>
                    ))}
                </select>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  className={input}
                  placeholder="Units to reserve"
                  value={allocateForm.quantity}
                  onChange={(e) =>
                    setAllocateForm({
                      ...allocateForm,
                      quantity: e.target.value,
                    })
                  }
                />
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Allocate stock
                </button>
              </form>
              <div className={card + " space-y-3"}>
                <h3 className="font-bold">
                  Picking, packing &amp; dispatch queue
                </h3>
                {orders.map((o: any) => {
                  const lines =
                    typeof o.lines === "string"
                      ? JSON.parse(o.lines)
                      : o.lines || [];
                  const meta = shipping[String(o.id)] || {
                    carrier: "",
                    tracking_number: "",
                  };
                  return (
                    <div
                      key={o.id}
                      className="border border-[var(--ui-border)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{o.order_number}</p>
                          <p className="text-xs capitalize text-[var(--ui-text-muted)]">
                            {o.warehouse_name} · {o.status}
                          </p>
                        </div>
                        {o.status === "allocated" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                run(() => startWmsPicking(company.id, o.id))
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                            >
                              Start picking
                            </button>
                            <button
                              onClick={() =>
                                run(() => releaseWmsOrder(company.id, o.id))
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-muted)]"
                            >
                              Release
                            </button>
                          </div>
                        )}
                        {o.status === "picking" && (
                          <button
                            onClick={() =>
                              run(() =>
                                packWmsOrder(
                                  company.id,
                                  o.id,
                                  "Packed and checked",
                                ),
                              )
                            }
                            className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                          >
                            Confirm packed
                          </button>
                        )}
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-[var(--ui-text-secondary)]">
                        {lines.map((line: any, i: number) => (
                          <p key={`${line.stock_id}-${i}`}>
                            Pick {line.quantity} × {line.sku} from bin{" "}
                            <strong>{line.bin_location || "—"}</strong>
                          </p>
                        ))}
                      </div>
                      {o.status === "packed" && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            className={input}
                            placeholder="Carrier"
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
                            className={input}
                            placeholder="Tracking number"
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
                            onClick={() =>
                              run(() => shipWmsOrder(company.id, o.id, meta))
                            }
                            className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                          >
                            Dispatch
                          </button>
                        </div>
                      )}
                      {o.status === "shipped" && (
                        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
                          {o.carrier || "Carrier pending"} ·{" "}
                          {o.tracking_number || "No tracking number"}
                        </p>
                      )}
                    </div>
                  );
                })}
                {!orders.length && (
                  <p className="text-sm text-[var(--ui-text-muted)]">
                    No orders in the fulfilment queue.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {tab === "Transfers" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Move inventory between warehouses"
              description="Use a transfer only when physical stock moves. Select the source bin that currently holds the SKU and its destination bin."
              steps={[
                "Choose origin",
                "Choose destination",
                "Select SKU and bins",
                "Confirm transfer",
              ]}
            />
            <div className={card + " max-w-3xl space-y-3"}>
              <h3 className="font-bold">Inter-warehouse stock transfer</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">
                Moves stock between warehouses and records both inventory
                movements.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await transferStock(company.id, transferForm);
                    setTransferForm({
                      ...transferForm,
                      sku: "",
                      from_bin: "",
                      to_bin: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    required
                    className={input}
                    value={transferForm.from_warehouse_id}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        from_warehouse_id: e.target.value,
                      })
                    }
                  >
                    <option value="">From warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    className={input}
                    value={transferForm.to_warehouse_id}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        to_warehouse_id: e.target.value,
                      })
                    }
                  >
                    <option value="">To warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    className={input}
                    value={transferForm.sku}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, sku: e.target.value })
                    }
                  >
                    <option value="">Select inventory item</option>
                    {stock
                      .filter(
                        (x: any) =>
                          x.warehouse_id === transferForm.from_warehouse_id &&
                          Number(x.on_hand) - Number(x.allocated) > 0,
                      )
                      .filter(
                        (x: any, index: number, items: any[]) =>
                          items.findIndex((item: any) => item.sku === x.sku) ===
                          index,
                      )
                      .map((item: any) => (
                        <option key={item.sku} value={item.sku}>
                          {item.item_name} · {item.sku}
                        </option>
                      ))}
                  </select>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={input}
                    placeholder="Units to transfer"
                    value={transferForm.quantity}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        quantity: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    className={input}
                    placeholder="Source bin"
                    value={transferForm.from_bin}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        from_bin: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    className={input}
                    placeholder="Destination bin"
                    value={transferForm.to_bin}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        to_bin: e.target.value,
                      })
                    }
                  />
                </div>
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Confirm transfer
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Adjustments" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Correct stock after a physical count"
              description="Use adjustments for a verified discrepancy only. A positive number adds stock; a negative number removes stock. Always leave a reason."
              steps={[
                "Count physical stock",
                "Find SKU and bin",
                "Enter variance",
                "Record reason",
              ]}
            />
            <div className={card + " max-w-3xl space-y-3"}>
              <h3 className="font-bold">Cycle count / stock adjustment</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">
                Add or subtract stock after a count. Allocated stock cannot be
                adjusted away.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await adjustStock(company.id, {
                      ...adjustForm,
                      quantity: Number(adjustForm.quantity),
                    });
                    setAdjustForm({
                      ...adjustForm,
                      sku: "",
                      bin_location: "",
                      quantity: "",
                      reason: "",
                    });
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    required
                    className={input}
                    value={adjustForm.warehouse_id}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        warehouse_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    className={input}
                    value={adjustForm.sku}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, sku: e.target.value })
                    }
                  >
                    <option value="">Select inventory item</option>
                    {stock
                      .filter(
                        (x: any) => x.warehouse_id === adjustForm.warehouse_id,
                      )
                      .filter(
                        (x: any, index: number, items: any[]) =>
                          items.findIndex((item: any) => item.sku === x.sku) ===
                          index,
                      )
                      .map((item: any) => (
                        <option key={item.sku} value={item.sku}>
                          {item.item_name} · {item.sku}
                        </option>
                      ))}
                  </select>
                  <input
                    required
                    className={input}
                    placeholder="Bin location"
                    value={adjustForm.bin_location}
                    onChange={(e) =>
                      setAdjustForm({
                        ...adjustForm,
                        bin_location: e.target.value,
                      })
                    }
                  />
                  <input
                    required
                    type="number"
                    step="0.001"
                    className={input}
                    placeholder="Adjustment quantity (+ / -)"
                    value={adjustForm.quantity}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, quantity: e.target.value })
                    }
                  />
                </div>
                <input
                  required
                  className={input}
                  placeholder="Reason / cycle count reference"
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, reason: e.target.value })
                  }
                />
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Record adjustment
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Reports" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Use reports to decide what to replenish"
              description="Start with warehouse availability, review movement, then act on any item below its reorder level."
              steps={[
                "Review availability",
                "Inspect movement",
                "Resolve replenishment alerts",
              ]}
            />
            <div className={card + " overflow-x-auto"}>
              <h3 className="mb-4 font-bold">
                Warehouse performance &amp; analysis
              </h3>
              <p className="mb-4 text-xs text-[var(--ui-text-muted)]">
                Movement and order summaries for the last 30 days.
              </p>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-[var(--ui-text-muted)]">
                  <tr>
                    <th className="py-2">Warehouse</th>
                    <th>SKU count</th>
                    <th>On hand</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.stock_by_warehouse || []).map((x: any) => (
                    <tr
                      className="border-t border-[var(--ui-border)]"
                      key={x.id}
                    >
                      <td className="py-3">
                        {x.name}{" "}
                        <span className="text-xs text-[var(--ui-text-muted)]">
                          {x.code}
                        </span>
                      </td>
                      <td>{x.sku_count}</td>
                      <td>{x.on_hand}</td>
                      <td>{x.allocated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(report?.movement_summary || []).map((x: any) => (
                  <div
                    key={x.type}
                    className="border border-[var(--ui-border)] p-3"
                  >
                    <p className="capitalize font-semibold">{x.type}</p>
                    <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                      {x.transactions} movements · {x.quantity} units
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <h4 className="mb-3 font-bold">Replenishment alerts</h4>
                <div className="space-y-2">
                  {(report?.low_stock_items || []).map((x: any) => (
                    <div
                      key={`${x.sku}-${x.warehouse_name}-${x.bin_location}`}
                      className="flex flex-wrap items-center justify-between gap-2 border border-[var(--ui-border)] p-3 text-sm"
                    >
                      <span className="font-semibold">
                        {x.sku} · {x.item_name}
                      </span>
                      <span className="text-[var(--ui-text-secondary)]">
                        {x.warehouse_name} / {x.bin_location} · available{" "}
                        {x.available} · minimum {x.reorder_level}
                      </span>
                    </div>
                  ))}
                  {!report?.low_stock_items?.length && (
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      No items currently below reorder level.
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-5 text-xs text-[var(--ui-text-muted)]">
                {report?.catalogue_linked_skus || 0} SKUs linked to Huntr
                Catalogue
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
