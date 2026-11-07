import React, { useMemo } from "react";
import type { PickerItem } from "./GenericPickerModal";
import { GenericPickerModal } from "./GenericPickerModal";
import type { StockPickerItem } from "./StockPickerModal";
import { StockPickerModal } from "./StockPickerModal";
import { formatQuantity, toNumeric } from "../data/quantity";

interface Props {
  picker: { open: boolean; kind: string | null };
  closePicker: () => void;
  warehouses: any[];
  stock: any[];
  inboundOrders: any[];
  cataloguePickerItems: PickerItem[];
  receiveForm: any;
  setReceiveForm: React.Dispatch<React.SetStateAction<any>>;
  putawayForm: any;
  setPutawayForm: React.Dispatch<React.SetStateAction<any>>;
  allocateForm: any;
  setAllocateForm: React.Dispatch<React.SetStateAction<any>>;
  transferForm: any;
  setTransferForm: React.Dispatch<React.SetStateAction<any>>;
  adjustForm: any;
  setAdjustForm: React.Dispatch<React.SetStateAction<any>>;
  selections: Record<string, any>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function WmsPickerModals({
  picker,
  closePicker,
  warehouses,
  stock,
  inboundOrders,
  cataloguePickerItems,
  receiveForm,
  setReceiveForm,
  putawayForm,
  setPutawayForm,
  allocateForm,
  setAllocateForm,
  transferForm,
  setTransferForm,
  adjustForm,
  setAdjustForm,
  selections,
  setSelections,
}: Props) {
  const conditionPickerItems: PickerItem[] = useMemo(
    () => [
      {
        id: "good",
        title: "Good — Diterima Penuh",
        subtitle: "Semua barang lolos inspeksi dan diterima sesuai pesanan",
        meta: [
          { label: "Status", value: "Accepted", tone: "success" as const },
          { label: "Tindakan", value: "Stok langsung ditambahkan", tone: "muted" as const },
        ],
      },
      {
        id: "damaged",
        title: "Damaged — Barang Rusak",
        subtitle: "Sebagian atau seluruh barang tiba dalam kondisi rusak",
        meta: [
          { label: "Status", value: "Perlu ditinjau", tone: "brand" as const },
          { label: "Tindakan", value: "Catat di inspection notes", tone: "muted" as const },
        ],
      },
      {
        id: "short",
        title: "Short Shipment — Kurang Kiriman",
        subtitle: "Jumlah barang yang diterima kurang dari yang dipesan",
        meta: [
          { label: "Status", value: "Kekurangan", tone: "muted" as const },
          { label: "Tindakan", value: "Input qty aktual diterima", tone: "muted" as const },
        ],
      },
      {
        id: "other",
        title: "Other — Kondisi Lainnya",
        subtitle: "Kondisi tidak sesuai kategori di atas, perlu catatan manual",
        meta: [
          { label: "Status", value: "Manual review", tone: "default" as const },
          { label: "Tindakan", value: "Wajib isi inspection notes", tone: "muted" as const },
        ],
      },
    ],
    [],
  );

  const warehousePickerItems: PickerItem[] = useMemo(
    () =>
      warehouses.map((w: any) => ({
        id: String(w.id),
        title: w.name,
        subtitle: `Kode: ${w.code}${w.address ? ` · ${w.address}` : ""}`,
        meta: [
          {
            label: "Bins",
            value: String(w.bins?.length || 0),
            tone: (w.bins?.length || 0) > 0 ? ("success" as const) : ("muted" as const),
          },
          {
            label: "Kode",
            value: w.code || "—",
            tone: "brand" as const,
          },
        ],
      })),
    [warehouses],
  );

  const poPickerItems: PickerItem[] = useMemo(
    () =>
      inboundOrders.map((po: any) => {
        const openLines = (po.lines || []).filter((l: any) => Number(l.remaining_quantity || 0) > 0).length;
        return {
          id: String(po.id),
          title: po.po_number,
          subtitle: po.vendor_name || "Vendor tidak diketahui",
          meta: [
            {
              label: "Lines",
              value: String(po.lines?.length || 0),
              tone: "muted" as const,
            },
            {
              label: "Sisa Open",
              value: String(openLines),
              tone: openLines > 0 ? ("brand" as const) : ("muted" as const),
            },
          ],
        };
      }),
    [inboundOrders],
  );

  const poLinePickerItems: PickerItem[] = useMemo(() => {
    const po = inboundOrders.find(
      (x: any) => String(x.id) === String(receiveForm.purchase_order_id),
    );
    return (po?.lines || [])
      .filter((line: any) => Number(line.remaining_quantity || 0) > 0)
      .map((line: any) => ({
        id: String(line.sku),
        title: line.name || line.sku,
        subtitle: `SKU: ${line.sku}${line.uom ? ` · ${line.uom}` : ""}`,
        meta: [
          {
            label: "Dipesan",
            value: String(line.ordered_quantity || line.quantity || 0),
            tone: "muted" as const,
          },
          {
            label: "Sisa diterima",
            value: String(line.remaining_quantity || 0),
            tone: "brand" as const,
          },
        ],
      }));
  }, [inboundOrders, receiveForm.purchase_order_id]);

  const putawayBinItems = useMemo(() => {
    const bins =
      warehouses.find((w: any) => String(w.id) === putawayForm.warehouse_id)
        ?.bins || [];
    const mapBin = (bin: any, forStorage = false) => {
      const binTypeLabel = `${String(bin.type || "storage").charAt(0).toUpperCase()}${String(bin.type || "storage").slice(1)}`;
      const capacity = toNumeric(bin.capacity_units);
      const totalUnits = toNumeric(bin.total_units);
      return {
        id: String(bin.id),
        title: bin.code,
        subtitle: `${bin.name || "Tanpa nama"} · ${binTypeLabel}`,
        tags: [binTypeLabel],
        meta: [
          {
            label: "Status",
            value: bin.status || "active",
            tone: bin.status === "active" ? ("success" as const) : ("muted" as const),
          },
          forStorage
            ? {
                label: "Kapasitas",
                value: capacity > 0 ? `${formatQuantity(totalUnits)}/${formatQuantity(capacity)}` : "Tidak dibatasi",
                tone: "muted" as const,
              }
            : {
                label: "Tipe",
                value: binTypeLabel,
                tone: "brand" as const,
              },
        ],
      };
    };
    return {
      all: bins.map((bin: any) => mapBin(bin, false)),
      storage: bins
        .filter(
          (bin: any) =>
            ["storage", "picking", "packing"].includes(bin.type) &&
            bin.status === "active",
        )
        .map((bin: any) => mapBin(bin, true)),
    };
  }, [warehouses, putawayForm.warehouse_id]);

  const transferBinItems = useMemo(() => {
    const makeItems = (warehouseId: string, source: boolean): PickerItem[] => {
      const bins =
        warehouses.find((warehouse: any) => String(warehouse.id) === String(warehouseId))
          ?.bins || [];
      const stockInWarehouse = stock.filter(
        (row: any) =>
          String(row.warehouse_id) === String(warehouseId) &&
          (!transferForm.sku || row.sku === transferForm.sku),
      );
      const availableAt = (bin: any) =>
        stockInWarehouse
          .filter(
            (row: any) =>
              String(row.bin_id || "") === String(bin.id) ||
              row.bin_location === bin.code,
          )
          .reduce(
            (total: number, row: any) =>
              total + Math.max(0, toNumeric(row.on_hand) - toNumeric(row.allocated)),
            0,
          );

      return bins
        .filter((bin: any) => {
          if (bin.status !== "active") return false;
          if (!source)
            return ["receiving", "storage", "picking", "packing", "staging"].includes(
              bin.type,
            );
          return !transferForm.sku || availableAt(bin) > 0;
        })
        .map((bin: any) => {
          const available = availableAt(bin);
          const capacity = toNumeric(bin.capacity_units);
          const binTypeLabel = `${String(bin.type || "storage").charAt(0).toUpperCase()}${String(bin.type || "storage").slice(1)}`;
          return {
            id: String(bin.id),
            title: bin.code,
            subtitle: `${bin.name || "Tanpa nama"} · ${binTypeLabel}`,
            tags: [binTypeLabel],
            meta: source
              ? [
                  { label: "Tersedia", value: formatQuantity(available), tone: available > 0 ? ("success" as const) : ("muted" as const) },
                  { label: "SKU", value: transferForm.sku || "Semua", tone: "muted" as const },
                ]
              : [
                  { label: "Isi", value: capacity > 0 ? `${formatQuantity(toNumeric(bin.total_units))}/${formatQuantity(capacity)}` : formatQuantity(toNumeric(bin.total_units)), tone: "brand" as const },
                  { label: "Kapasitas", value: capacity > 0 ? formatQuantity(capacity) : "Tidak dibatasi", tone: "muted" as const },
                ],
          };
        });
    };

    return {
      source: makeItems(transferForm.from_warehouse_id, true),
      destination: makeItems(transferForm.to_warehouse_id, false),
    };
  }, [stock, transferForm.from_warehouse_id, transferForm.sku, transferForm.to_warehouse_id, warehouses]);

  const adjustBinItems = useMemo<PickerItem[]>(() => {
    const bins =
      warehouses.find(
        (warehouse: any) => String(warehouse.id) === String(adjustForm.warehouse_id),
      )?.bins || [];
    const stockAtBin = (bin: any) =>
      stock.filter(
        (row: any) =>
          String(row.warehouse_id) === String(adjustForm.warehouse_id) &&
          row.sku === adjustForm.sku &&
          (String(row.bin_id || "") === String(bin.id) || row.bin_location === bin.code),
      );

    return bins
      .filter((bin: any) => bin.status === "active")
      .filter((bin: any) => !adjustForm.sku || stockAtBin(bin).length > 0)
      .map((bin: any) => {
        const binStock = stockAtBin(bin);
        const onHand = binStock.reduce(
          (total: number, row: any) => total + toNumeric(row.on_hand),
          0,
        );
        const allocated = binStock.reduce(
          (total: number, row: any) => total + toNumeric(row.allocated),
          0,
        );
        const binTypeLabel = `${String(bin.type || "storage").charAt(0).toUpperCase()}${String(bin.type || "storage").slice(1)}`;
        return {
          id: String(bin.id),
          title: bin.code,
          subtitle: `${bin.name || "Tanpa nama"} · ${binTypeLabel}`,
          tags: [binTypeLabel],
          meta: [
            { label: "Stok sistem", value: formatQuantity(onHand), tone: "brand" as const },
            { label: "Dialokasikan", value: formatQuantity(allocated), tone: "muted" as const },
          ],
        };
      });
  }, [adjustForm.sku, adjustForm.warehouse_id, stock, warehouses]);

  const stockPickerAll: StockPickerItem[] = useMemo(
    () =>
      stock.map((x: any) => ({
        id: x.id,
        sku: x.sku,
        item_name: x.item_name,
        uom: x.uom,
        bin_location: x.bin_location,
        warehouse_id: x.warehouse_id,
        warehouse_name: x.warehouse_name,
        warehouse_code: x.warehouse_code,
        on_hand: x.on_hand,
        allocated: x.allocated,
        catalogue_id: x.catalogue_id,
        bin_id: x.bin_id,
      })),
    [stock],
  );

  return (
    <>
      <StockPickerModal
        open={
          picker.open &&
          (picker.kind === "putaway_sku" ||
            picker.kind === "allocate_sku" ||
            picker.kind === "transfer_sku" ||
            picker.kind === "adjust_sku")
        }
        onClose={closePicker}
        onSelect={(item: StockPickerItem) => {
          switch (picker.kind) {
            case "putaway_sku": {
              const matchedBin = item.bin_id
                ? putawayBinItems.all.find(
                    (b: any) => String(b.id) === String(item.bin_id),
                  )
                : item.bin_location
                  ? putawayBinItems.all.find(
                      (b: any) =>
                        b.title === item.bin_location ||
                        b.subtitle
                          ?.toLowerCase()
                          .includes(item.bin_location!.toLowerCase()),
                    )
                  : null;
              setPutawayForm((prev: any) => ({
                ...prev,
                sku: item.sku,
                from_bin_id: matchedBin ? matchedBin.id : prev.from_bin_id,
              }));
              setSelections((prev) => ({
                ...prev,
                putaway_sku: item,
                ...(matchedBin ? { putaway_from_bin: matchedBin } : {}),
              }));
              break;
            }
            case "allocate_sku":
              setAllocateForm({ ...allocateForm, sku: item.sku });
              setSelections((prev) => ({ ...prev, allocate_sku: item }));
              break;
            case "transfer_sku":
              setTransferForm({ ...transferForm, sku: item.sku, from_bin: "" });
              setSelections((prev) => ({
                ...prev,
                transfer_sku: item,
                transfer_from_bin: null,
              }));
              break;
            case "adjust_sku":
              setAdjustForm({ ...adjustForm, sku: item.sku, bin_location: "" });
              setSelections((prev) => ({
                ...prev,
                adjust_sku: item,
                adjust_bin: null,
              }));
              break;
          }
          closePicker();
        }}
        items={(() => {
          switch (picker.kind) {
            case "putaway_sku":
              return stockPickerAll.filter(
                (item: StockPickerItem) =>
                  String(item.warehouse_id) === String(putawayForm.warehouse_id) &&
                  toNumeric(item.on_hand) - toNumeric(item.allocated) > 0,
              );
            case "allocate_sku":
              return stockPickerAll.filter(
                (item: StockPickerItem) =>
                  String(item.warehouse_id) === String(allocateForm.warehouse_id) &&
                  toNumeric(item.on_hand) - toNumeric(item.allocated) > 0,
              );
            case "transfer_sku":
              return stockPickerAll.filter(
                (item: StockPickerItem) =>
                  String(item.warehouse_id) === String(transferForm.from_warehouse_id) &&
                  toNumeric(item.on_hand) - toNumeric(item.allocated) > 0,
              );
            case "adjust_sku":
              return stockPickerAll.filter(
                (item: StockPickerItem) =>
                  String(item.warehouse_id) === String(adjustForm.warehouse_id),
              );
            default:
              return [];
          }
        })()}
      />

      <GenericPickerModal
        open={
          picker.open &&
          (picker.kind === "receive_warehouse" ||
            picker.kind === "receive_po" ||
            picker.kind === "receive_po_line" ||
            picker.kind === "receive_condition" ||
            picker.kind === "receive_catalogue_sku" ||
            picker.kind === "putaway_warehouse" ||
            picker.kind === "putaway_from_bin" ||
            picker.kind === "putaway_to_bin" ||
            picker.kind === "allocate_warehouse" ||
            picker.kind === "transfer_from_wh" ||
            picker.kind === "transfer_to_wh" ||
            picker.kind === "transfer_from_bin" ||
            picker.kind === "transfer_to_bin" ||
            picker.kind === "adjust_warehouse" ||
            picker.kind === "adjust_bin")
        }
        onClose={closePicker}
        onSelect={(item: PickerItem) => {
          switch (picker.kind) {
            case "receive_warehouse":
              setReceiveForm({ ...receiveForm, warehouse_id: item.id });
              setSelections((prev) => ({ ...prev, receive_warehouse: item }));
              break;
            case "receive_po": {
              const po = inboundOrders.find(
                (x: any) => String(x.id) === item.id,
              );
              const line = po?.lines?.find(
                (x: any) => Number(x.remaining_quantity || 0) > 0,
              );
              setReceiveForm({
                ...receiveForm,
                purchase_order_id: item.id,
                bin_location: po?.po_number || "",
                catalogue_id: line?.catalogue_id || "",
                sku: line?.sku || "",
                item_name: line?.name || "",
                quantity: line ? String(line.remaining_quantity) : "",
              });
              setSelections((prev) => {
                const catalogueItem = line
                  ? cataloguePickerItems.find(
                      (c) =>
                        (line.catalogue_id && c.id === String(line.catalogue_id)) ||
                        c.subtitle === line.sku,
                    )
                  : null;
                return {
                  ...prev,
                  receive_po: item,
                  receive_catalogue_sku: catalogueItem ?? null,
                };
              });
              break;
            }
            case "receive_po_line":
              setReceiveForm({
                ...receiveForm,
                sku: item.id,
                item_name: item.title,
              });
              setSelections((prev) => ({ ...prev, receive_po_line: item }));
              break;
            case "receive_condition":
              setReceiveForm({ ...receiveForm, condition: item.id });
              setSelections((prev) => ({ ...prev, receive_condition: item }));
              break;
            case "receive_catalogue_sku":
              setReceiveForm({
                ...receiveForm,
                catalogue_id: item.id,
                sku: item.subtitle || "",
                item_name: item.title,
              });
              setSelections((prev) => ({
                ...prev,
                receive_catalogue_sku: item,
              }));
              break;
            case "putaway_warehouse":
              setPutawayForm({
                ...putawayForm,
                warehouse_id: item.id,
                sku: "",
                from_bin_id: "",
                to_bin_id: "",
              });
              setSelections((prev) => ({
                ...prev,
                putaway_warehouse: item,
                putaway_sku: null,
                putaway_from_bin: null,
                putaway_to_bin: null,
              }));
              break;
            case "putaway_from_bin":
              setPutawayForm({ ...putawayForm, from_bin_id: item.id });
              setSelections((prev) => ({ ...prev, putaway_from_bin: item }));
              break;
            case "putaway_to_bin":
              setPutawayForm({ ...putawayForm, to_bin_id: item.id });
              setSelections((prev) => ({ ...prev, putaway_to_bin: item }));
              break;
            case "allocate_warehouse":
              setAllocateForm({
                ...allocateForm,
                warehouse_id: item.id,
                sku: "",
              });
              setSelections((prev) => ({
                ...prev,
                allocate_warehouse: item,
                allocate_sku: null,
              }));
              break;
            case "transfer_from_wh":
              setTransferForm({
                ...transferForm,
                from_warehouse_id: item.id,
                sku: "",
                from_bin: "",
              });
              setSelections((prev) => ({
                ...prev,
                transfer_from_wh: item,
                transfer_sku: null,
                transfer_from_bin: null,
              }));
              break;
            case "transfer_to_wh":
              setTransferForm({
                ...transferForm,
                to_warehouse_id: item.id,
                to_bin: "",
              });
              setSelections((prev) => ({
                ...prev,
                transfer_to_wh: item,
                transfer_to_bin: null,
              }));
              break;
            case "transfer_from_bin":
              setTransferForm({ ...transferForm, from_bin: item.title });
              setSelections((prev) => ({
                ...prev,
                transfer_from_bin: item,
              }));
              break;
            case "transfer_to_bin":
              setTransferForm({ ...transferForm, to_bin: item.title });
              setSelections((prev) => ({ ...prev, transfer_to_bin: item }));
              break;
            case "adjust_warehouse":
              setAdjustForm({
                ...adjustForm,
                warehouse_id: item.id,
                sku: "",
                bin_location: "",
              });
              setSelections((prev) => ({
                ...prev,
                adjust_warehouse: item,
                adjust_sku: null,
                adjust_bin: null,
              }));
              break;
            case "adjust_bin":
              setAdjustForm({ ...adjustForm, bin_location: item.title });
              setSelections((prev) => ({ ...prev, adjust_bin: item }));
              break;
          }
          closePicker();
        }}
        title={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
            case "putaway_warehouse":
            case "allocate_warehouse":
              return "Select warehouse";
            case "transfer_from_wh":
              return "Select source warehouse";
            case "transfer_to_wh":
              return "Select destination warehouse";
            case "receive_po":
              return "Link purchase order";
            case "receive_po_line":
              return "Select purchase order line";
            case "receive_condition":
              return "Select inspection condition";
            case "receive_catalogue_sku":
              return "Select product variant / SKU";
            case "putaway_from_bin":
              return "Select source bin";
            case "putaway_to_bin":
              return "Select destination storage bin";
            case "transfer_from_bin":
              return "Select origin bin";
            case "transfer_to_bin":
              return "Select destination bin";
            case "adjust_warehouse":
              return "Select warehouse to adjust";
            case "adjust_bin":
              return "Select bin location";
            default:
              return "Select item";
          }
        })()}
        description={(() => {
          switch (picker.kind) {
            case "receive_po":
              return "Optional. Linking a PO will pre-fill the reference, first outstanding line, and its remaining quantity.";
            case "receive_catalogue_sku":
              return "Items synced from Huntr Catalogue with their SKU codes and product names.";
            case "putaway_to_bin":
              return "Hanya bin bertipe Storage, Picking, atau Packing yang berstatus aktif.";
            case "transfer_from_bin":
              return transferForm.sku
                ? `Menampilkan bin di ${selections["transfer_from_wh"]?.title || "gudang asal"} yang memiliki stok ${transferForm.sku}.`
                : "Pilih item inventori terlebih dahulu untuk melihat bin yang menyimpan barang.";
            case "transfer_to_bin":
              return `Pilih bin tujuan di ${selections["transfer_to_wh"]?.title || "gudang penerima"}.`;
            case "adjust_bin":
              return adjustForm.sku
                ? `Menampilkan bin aktif yang mencatat stok ${adjustForm.sku}.`
                : "Semua bin aktif di gudang terpilih.";
            default:
              return undefined;
          }
        })()}
        items={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
            case "putaway_warehouse":
            case "allocate_warehouse":
            case "transfer_from_wh":
            case "transfer_to_wh":
            case "adjust_warehouse":
              return warehousePickerItems;
            case "receive_po":
              return poPickerItems;
            case "receive_po_line":
              return poLinePickerItems;
            case "receive_condition":
              return conditionPickerItems;
            case "receive_catalogue_sku":
              return cataloguePickerItems;
            case "putaway_from_bin":
              return putawayBinItems.all;
            case "putaway_to_bin":
              return putawayBinItems.storage;
            case "transfer_from_bin":
              return transferBinItems.source;
            case "transfer_to_bin":
              return transferBinItems.destination;
            case "adjust_bin":
              return adjustBinItems;
            default:
              return [];
          }
        })()}
        selectedId={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
              return receiveForm.warehouse_id || null;
            case "receive_po":
              return receiveForm.purchase_order_id || null;
            case "receive_po_line":
              return receiveForm.sku || null;
            case "receive_condition":
              return receiveForm.condition || null;
            case "receive_catalogue_sku":
              return receiveForm.catalogue_id || null;
            case "putaway_warehouse":
              return putawayForm.warehouse_id || null;
            case "putaway_from_bin":
              return putawayForm.from_bin_id || null;
            case "putaway_to_bin":
              return putawayForm.to_bin_id || null;
            case "allocate_warehouse":
              return allocateForm.warehouse_id || null;
            case "transfer_from_wh":
              return transferForm.from_warehouse_id || null;
            case "transfer_to_wh":
              return transferForm.to_warehouse_id || null;
            case "transfer_from_bin":
              return (selections["transfer_from_bin"] as PickerItem | null)?.id || null;
            case "transfer_to_bin":
              return (selections["transfer_to_bin"] as PickerItem | null)?.id || null;
            case "adjust_warehouse":
              return adjustForm.warehouse_id || null;
            case "adjust_bin":
              return (selections["adjust_bin"] as PickerItem | null)?.id || null;
            default:
              return null;
          }
        })()}
      />
    </>
  );
}

