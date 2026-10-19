import { useEffect, useState } from "react";
import {
  createSubscriptionCheckout,
  getCurrentSubscriptionCheckout,
  refreshSubscriptionCheckout,
  type SubscriptionCheckout as Checkout,
  type EnterpriseAddon,
} from "../../../lib/api/subscription";
import { CheckoutModal } from "./CheckoutModal";
import { CheckoutAddonSelector } from "./CheckoutAddonSelector";

export type SubscriptionPurchase = {
  purchase_type: "plan" | "addon";
  key: string;
  name: string;
  billing_cycle: "monthly" | "annual" | "one_time";
  unit_price: number;
};

const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export function SubscriptionCheckout({
  companyId,
  catalogVersion,
  addons,
  activePlan,
  selected,
  onClose,
  onPaid,
}: {
  companyId: string;
  catalogVersion: string;
  addons: EnterpriseAddon[];
  activePlan: string | null;
  selected: SubscriptionPurchase | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [viewPending, setViewPending] = useState(false);
  const [method, setMethod] = useState("bca_va");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    getCurrentSubscriptionCheckout(companyId)
      .then((result) => {
        if (!result || !("checkout" in result)) throw new Error();
        if (active) setCheckout(result.checkout);
      })
      .catch(() => {
        if (active)
          setLoadError(
            "Pembayaran tertunda belum dapat dimuat. Coba lagi sebelum membuat pembayaran.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyId, loadAttempt]);

  useEffect(() => {
    setQuantities({});
    setError("");
  }, [selected?.key, selected?.billing_cycle]);

  const close = () => {
    setViewPending(false);
    if (
      checkout &&
      ["paid", "expire", "cancel", "deny", "failure"].includes(checkout.status)
    )
      setCheckout(null);
    onClose();
  };

  const refresh = async () => {
    if (!checkout) return;
    setBusy(true);
    setError("");
    try {
      const result = await refreshSubscriptionCheckout(companyId, checkout.id);
      if (!result?.checkout)
        throw new Error("Status pembayaran belum dapat dimuat.");
      setCheckout(result.checkout);
      if (result.checkout.status === "paid") onPaid();
    } catch (err: any) {
      setError(err.message || "Status pembayaran belum dapat dimuat.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!selected || loading || loadError || checkout || busy) return;
    setBusy(true);
    setError("");
    try {
      const selectedAddons = addons
        .filter((addon) => (quantities[addon.key] || 0) > 0)
        .map((addon) => ({ key: addon.key, quantity: quantities[addon.key] }));
      const data = activePlan
        ? {
            purchase_type: "addons",
            addons: selectedAddons,
            payment_method: method,
            catalog_version: catalogVersion,
          }
        : {
            purchase_type: "plan",
            plan: selected.key,
            billing_cycle: selected.billing_cycle,
            addons: selectedAddons,
            payment_method: method,
            catalog_version: catalogVersion,
          };
      const result = await createSubscriptionCheckout(companyId, data);
      if (!result?.checkout) throw new Error("Pembayaran belum dapat dibuat.");
      setCheckout(result.checkout);
      if (result.checkout.status === "paid") onPaid();
    } catch (err: any) {
      setError(err.message || "Pembayaran belum dapat dibuat.");
    } finally {
      setBusy(false);
    }
  };

  const selectedAddons = addons.filter(
    (addon) => (quantities[addon.key] || 0) > 0,
  );
  const addonTotal = selectedAddons.reduce(
    (sum, addon) => sum + addon.price * quantities[addon.key],
    0,
  );
  const isOpen = selected !== null || viewPending;
  const done =
    checkout &&
    ["paid", "expire", "cancel", "deny", "failure"].includes(checkout.status);
  return (
    <>
      {checkout && !isOpen && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 text-xs">
          <div>
            <p className="m-0 font-semibold text-[var(--ui-text-primary)]">
              Pembayaran {checkout.order_id}
            </p>
            <p className="mb-0 mt-1 text-[var(--ui-text-muted)]">
              {formatRupiah(checkout.amount)} · Status: {checkout.status}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewPending(true)}
            className="font-semibold text-orange-500 hover:underline"
          >
            Lihat pembayaran
          </button>
        </div>
      )}
      {loadError && !isOpen && (
        <p role="alert" className="text-xs text-red-500">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => setLoadAttempt((n) => n + 1)}
            className="font-semibold underline"
          >
            Coba lagi
          </button>
        </p>
      )}
      {isOpen && (
        <CheckoutModal onClose={close}>
          {loading ? (
            <p className="text-sm text-[var(--ui-text-muted)]">
              Memeriksa pembayaran sebelumnya...
            </p>
          ) : loadError ? (
            <p role="alert" className="text-sm text-red-500">
              {loadError}{" "}
              <button
                type="button"
                onClick={() => setLoadAttempt((n) => n + 1)}
                className="font-semibold underline"
              >
                Coba lagi
              </button>
            </p>
          ) : checkout ? (
            <div className="space-y-3 text-sm text-[var(--ui-text-secondary)]">
              {selected && !done && (
                <p>
                  Ada pembayaran yang masih diproses. Selesaikan atau periksa
                  statusnya terlebih dahulu.
                </p>
              )}
              <p>
                Referensi: <strong>{checkout.order_id}</strong>
              </p>
              <p>
                Jumlah: <strong>{formatRupiah(checkout.amount)}</strong>
              </p>
              <p>
                Status: <strong>{checkout.status}</strong>
              </p>
              {checkout.addons_snapshot?.map((addon) => (
                <p key={addon.key}>
                  {addon.name} × {addon.quantity}:{" "}
                  <strong>{formatRupiah(addon.price * addon.quantity)}</strong>
                  {addon.billing_cycle === "monthly" ? " / bulan" : ""}
                </p>
              ))}
              {checkout.payment_info?.va_number && (
                <p>
                  Virtual account:{" "}
                  <strong>{checkout.payment_info.va_number}</strong>
                </p>
              )}
              {checkout.payment_info?.biller_code && (
                <p>
                  Biller code:{" "}
                  <strong>{checkout.payment_info.biller_code}</strong>
                </p>
              )}
              {checkout.payment_info?.bill_key && (
                <p>
                  Bill key: <strong>{checkout.payment_info.bill_key}</strong>
                </p>
              )}
              {checkout.status === "unknown" && (
                <p>
                  Pembayaran sedang diperiksa. Jangan membuat pembayaran baru
                  sebelum status diketahui.
                </p>
              )}
              {!done && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={refresh}
                  className="rounded bg-orange-600 px-3 py-2 text-xs font-semibold !text-white disabled:opacity-50"
                >
                  {busy ? "Memeriksa..." : "Perbarui status"}
                </button>
              )}
              {done && (
                <button
                  type="button"
                  onClick={close}
                  className="border border-[var(--ui-border)] px-3 py-2 text-xs"
                >
                  Tutup
                </button>
              )}
            </div>
          ) : (
            selected && (
              <div className="space-y-4 text-sm text-[var(--ui-text-secondary)]">
                <p>
                  <strong className="text-[var(--ui-text-primary)]">
                    {selected.name}
                  </strong>{" "}
                  ·{" "}
                  {selected.billing_cycle === "annual"
                    ? "tahunan, dibayar di muka"
                    : selected.billing_cycle === "monthly"
                      ? "bulanan"
                      : "sekali bayar"}
                </p>
                {activePlan && (
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    Paket ini sudah aktif. Pilih add-on yang ingin Anda beli;
                    paket tidak akan ditagih kembali.
                  </p>
                )}
                <CheckoutAddonSelector
                  addons={addons}
                  quantities={quantities}
                  onChange={(key, quantity) =>
                    setQuantities((current) => ({
                      ...current,
                      [key]: quantity,
                    }))
                  }
                />
                <div className="space-y-1 border-t border-[var(--ui-border)] pt-3 text-xs">
                  {!activePlan && (
                    <p className="flex justify-between gap-2">
                      <span>{selected.name}</span>
                      <strong>{formatRupiah(selected.unit_price)}</strong>
                    </p>
                  )}
                  {selectedAddons.map((addon) => (
                    <p key={addon.key} className="flex justify-between gap-2">
                      <span>
                        {addon.name} × {quantities[addon.key]}
                      </span>
                      <strong>
                        {formatRupiah(addon.price * quantities[addon.key])}
                      </strong>
                    </p>
                  ))}
                  <p className="flex justify-between gap-2 pt-1 text-sm text-[var(--ui-text-primary)]">
                    <span>Total pembayaran saat ini</span>
                    <strong>
                      {formatRupiah(
                        (activePlan ? 0 : selected.unit_price) + addonTotal,
                      )}
                    </strong>
                  </p>
                </div>
                <label className="block">
                  Metode pembayaran{" "}
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="mt-2 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-2"
                  >
                    {["bca", "bni", "bri", "cimb", "permata", "mandiri"].map(
                      (bank) => (
                        <option key={bank} value={`${bank}_va`}>
                          {bank.toUpperCase()} virtual account
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={submit}
                  disabled={
                    busy || (!!activePlan && selectedAddons.length === 0)
                  }
                  className="rounded bg-orange-600 px-4 py-2 text-xs font-semibold !text-white disabled:opacity-50"
                >
                  {busy ? "Menyiapkan pembayaran..." : "Buat pembayaran"}
                </button>
              </div>
            )
          )}
          {error && (
            <p role="alert" className="mt-3 text-xs text-red-500">
              {error}
            </p>
          )}
        </CheckoutModal>
      )}
    </>
  );
}
