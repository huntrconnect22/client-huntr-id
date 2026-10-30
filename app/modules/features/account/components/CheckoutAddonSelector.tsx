import { Button as HuntrButton } from "~/shared/ui/Button";
import { Minus, Plus } from "lucide-react";
import type { EnterpriseAddon } from "../../../lib/api/subscription";

const rupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export function CheckoutAddonSelector({
  addons,
  quantities,
  onChange,
}: {
  addons: EnterpriseAddon[];
  quantities: Record<string, number>;
  onChange: (key: string, quantity: number) => void;
}) {
  return (
    <section className="space-y-3 border-t border-[var(--ui-border)] pt-4">
      <div>
        <h4 className="m-0 text-sm font-semibold text-[var(--ui-text-primary)]">
          Tambahkan sesuai kebutuhan
        </h4>
        <p className="mb-0 mt-1 text-xs text-[var(--ui-text-muted)]">
          Opsional. Pilih add-on yang dibutuhkan dan atur jumlahnya.
        </p>
      </div>
      {addons.map((addon) => {
        const quantity = quantities[addon.key] ?? 0;
        return (
          <div
            key={addon.key}
            className="flex items-center justify-between gap-3 border border-[var(--ui-border)] p-3"
          >
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold text-[var(--ui-text-primary)]">
                {addon.name}
              </p>
              <p className="mb-0 mt-1 text-xs text-[var(--ui-text-muted)]">
                {rupiah(addon.price)} / {addon.quantity.toLocaleString("id-ID")}{" "}
                {addon.unit}
                {addon.billing_cycle === "monthly" ? " / bulan" : ""}
              </p>
            </div>
            {quantity === 0 ? (
              <HuntrButton
                type="button"
                onClick={() => onChange(addon.key, 1)}
                aria-label={`Tambah ${addon.name}`}
                className="inline-flex shrink-0 items-center gap-1 rounded border border-orange-600 px-2.5 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-600/5"
              >
                <Plus size={14} /> Tambah
              </HuntrButton>
            ) : (
              <div
                className="inline-flex shrink-0 items-center border border-[var(--ui-border)]"
                role="group"
                aria-label={`Jumlah ${addon.name}`}
              >
                <HuntrButton
                  type="button"
                  onClick={() => onChange(addon.key, quantity - 1)}
                  aria-label={`Kurangi ${addon.name}`}
                  className="p-2 text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)]"
                >
                  <Minus size={14} />
                </HuntrButton>
                <span
                  aria-live="polite"
                  className="min-w-7 text-center text-xs font-semibold text-[var(--ui-text-primary)]"
                >
                  {quantity}
                </span>
                <HuntrButton
                  type="button"
                  onClick={() =>
                    onChange(addon.key, Math.min(100, quantity + 1))
                  }
                  aria-label={`Tambah ${addon.name}`}
                  disabled={quantity >= 100}
                  className="p-2 text-orange-600 hover:bg-[var(--ui-bg-input)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                </HuntrButton>
              </div>
            )}
          </div>
        );
      })}
      <p className="m-0 text-xs leading-relaxed text-[var(--ui-text-muted)]">
        Top-up dokumen berlaku sampai akhir tahun paket. Tambahan pengguna dan
        warehouse berlaku satu bulan dan perlu dibeli kembali untuk
        perpanjangan.
      </p>
    </section>
  );
}


