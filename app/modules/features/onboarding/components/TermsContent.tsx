import { ScrollText } from "lucide-react";
import type { EnterpriseCatalog } from "../../../lib/api/subscription";
import { SlideSection } from "./OnboardingUI";

type Pricing = {
  catalog: EnterpriseCatalog | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
};
type Props = {
  companyType: string;
  accepted: boolean;
  onAccept: (value: boolean) => void;
  pricing: Pricing;
};

const rupiah = (value: number | null) =>
  value == null ? "—" : `Rp ${value.toLocaleString("id-ID")}`;
const number = (value: number | null) =>
  value == null ? "—" : value.toLocaleString("id-ID");

export function TermsContent({
  companyType,
  accepted,
  onAccept,
  pricing,
}: Props) {
  const buyer = companyType === "buyer";
  const ready =
    !buyer || Boolean(pricing.catalog && !pricing.loading && !pricing.error);

  return (
    <SlideSection
      title="Ketentuan Penggunaan"
      subtitle="Biaya dan persetujuan"
      icon={<ScrollText size={22} className="text-violet-500" />}
      accentColor="#8b5cf6"
    >
      <div className="space-y-4 text-sm leading-relaxed text-[var(--ui-text-secondary)]">
        <div className="rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] p-4">
          <h3 className="m-0 text-sm font-bold text-[var(--ui-text-primary)]">
            Biaya penggunaan platform
          </h3>
          <p className="mb-0 mt-2">
            Vendor tidak dikenakan biaya subscription. Buyer dapat memilih paket
            Enterprise sesuai kebutuhan perusahaan. Menyetujui ketentuan ini
            tidak membuat pembelian paket atau pembayaran otomatis.
          </p>
        </div>

        {buyer && (
          <section
            aria-labelledby="onboarding-plans"
            className="rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] p-4"
          >
            <h3
              id="onboarding-plans"
              className="m-0 text-sm font-bold text-[var(--ui-text-primary)]"
            >
              Paket untuk buyer
            </h3>
            <p className="mb-3 mt-1 text-xs text-[var(--ui-text-muted)]">
              Harga tahunan dibayar penuh di awal. Pilih paket setelah
              onboarding selesai.
            </p>
            {pricing.loading && (
              <p role="status" className="text-sm">
                Memuat harga paket terbaru...
              </p>
            )}
            {pricing.error && (
              <div role="alert" className="text-sm text-red-500">
                Harga paket belum dapat dimuat.{" "}
                <button
                  type="button"
                  onClick={pricing.retry}
                  className="font-semibold underline"
                >
                  Coba lagi
                </button>
              </div>
            )}
            {pricing.catalog && (
              <div className="grid gap-2 md:grid-cols-3">
                {pricing.catalog.plans.map((plan) => (
                  <article
                    key={plan.key}
                    className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3"
                  >
                    <h4 className="m-0 font-bold text-[var(--ui-text-primary)]">
                      {plan.name}
                    </h4>
                    <p className="mb-0 mt-2 font-semibold text-[var(--ui-text-primary)]">
                      {rupiah(plan.monthly_price)}{" "}
                      <span className="text-xs font-normal text-[var(--ui-text-muted)]">
                        / bulan
                      </span>
                    </p>
                    <p className="mb-2 mt-1 text-xs text-[var(--ui-text-muted)]">
                      {rupiah(plan.annual_price)} / tahun di muka
                      {plan.annual_price != null &&
                        ` · setara ${rupiah(Math.round(plan.annual_price / 12))} / bulan`}
                    </p>
                    <ul className="m-0 space-y-1 border-t border-[var(--ui-border)] px-0 pt-2 text-xs list-none">
                      <li>{number(plan.users)} pengguna</li>
                      <li>
                        {number(plan.tax_documents_per_year)} e-Faktur / tahun
                      </li>
                      <li>{number(plan.warehouses)} warehouse</li>
                      <li>{number(plan.ai_requests_per_month)} request AI / bulan</li>
                      <li>Support: {plan.support ?? "—"}</li>
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {buyer && pricing.catalog && (
          <section className="rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] p-4">
            <h3 className="m-0 text-sm font-bold text-[var(--ui-text-primary)]">
              Add-on
            </h3>
            <ul className="mb-2 mt-2 space-y-1 pl-5 text-xs">
              {pricing.catalog.addons.map((addon) => (
                <li key={addon.key}>
                  {addon.name}: {rupiah(addon.price)} / {number(addon.quantity)}{" "}
                  {addon.unit}
                  {addon.billing_cycle === "monthly"
                    ? " / bulan"
                    : " (sekali bayar)"}
                </li>
              ))}
            </ul>
            <p className="mb-0 text-xs text-[var(--ui-text-muted)]">
              Top-up dokumen berlaku sampai akhir tahun paket dan digunakan
              untuk e-Faktur buyer pemilik PO. Add-on pengguna dan warehouse
              berlaku satu bulan per pembayaran dan diperpanjang melalui
              pembelian kembali.
            </p>
          </section>
        )}

        {buyer && (
          <section className="rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] p-4">
            <h3 className="m-0 text-sm font-bold text-[var(--ui-text-primary)]">
              Pembayaran dan biaya transaksi
            </h3>
            <p className="mb-2 mt-2 text-xs">
              Pembayaran subscription melalui Midtrans. Tagihan dikirim ke email
              perusahaan yang terdaftar, atau email pemilik jika email
              perusahaan tidak tersedia. Onboarding standar{" "}
              {pricing.catalog
                ? `${pricing.catalog.onboarding_business_days.min}–${pricing.catalog.onboarding_business_days.max}`
                : "1–3"}{" "}
              hari kerja.
            </p>
            <p className="m-0 text-xs text-[var(--ui-text-muted)]">
              Di luar masa pembebasan biaya platform dan paket Enterprise aktif,
              sistem saat ini dapat mengenakan biaya platform berdasarkan nilai
              transaksi: 5% hingga Rp100 juta, 3% di atas Rp100 juta hingga
              Rp250 juta, dan 2% di atas Rp250 juta. Pajak dan biaya bank dapat
              berlaku sesuai rincian invoice.
            </p>
          </section>
        )}

        <label
          className={`flex items-start gap-3 rounded-lg border p-4 ${ready ? "cursor-pointer border-[var(--ui-border-input)] bg-[var(--ui-bg-input)]" : "border-[var(--ui-border)] opacity-60"}`}
        >
          <input
            type="checkbox"
            checked={accepted}
            disabled={!ready}
            onChange={(event) => onAccept(event.target.checked)}
            className="mt-1 h-4 w-4 accent-violet-600"
          />
          <span>
            Saya telah membaca, memahami, dan menyetujui ketentuan penggunaan
            serta informasi biaya di atas.
          </span>
        </label>
      </div>
    </SlideSection>
  );
}


