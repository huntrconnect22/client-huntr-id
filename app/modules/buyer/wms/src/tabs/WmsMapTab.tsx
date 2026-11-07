import React from "react";
import { WarehouseMap } from "../components/WarehouseMap";
import type { PickerItem } from "../components/GenericPickerModal";
import type { StockPickerItem } from "../components/StockPickerModal";

interface Props {
  company: any;
  warehouses: any[];
  stock: any[];
  refresh: () => void;
  setPutawayForm: React.Dispatch<React.SetStateAction<any>>;
  setTransferForm: React.Dispatch<React.SetStateAction<any>>;
  setAdjustForm: React.Dispatch<React.SetStateAction<any>>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setTab: (tab: any) => void;
}

export function WmsMapTab({
  company,
  warehouses,
  stock,
  refresh,
  setPutawayForm,
  setTransferForm,
  setAdjustForm,
  setSelections,
  setTab,
}: Props) {
  return (
    <WarehouseMap
      companyId={company.id}
      warehouses={warehouses}
      stock={stock}
      onTransferComplete={refresh}
      onOpenOperation={(action, { warehouse, bin, item }) => {
        const warehouseSelection: PickerItem = {
          id: String(warehouse.id),
          title: warehouse.name,
          subtitle: `${warehouse.code} · ${warehouse.address || "—"}`,
          meta: [{ label: "Bins", value: String(warehouse.bins?.length || 0), tone: "muted" }],
        };
        const binSelection: PickerItem = {
          id: String(bin.id),
          title: bin.code,
          subtitle: `${bin.name || "Tanpa nama"} · ${bin.type}`,
          meta: [{ label: "Status", value: bin.status || "active", tone: "success" }],
        };
        const stockSelection = item
          ? ({
              id: String(item.id || item.sku),
              sku: item.sku,
              item_name: item.item_name || item.sku,
              uom: item.uom || "unit",
              bin_location: bin.code,
              bin_id: String(bin.id),
              warehouse_id: String(warehouse.id),
              warehouse_name: warehouse.name,
              warehouse_code: warehouse.code,
              on_hand: item.on_hand || 0,
              allocated: item.allocated || 0,
            } as StockPickerItem)
          : null;

        if (action === "putaway") {
          setPutawayForm((current: any) => ({
            ...current,
            warehouse_id: String(warehouse.id),
            to_bin_id: String(bin.id),
          }));
          setSelections((current) => ({
            ...current,
            putaway_warehouse: warehouseSelection,
            putaway_to_bin: binSelection,
          }));
          setTab("Receiving & Put Away");
          return;
        }

        if (action === "transfer") {
          setTransferForm((current: any) => ({
            ...current,
            from_warehouse_id: String(warehouse.id),
            from_bin: bin.code,
            sku: item?.sku || "",
            quantity: "",
          }));
          setSelections((current) => ({
            ...current,
            transfer_from_wh: warehouseSelection,
            transfer_from_bin: binSelection,
            transfer_sku: stockSelection,
          }));
          setTab("Transfers");
          return;
        }

        setAdjustForm((current: any) => ({
          ...current,
          warehouse_id: String(warehouse.id),
          sku: item?.sku || "",
          bin_location: bin.code,
        }));
        setSelections((current) => ({
          ...current,
          adjust_warehouse: warehouseSelection,
          adjust_bin: binSelection,
          adjust_sku: stockSelection,
        }));
        setTab("Adjustments");
      }}
    />
  );
}

