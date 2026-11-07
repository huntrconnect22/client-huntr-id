import React from "react";
import { Layers } from "lucide-react";
import { RackManagement } from "../components/RackManagement";

interface Props {
  warehouses: any[];
  company: any;
  refresh: () => void;
  setPutawayForm: React.Dispatch<React.SetStateAction<any>>;
  setTab: (tab: any) => void;
}

export function WmsRacksTab({
  warehouses,
  company,
  refresh,
  setPutawayForm,
  setTab,
}: Props) {
  return (
    <div className="space-y-4">
      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] py-16 text-center">
          <Layers size={36} className="text-[var(--ui-text-muted)] opacity-40" />
          <div>
            <p className="font-semibold text-[var(--ui-text-primary)]">Belum ada gudang</p>
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Buat gudang terlebih dahulu di tab Warehouses, lalu kembali ke sini untuk mengatur rak.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTab("Warehouses")}
            className="rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-semibold text-white"
          >
            Buka Tab Warehouses
          </button>
        </div>
      ) : (
        <RackManagement
          companyId={company.id}
          warehouses={warehouses}
          onRefresh={refresh}
          onNavigateToPutAway={(warehouseId, _binId) => {
            setPutawayForm((prev: any) => ({
              ...prev,
              warehouse_id: warehouseId,
            }));
            setTab("Receiving & Put Away");
          }}
        />
      )}
    </div>
  );
}

