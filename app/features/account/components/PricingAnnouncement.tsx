import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { BellRing, ChevronDown, ChevronUp } from "lucide-react";
import {
  acknowledgePricingAnnouncement,
  getEnterpriseCatalog,
  getPricingAnnouncement,
  type EnterpriseCatalog,
  type PricingAnnouncement as Announcement,
} from "../../../lib/api/subscription";

interface Props {
  companyId: string;
  companyType: "buyer" | "vendor";
  companyPrefix: string;
}

const currency = (value: number | null) =>
  value == null
    ? "Hubungi kami"
    : `Rp${new Intl.NumberFormat("id-ID").format(value)}`;

export default function PricingAnnouncement({
  companyId,
  companyType,
  companyPrefix,
}: Props) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [catalog, setCatalog] = useState<EnterpriseCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let active = true;
    getPricingAnnouncement(companyId)
      .then((result) => {
        if (active && result.announcement?.id)
          setAnnouncement(result.announcement);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [companyId]);

  const toggleDetails = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (catalog || loadingCatalog) return;
    setLoadingCatalog(true);
    setCatalogError("");
    try {
      const result = await getEnterpriseCatalog();
      if (!Array.isArray(result.plans) || !Array.isArray(result.addons))
        throw new Error();
      setCatalog(result);
    } catch {
      setCatalogError(
        "Rincian paket belum dapat dimuat. Tutup dan buka kembali rincian untuk mencoba lagi.",
      );
    } finally {
      setLoadingCatalog(false);
    }
  };

  const acknowledge = async () => {
    if (!announcement || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await acknowledgePricingAnnouncement(
        companyId,
        announcement.id,
      );
      if (result.acknowledged !== true) throw new Error();
      setAnnouncement(null);
    } catch {
      setError("Pemberitahuan belum dapat disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (!announcement) return null;

  return (
    <section
      aria-label="Pemberitahuan perubahan skema biaya"
      className="border-b border-orange-500/25 bg-orange-500/5 px-4 py-3 text-sm text-[var(--ui-text-primary)] sm:px-6"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-2.5">
          <BellRing size={18} className="mt-0.5 shrink-0 text-orange-500" />
          <div>
            <h2 className="font-semibold">Skema biaya Huntr diperbarui</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ui-text-secondary)] sm:text-sm">
              {companyType === "buyer"
                ? "Paket Enterprise Starter, Growth, dan Pro tersedia untuk buyer. Langganan yang sedang berjalan tidak berubah secara otomatis."
                : "Skema paket untuk buyer diperbarui. Vendor tetap tidak dikenakan biaya langganan."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pl-7 lg:shrink-0 lg:pl-0">
          <button
            type="button"
            onClick={toggleDetails}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
          >
            {expanded ? "Tutup rincian" : "Lihat rincian"}{" "}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={acknowledge}
            disabled={saving}
            className="rounded bg-orange-600 px-3 py-1.5 text-xs font-semibold !text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Saya mengerti"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 pl-7 text-xs text-red-600">
          {error}
        </p>
      )}
      {expanded && (
        <div className="mt-3 space-y-3 pl-7 text-xs leading-relaxed text-[var(--ui-text-secondary)]">
          {loadingCatalog && <p>Memuat rincian paket...</p>}
          {catalogError && (
            <p role="alert" className="text-red-600">
              {catalogError}
            </p>
          )}
          {catalog && (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                {catalog.plans.map((plan) => (
                  <div
                    key={plan.key}
                    className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3"
                  >
                    <p className="font-semibold text-[var(--ui-text-primary)]">
                      {plan.name}
                    </p>
                    <p className="mt-1">
                      {currency(plan.monthly_price)} / bulan atau{" "}
                      {currency(plan.annual_price)} / tahun
                    </p>
                    <p>
                      {plan.users ?? "–"} pengguna ·{" "}
                      {plan.tax_documents_per_year?.toLocaleString("id-ID") ??
                        "–"}{" "}
                      e-Faktur / tahun · {plan.warehouses ?? "–"} warehouse · {plan.companies ?? "–"} company
                    </p>
                    <p>Support: {plan.support || "–"}</p>
                  </div>
                ))}
              </div>
              <p>
                Paket tahunan dibayar di awal. Vendor tidak dikenakan biaya
                langganan. Kuota e-Faktur dipotong dari paket buyer pemilik PO.
              </p>
              <p>
                Tambahan:{" "}
                {catalog.addons
                  .map(
                    (addon) =>
                      `${addon.name} ${currency(addon.price)}${addon.billing_cycle === "monthly" ? " / bulan" : ""}${addon.quantity > 1 ? ` per ${addon.quantity.toLocaleString("id-ID")} ${addon.unit}` : ""}`,
                  )
                  .join(" · ")}
                .
              </p>
              <p>
                Top-up dokumen berlaku sampai akhir tahun paket. Biaya
                transaksi, pajak, atau biaya lain dapat berlaku sesuai rincian
                invoice.
              </p>
              {!catalog.checkout_enabled && (
                <p>Pembelian paket melalui platform belum tersedia saat ini.</p>
              )}
              {companyType === "buyer" && (
                <Link
                  to={`${companyPrefix}/account?tab=subscription`}
                  className="inline-block font-semibold text-orange-600 hover:underline"
                >
                  Buka pengaturan langganan
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
