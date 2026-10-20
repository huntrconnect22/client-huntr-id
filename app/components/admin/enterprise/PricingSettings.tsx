import { useEffect, useState } from "react";
import {
  getEnterprisePricing,
  saveEnterprisePricing,
  type EnterprisePricing,
  type EnterprisePlanConfig,
} from "../../../lib/api/admin-enterprise";
import { button, card, dateTime, field, rupiah } from "./shared";

export function PricingSettings() {
  const [pricing, setPricing] = useState<EnterprisePricing | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const result = await getEnterprisePricing();
      if (!result?.version || !Array.isArray(result.plans))
        throw new Error("Konfigurasi belum tersedia.");
      setPricing(result);
      setError("");
    } catch (err: any) {
      setError(err.message || "Konfigurasi tidak dapat dimuat.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const changePlan = (
    index: number,
    key: keyof EnterprisePlanConfig,
    value: string,
  ) => {
    setPricing(
      (previous) =>
        previous && {
          ...previous,
          plans: previous.plans.map((plan, i) =>
            i === index
              ? { ...plan, [key]: key === "support" ? value : Number(value) }
              : plan,
          ),
        },
    );
    setNotice("");
  };
  const save = async () => {
    if (!pricing) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await saveEnterprisePricing({
        version: pricing.version,
        plans: pricing.plans.map(
          ({
            key,
            monthly_price,
            annual_price,
            users,
            companies,
            tax_documents_per_year,
            support,
            warehouses,
            ai_requests_per_month,
          }) => ({
            key,
            monthly_price,
            annual_price,
            users,
            companies,
            tax_documents_per_year,
            support,
            warehouses,
            ai_requests_per_month,
          }),
        ),
        addons: pricing.addons.map(({ key, price }) => ({ key, price })),
      });
      if (!result?.version) throw new Error("Konfigurasi belum tersimpan.");
      await load();
      setNotice("Konfigurasi tersimpan untuk pembelian berikutnya.");
    } catch (err: any) {
      setError(err.message || "Konfigurasi tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };
  if (!pricing)
    return (
      <div className={`${card} p-5 text-sm`}>
        {error || "Memuat konfigurasi..."}{" "}
        {error && (
          <button className={`${button} ml-2`} onClick={load}>
            Coba lagi
          </button>
        )}
      </div>
    );
  const numericFields: {
    key: keyof EnterprisePlanConfig;
    label: string;
    min: number;
  }[] = [
    { key: "monthly_price", label: "Harga bulanan (Rp)", min: 1 },
    { key: "annual_price", label: "Harga tahunan (Rp)", min: 1 },
    { key: "users", label: "Pengguna", min: 1 },
    { key: "companies", label: "Company", min: 1 },
    { key: "tax_documents_per_year", label: "e-Faktur / tahun", min: 0 },
    { key: "warehouses", label: "Warehouse", min: 0 },
    { key: "ai_requests_per_month", label: "Request AI / bulan", min: 0 },
  ];
  return (
    <div className="space-y-4">
      <div className={`${card} p-4 text-sm`}>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h3 className="m-0 font-bold">Konfigurasi paket Enterprise</h3>
            <p className="mb-0 mt-1 text-xs text-[var(--ui-text-muted)]">
              Perubahan berlaku untuk pembelian berikutnya. Harga dan kuota
              kontrak yang sudah dibeli tetap mengikuti saat pembelian.
            </p>
          </div>
          <span className="text-xs text-[var(--ui-text-muted)]">
            Checkout Midtrans:{" "}
            {pricing.checkout_enabled ? "Aktif" : "Belum diaktifkan"}
          </span>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {pricing.plans.map((plan, index) => (
          <section className={`${card} p-4`} key={plan.key}>
            <h4 className="m-0 text-sm font-bold">{plan.name}</h4>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {numericFields.map(({ key, label, min }) => (
                <label
                  className="text-xs text-[var(--ui-text-muted)]"
                  key={key}
                >
                  {label}
                  <input
                    className={`${field} mt-1`}
                    type="number"
                    min={min}
                    step="1"
                    value={String(plan[key])}
                    onChange={(e) => changePlan(index, key, e.target.value)}
                  />
                </label>
              ))}
              <label className="text-xs text-[var(--ui-text-muted)]">
                SLA support
                <input
                  className={`${field} mt-1`}
                  value={plan.support}
                  onChange={(e) => changePlan(index, "support", e.target.value)}
                />
              </label>
            </div>
            <p className="mb-0 mt-3 text-xs text-[var(--ui-text-muted)]">
              Setara {rupiah(Math.round(plan.annual_price / 12))} / bulan pada
              pembayaran tahunan.
            </p>
          </section>
        ))}
      </div>
      <section className={`${card} p-4`}>
        <h4 className="m-0 text-sm font-bold">Harga add-on</h4>
        <p className="text-xs text-[var(--ui-text-muted)]">
          Top-up berlaku hingga akhir tahun paket; add-on pengguna dan warehouse
          berlaku satu bulan per pembayaran.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {pricing.addons.map((addon, index) => (
            <label
              className="text-xs text-[var(--ui-text-muted)]"
              key={addon.key}
            >
              {addon.name} · {addon.quantity.toLocaleString("id-ID")}{" "}
              {addon.unit}
              {addon.billing_cycle === "monthly" ? " / bulan" : ""}
              <input
                type="number"
                min="1"
                step="1"
                className={`${field} mt-1`}
                value={addon.price}
                onChange={(event) => {
                  const price = Number(event.target.value);
                  setPricing(
                    (previous) =>
                      previous && {
                        ...previous,
                        addons: previous.addons.map((item, i) =>
                          i === index ? { ...item, price } : item,
                        ),
                      },
                  );
                  setNotice("");
                }}
              />
            </label>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="bg-orange-500 px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Menyimpan..." : "Simpan konfigurasi"}
        </button>
        <button className={button} disabled={saving} onClick={load}>
          Muat ulang
        </button>
        {notice && (
          <span role="status" className="text-sm text-emerald-600">
            {notice}
          </span>
        )}
        {error && (
          <span role="alert" className="text-sm text-red-500">
            {error}
          </span>
        )}
      </div>
      <section className={`${card} p-4`}>
        <h4 className="m-0 text-sm font-bold">Riwayat perubahan</h4>
        <p className="text-xs text-[var(--ui-text-muted)]">
          Sepuluh perubahan terakhir.
        </p>
        {pricing.audit?.length ? (
          <div className="space-y-2">
            {pricing.audit.map((item) => (
              <details
                key={item.id}
                className="border-t border-[var(--ui-border)] pt-2 text-xs"
              >
                <summary className="cursor-pointer">
                  {dateTime(item.created_at)} · {item.admin_name || "Admin"}
                </summary>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <strong>Sebelum</strong>
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(item.before), null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>Sesudah</strong>
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(item.after), null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--ui-text-muted)]">
            Belum ada perubahan.
          </p>
        )}
      </section>
    </div>
  );
}
