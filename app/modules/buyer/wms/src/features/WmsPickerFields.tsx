import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import { ChevronRight, Search, Warehouse } from "lucide-react";
import type { PickerItem } from "../components/GenericPickerModal";
import type { StockPickerItem } from "../components/StockPickerModal";
import { formatQuantity, toNumeric } from "../data/quantity";

const browseButtonClass =
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] px-3 py-2 text-left text-sm text-[var(--ui-text-primary)] outline-none transition-all hover:border-[var(--ui-text-brand)]/60 hover:bg-[var(--ui-bg-input)]";
const inputClass =
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none transition-colors focus:border-[var(--ui-text-brand)]";

type Selection = PickerItem | StockPickerItem | null;

export function PickerBrowseButton({
  label,
  placeholder,
  selected,
  onClick,
  helperText,
}: {
  label: string;
  placeholder: string;
  selected: Selection;
  onClick: () => void;
  helperText?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">{label}</div>
      <HuntrButton type="button" className={browseButtonClass} onClick={onClick}>
        {selected ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {"sku" in selected ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{selected.item_name}</span>
                    <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ui-text-brand)]">{selected.sku}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                    {selected.warehouse_name || ""}
                    {selected.bin_location ? `${selected.warehouse_name ? " · " : ""}${selected.bin_location}` : ""}
                  </div>
                </>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {selected.imageUrl && <img src={selected.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{selected.title}</div>
                    {selected.subtitle && <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">{selected.subtitle}</div>}
                  </div>
                </div>
              )}
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--ui-text-muted)]" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 text-[var(--ui-text-muted)]"><span>{placeholder}</span><Search size={15} /></div>
        )}
      </HuntrButton>
      {selected && (
        <div className="mt-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/50 px-3 py-2">
          {"sku" in selected ? (
            <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-secondary)]">
              <Warehouse size={12} className="text-[var(--ui-text-muted)]" />
              <span className="truncate">{selected.warehouse_name || "—"}{selected.bin_location ? ` · ${selected.bin_location}` : ""}</span>
              <span className="ml-auto tabular-nums font-semibold text-[var(--ui-text-success)]">available {formatQuantity(toNumeric(selected.on_hand) - toNumeric(selected.allocated))}</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {selected.meta?.slice(0, 3).map((meta, index) => <span key={index} className="flex items-center gap-1"><span className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">{meta.label}</span><span className="tabular-nums font-semibold text-[var(--ui-text-secondary)]">{meta.value}</span></span>)}
            </div>
          )}
        </div>
      )}
      {helperText && <p className="text-[11px] text-[var(--ui-text-muted)]">{helperText}</p>}
    </div>
  );
}

export function CatalogueSkuInput({
  label,
  placeholder,
  helperText,
  value,
  onValueChange,
  onBrowse,
}: {
  label: string;
  placeholder: string;
  helperText?: string;
  value: string;
  onValueChange: (sku: string) => void;
  onBrowse: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">{label}</div>
      <div className="flex gap-2">
        <HuntrInput className={`${inputClass} min-w-0 flex-1`} placeholder={placeholder} value={value} onChange={(event) => onValueChange(event.target.value)} />
        <HuntrButton type="button" onClick={onBrowse} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)]/40"><Search size={15} className="text-[var(--ui-text-muted)]" />Browse</HuntrButton>
      </div>
      {helperText && <p className="text-[11px] text-[var(--ui-text-muted)]">{helperText}</p>}
    </div>
  );
}
