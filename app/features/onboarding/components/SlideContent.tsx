import { 
  Building2, MapPin, LogIn, AlertCircle, Loader2, CheckCircle2, 
  Sparkles, ShieldCheck, ShoppingBag, Store, ChevronRight, Phone, Mail, Globe, ArrowRight,
  HelpCircle, Compass, CreditCard, Receipt, Layers, Info
} from "lucide-react";
import { SlideSection, Field, FormLabel } from "./OnboardingUI";

const rupiah = (value: number | null | undefined) =>
  value == null ? "—" : `Rp ${value.toLocaleString("id-ID")}`;
const numberFormat = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("id-ID");

/**
 * SlideContent Component (Express Onboarding)
 * 
 * Pengalaman Onboarding Kilat (1-2 Menit):
 * - Slide 1: Peran Bisnis (Buyer/Vendor) & Profil Perusahaan
 * - Slide 2: Lokasi & Kontak Operasional Dasar + Jaminan Akun Starter
 * - Slide 3: Konfirmasi & Ketentuan Ringkas + Informasi Biaya
 * - Slide 4: Workspace Siap & Masuk Dashboard
 */
export const SlideContent = ({ vm, pricing, handleLoginAsCompany }: any) => {
  const {
    slide, formData, updateField,
    companies, selectedCompany, setSelectedCompany,
    termsAccepted, setTermsAccepted,
    lockedType,
    isVerifyingNpwp, npwpVerifiedData, handleVerifyNpwp, npwpConflict,
  } = vm;

  switch (slide) {
    case 1:
      return (
        <SlideSection 
          title="Profil & Peran Perusahaan" 
          subtitle="Pilih peran bisnis Anda dan tentukan identitas workspace" 
          icon={<Building2 size={22} className="text-orange-500" />} 
          accentColor="#f97316"
        >
          {/* Role Selection Cards */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <FormLabel>Peran Bisnis Utama *</FormLabel>
              <span className="text-[11px] text-[var(--ui-text-muted)] font-medium">Bisa disesuaikan nanti</span>
            </div>

            {lockedType ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-orange-500/40 bg-orange-500/10">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                  <CheckCircle2 size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-orange-400 capitalize">{lockedType}</div>
                  <div className="text-xs text-[var(--ui-text-muted)]">Peran dikunci dari workspace Anda sebelumnya</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Buyer Card */}
                <button
                  type="button"
                  onClick={() => updateField("type", "buyer")}
                  className={`
                    p-4 md:p-5 rounded-2xl text-left transition-all relative overflow-hidden group border-2
                    ${formData.type === "buyer"
                      ? "bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10"
                      : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] hover:border-orange-500/40 text-[var(--ui-text-primary)]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105
                      ${formData.type === "buyer" 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30" 
                        : "bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
                      }
                    `}>
                      <Building2 size={20} />
                    </div>
                    {formData.type === "buyer" && (
                      <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={12} />
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-sm md:text-base text-[var(--ui-text-primary)] mb-1">
                    Perusahaan Pembeli (Buyer)
                  </div>
                  <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                    Buat pengadaan tender RFQ, cari vendor terpercaya, bandingkan proposal, dan kelola Purchase Order.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                      Tender & RFQ
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                      Kelola Vendor
                    </span>
                  </div>
                </button>

                {/* Vendor Card */}
                <button
                  type="button"
                  onClick={() => updateField("type", "vendor")}
                  className={`
                    p-4 md:p-5 rounded-2xl text-left transition-all relative overflow-hidden group border-2
                    ${formData.type === "vendor"
                      ? "bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10"
                      : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] hover:border-indigo-500/40 text-[var(--ui-text-primary)]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105
                      ${formData.type === "vendor" 
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30" 
                        : "bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
                      }
                    `}>
                      <Store size={20} />
                    </div>
                    {formData.type === "vendor" && (
                      <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                        <CheckCircle2 size={12} />
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-sm md:text-base text-[var(--ui-text-primary)] mb-1">
                    Penyedia Barang / Jasa (Vendor)
                  </div>
                  <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                    Terbitkan katalog produk digital, terima undangan tender, ajukan penawaran harga, dan terima PO.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      Katalog Digital
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                      Ikut Tender
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* NPWP (Opsional - Auto-Fill Nama Perusahaan) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FormLabel>Nomor NPWP Perusahaan</FormLabel>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Opsional
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 01.234.567.8-901.000 (Boleh dilewati)"
                value={formData.tax_id}
                onChange={e => updateField("tax_id", e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none text-sm transition-all focus:border-orange-500/50"
              />
              <button
                type="button"
                onClick={handleVerifyNpwp}
                disabled={isVerifyingNpwp || !formData.tax_id}
                className={`px-4 md:px-5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                  npwpVerifiedData 
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                    : "bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {isVerifyingNpwp ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : npwpVerifiedData ? (
                  <>
                    <CheckCircle2 size={15} /> Terverifikasi
                  </>
                ) : (
                  "Cek NPWP"
                )}
              </button>
            </div>
            <p className="text-[11px] text-[var(--ui-text-muted)]">
              💡 <strong>Opsional:</strong> Masukkan NPWP jika ingin mengisi nama perusahaan secara otomatis. Boleh dilewati jika belum memegang nomor NPWP.
            </p>

            {/* NPWP Verified Success Card */}
            {npwpVerifiedData && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-300">{npwpVerifiedData.nama}</div>
                  <div className="text-[var(--ui-text-muted)] mt-0.5">
                    Status WP: <strong className="text-emerald-400">{npwpVerifiedData.statusWp || "VALID"}</strong>
                    {npwpVerifiedData.statusSpt && ` • SPT: ${npwpVerifiedData.statusSpt}`}
                  </div>
                </div>
              </div>
            )}

            {/* NPWP Conflict Banner if any */}
            {npwpConflict && formData.type && (() => {
              const duplicate = formData.type === "vendor" ? npwpConflict.vendor : npwpConflict.buyer;
              const crossType = formData.type === "vendor" ? npwpConflict.buyer : npwpConflict.vendor;
              if (duplicate) {
                return (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-red-400">NPWP sudah terdaftar sebagai {formData.type === "vendor" ? "Vendor" : "Buyer"}</div>
                      <div className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">
                        Anda tidak dapat mendaftar dua kali dengan tipe yang sama: <strong className="text-red-300">{duplicate.name}</strong>
                      </div>
                    </div>
                  </div>
                );
              }
              if (crossType) {
                return (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <CheckCircle2 size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-indigo-300">NPWP ditemukan di sisi {crossType.type === "vendor" ? "Vendor" : "Buyer"}</div>
                      <div className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">
                        NPWP ini sudah ada untuk <em>{crossType.name}</em>. Anda dapat mendaftarkan sisi {formData.type === "vendor" ? "Vendor" : "Buyer"}-nya.
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Company Name */}
          <Field 
            label="Nama Resmi Perusahaan *" 
            value={formData.company_name} 
            onChange={(v: any) => updateField("company_name", v)} 
            placeholder="Contoh: PT Sinar Abadi Solusindo" 
          />

          {/* Industry Selection */}
          <div className="flex flex-col gap-1.5">
            <FormLabel>Jenis Industri *</FormLabel>
            <div className="relative">
              <select
                value={formData.industry_type}
                onChange={e => updateField("industry_type", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none transition-all focus:border-orange-500/50"
              >
                <option value="" className="bg-[var(--ui-bg-page)]">Pilih Bidang Industri...</option>
                <option value="Technology" className="bg-[var(--ui-bg-page)]">Teknologi & IT</option>
                <option value="Manufacturing" className="bg-[var(--ui-bg-page)]">Manufaktur & Pabrikasi</option>
                <option value="Construction" className="bg-[var(--ui-bg-page)]">Konstruksi & Properti</option>
                <option value="Logistics" className="bg-[var(--ui-bg-page)]">Logistik & Distribusi</option>
                <option value="Retail" className="bg-[var(--ui-bg-page)]">Perdagangan / Retail / Grosir</option>
                <option value="Healthcare" className="bg-[var(--ui-bg-page)]">Kesehatan & Farmasi</option>
                <option value="Finance" className="bg-[var(--ui-bg-page)]">Finansial & Perbankan</option>
                <option value="Services" className="bg-[var(--ui-bg-page)]">Jasa Profesional & Konsultan</option>
                <option value="Other" className="bg-[var(--ui-bg-page)]">Lainnya</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </SlideSection>
      );

    case 2:
      return (
        <SlideSection 
          title="Lokasi & Kontak Operasional" 
          subtitle="Informasi agar mitra bisnis dan sistem Huntr dapat mengenali domisili operasional Anda" 
          icon={<MapPin size={22} className="text-blue-500" />} 
          accentColor="#3b82f6"
        >
          {/* Starter Guarantee Banner */}
          <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-500/25 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-indigo-300">
                Pendaftaran Instan — Bebas Berkas di Awal
              </div>
              <p className="text-xs text-[var(--ui-text-muted)] mt-1 leading-relaxed">
                Anda tidak perlu mengunggah NPWP, NIB, SIUP, atau nomor rekening bank hari ini. Anda langsung mendapatkan akses workspace penuh. Dokumen verifikasi dapat dilengkapi kapan saja di menu Pengaturan saat Anda siap bertransaksi.
              </p>
            </div>
          </div>

          {/* Location inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field 
              label="Kota / Wilayah Operasional *" 
              value={formData.city} 
              onChange={(v: any) => updateField("city", v)} 
              placeholder="Contoh: Jakarta Selatan, DKI Jakarta" 
            />
            <Field 
              label="Alamat Kantor Singkat" 
              value={formData.address} 
              onChange={(v: any) => updateField("address", v)} 
              placeholder="Contoh: Jl. Jend. Sudirman Kav. 21" 
            />
          </div>

          {/* Contact inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field 
              label="Email Resmi Perusahaan" 
              value={formData.email} 
              onChange={(v: any) => updateField("email", v)} 
              type="email" 
              placeholder="Contoh: info@perusahaan.com" 
            />
            <Field 
              label="Telepon / WhatsApp Perusahaan" 
              value={formData.phone} 
              onChange={(v: any) => updateField("phone", v)} 
              placeholder="Contoh: 081234567890" 
            />
          </div>
        </SlideSection>
      );

    case 3:
      return (
        <SlideSection 
          title="Konfirmasi & Buka Workspace" 
          subtitle="Tinjau ringkasan data sebelum workspace perusahaan Anda diaktifkan" 
          icon={<ShieldCheck size={22} className="text-purple-500" />} 
          accentColor="#8b5cf6"
        >
          {/* Summary Card */}
          <div className="p-5 md:p-6 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <div>
                <span className="text-[10px] font-bold text-[var(--ui-text-muted)] uppercase tracking-wider">
                  Ringkasan Workspace
                </span>
                <div className="text-base md:text-lg font-black text-[var(--ui-text-primary)] mt-0.5">
                  {formData.company_name || "Nama Perusahaan"}
                </div>
              </div>
              <span className={`
                px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider
                ${formData.type === "buyer" 
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30" 
                  : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                }
              `}>
                {formData.type === "buyer" ? "Peran: Buyer" : "Peran: Vendor"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--ui-text-muted)] block">Industri:</span>
                <span className="font-semibold text-[var(--ui-text-primary)]">{formData.industry_type || "-"}</span>
              </div>
              <div>
                <span className="text-[var(--ui-text-muted)] block">Domisili / Kota:</span>
                <span className="font-semibold text-[var(--ui-text-primary)]">{formData.city || formData.address || "-"}</span>
              </div>
              <div>
                <span className="text-[var(--ui-text-muted)] block">Email:</span>
                <span className="font-semibold text-[var(--ui-text-primary)]">{formData.email || "-"}</span>
              </div>
              <div>
                <span className="text-[var(--ui-text-muted)] block">Kontak / Telepon:</span>
                <span className="font-semibold text-[var(--ui-text-primary)]">{formData.phone || "-"}</span>
              </div>
              {formData.tax_id && (
                <div>
                  <span className="text-[var(--ui-text-muted)] block">NPWP Perusahaan:</span>
                  <span className="font-semibold text-emerald-400">{formData.tax_id}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--ui-border)] flex items-center gap-2 text-xs text-indigo-400">
              <Sparkles size={14} className="shrink-0" />
              <span>Status awal: <strong>Akun Starter (Akses Eksplorasi Penuh Aktif)</strong></span>
            </div>
          </div>

          {/* Informasi Biaya & Ketentuan Layanan */}
          <div className="flex flex-col gap-3">
            {/* Kartu Ringkasan Biaya Utama */}
            <div className="p-4 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ui-text-primary)]">
                <CreditCard size={18} className="text-orange-500 shrink-0" />
                <span>Informasi Biaya Penggunaan Platform</span>
              </div>
              <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed m-0">
                {formData.type === "buyer" ? (
                  <>
                    <strong>Buyer</strong> dapat langsung menggunakan akun Starter untuk eksplorasi dan pembuatan tender. Tersedia pilihan paket Enterprise tahunan untuk kapasitas pengguna, e-Faktur, dan multi-warehouse yang lebih besar.
                    <span className="text-orange-400 font-medium block mt-1">
                      💡 Menyetujui ketentuan ini tidak menimbulkan tagihan atau pemotongan pembayaran otomatis apapun saat registrasi.
                    </span>
                  </>
                ) : (
                  <>
                    <strong>Vendor / Pemasok</strong> tidak dikenakan biaya langganan bulanan (bebas biaya subscription / gratis). Anda dapat langsung menerima permintaan penawaran (RFQ) dan tender setelah workspace dibuat.
                  </>
                )}
              </p>
            </div>

            {/* Jika Buyer, Tampilkan Rincian Paket Enterprise & Add-on */}
            {formData.type === "buyer" && (
              <div className="flex flex-col gap-3">
                {/* Enterprise Plans Grid */}
                <div className="p-4 rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col gap-3">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-primary)] flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-400 shrink-0" />
                      Pilihan Paket Enterprise (Opsional)
                    </h5>
                    <span className="text-[11px] text-[var(--ui-text-muted)] block mt-0.5">
                      Harga tahunan dibayar penuh di awal. Paket dapat dipilih atau di-upgrade setelah onboarding selesai.
                    </span>
                  </div>

                  {pricing?.loading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-[var(--ui-text-muted)]">
                      <Loader2 size={16} className="animate-spin text-orange-500" />
                      <span>Memuat katalog harga paket terbaru...</span>
                    </div>
                  )}

                  {pricing?.error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
                      <span>Harga paket belum dapat dimuat saat ini.</span>
                      <button
                        type="button"
                        onClick={pricing.retry}
                        className="font-semibold underline hover:text-red-300"
                      >
                        Coba lagi
                      </button>
                    </div>
                  )}

                  {pricing?.catalog?.plans && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                      {pricing.catalog.plans.map((plan: any) => (
                        <div
                          key={plan.key}
                          className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 flex flex-col justify-between hover:border-orange-500/30 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-[var(--ui-text-primary)]">{plan.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">Enterprise</span>
                            </div>
                            <div className="text-sm font-extrabold text-[var(--ui-text-primary)]">
                              {rupiah(plan.monthly_price)}
                              <span className="text-[11px] font-normal text-[var(--ui-text-muted)]"> / bln</span>
                            </div>
                            <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5 mb-2">
                              {rupiah(plan.annual_price)} / tahun di muka
                            </div>
                          </div>
                          
                          <div className="border-t border-[var(--ui-border)] pt-2 space-y-1 text-[11px] text-[var(--ui-text-secondary)]">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--ui-text-muted)]">Pengguna:</span>
                              <span className="font-semibold">{numberFormat(plan.users)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--ui-text-muted)]">e-Faktur:</span>
                              <span className="font-semibold">{numberFormat(plan.tax_documents_per_year)} / thn</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--ui-text-muted)]">Gudang:</span>
                              <span className="font-semibold">{numberFormat(plan.warehouses)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--ui-text-muted)]">Dukungan:</span>
                              <span className="font-semibold truncate max-w-[90px]" title={plan.support}>{plan.support ?? "Standar"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add-ons Information */}
                {pricing?.catalog?.addons && (
                  <div className="p-3.5 rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs">
                    <h5 className="font-bold text-xs text-[var(--ui-text-primary)] mb-1.5 flex items-center gap-1.5">
                      <Receipt size={14} className="text-emerald-400 shrink-0" />
                      Add-on Ekstra (Sesuai Kebutuhan)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2">
                      {pricing.catalog.addons.map((addon: any) => (
                        <div key={addon.key} className="p-2 rounded bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[11px]">
                          <span className="font-semibold text-[var(--ui-text-primary)] block truncate">{addon.name}</span>
                          <span className="text-emerald-400 font-bold">{rupiah(addon.price)}</span>
                          <span className="text-[var(--ui-text-muted)]"> / {numberFormat(addon.quantity)} {addon.unit}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed m-0">
                      Top-up dokumen berlaku hingga akhir tahun paket untuk e-Faktur buyer pemilik PO. Add-on pengguna & gudang berlaku per bulan.
                    </p>
                  </div>
                )}

                {/* Ketentuan Pembayaran & Fee Transaksi */}
                <div className="p-3.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--ui-text-primary)]">
                    <Info size={14} className="text-indigo-400 shrink-0" />
                    <span>Pembayaran & Skema Transaksi Platform</span>
                  </div>
                  <p className="text-[11px] text-[var(--ui-text-secondary)] leading-relaxed m-0">
                    Pembayaran langganan diproses melalui Midtrans berizin resmi BI. Tagihan resmi dikirim ke email perusahaan yang terdaftar. Onboarding teknis paket Enterprise memerlukan waktu {pricing?.catalog ? `${pricing.catalog.onboarding_business_days.min}–${pricing.catalog.onboarding_business_days.max}` : "1–3"} hari kerja.
                  </p>
                  <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed m-0 pt-1 border-t border-[var(--ui-border)]">
                    Di luar masa pembebasan biaya platform atau paket Enterprise aktif, platform Huntr.id mengenakan skema biaya platform berjenjang sesuai nilai transaksi: <strong>5%</strong> (hingga Rp100 juta), <strong>3%</strong> (Rp100 juta hingga Rp250 juta), dan <strong>2%</strong> (di atas Rp250 juta).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="p-4 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)]">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-orange-500 focus:ring-orange-500/30 cursor-pointer accent-orange-500 shrink-0"
              />
              <span className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                Saya telah membaca, memahami, dan menyetujui <span className="text-orange-400 font-semibold underline underline-offset-2">Syarat & Ketentuan Layanan</span>, <span className="text-orange-400 font-semibold underline underline-offset-2">Kebijakan Privasi</span>, serta <span className="text-orange-400 font-semibold underline underline-offset-2">Informasi Biaya Platform Huntr.id</span> di atas, serta menyatakan bahwa data yang saya daftarkan adalah benar.
              </span>
            </label>
          </div>
        </SlideSection>
      );

    case 4:
      return (
        <SlideSection 
          title="Workspace Berhasil Dibuat!" 
          subtitle="Selamat datang di platform pengadaan & tender modern Huntr.id" 
          icon={<CheckCircle2 size={24} className="text-emerald-500" />} 
          accentColor="#10b981"
        >
          <div className="flex flex-col gap-4 text-center items-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles size={32} />
            </div>

            <div className="max-w-md">
              <h3 className="text-xl font-extrabold text-[var(--ui-text-primary)]">
                {selectedCompany?.name || formData.company_name}
              </h3>
              <p className="text-xs text-[var(--ui-text-secondary)] mt-1.5 leading-relaxed">
                Akun Starter perusahaan Anda telah siap. Anda dapat langsung mengundang rekan kerja, melihat katalog produk, atau mempublikasikan tender pengadaan pertama Anda.
              </p>
            </div>

            {/* Selected Company Card */}
            {companies && companies.length > 0 && (
              <div className="w-full flex flex-col gap-2 mt-2">
                {companies.map((c: any) => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCompany(c)} 
                    className={`
                      p-4 rounded-xl text-left transition-all border flex items-center justify-between
                      ${selectedCompany?.id === c.id 
                        ? "bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-sm shadow-orange-500/10" 
                        : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] hover:border-orange-500/30 text-[var(--ui-text-primary)]"
                      }
                    `}
                  >
                    <div>
                      <div className={`font-semibold text-sm ${selectedCompany?.id === c.id ? "text-orange-400" : "text-[var(--ui-text-primary)]"}`}>
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[var(--ui-text-muted)] uppercase tracking-wider mt-0.5">
                        Tipe: {c.type || formData.type || "Perusahaan"} • Starter Tier
                      </div>
                    </div>
                    {selectedCompany?.id === c.id && (
                      <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={handleLoginAsCompany} 
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-orange-500/25 mt-3 flex items-center justify-center gap-2"
            >
              Masuk ke Workspace Sekarang <ArrowRight size={16} />
            </button>
          </div>
        </SlideSection>
      );

    default:
      return null;
  }
};
