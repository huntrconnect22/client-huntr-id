import React from "react";
import { 
  Building2, MapPin, CreditCard, UploadCloud, FileText, 
  LogIn, AlertCircle, Loader2, CheckCircle2, X, Plus, 
  FileSpreadsheet, MapPinPlus, ScrollText
} from "lucide-react";
import { SlideSection, Field, FormLabel } from "./OnboardingUI";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { LocationStep } from "./LocationStep";

/**
 * SlideContent Component
 * 
 * Tanggung jawab: Me-render konten form spesifik berdasarkan slide aktif.
 * Memisahkan logika render yang panjang dari file route utama.
 */
export const SlideContent = ({ vm, docType, setDocType, docInputRef, handleLoginAsCompany }: any) => {
  const { slide, formData, updateField, isVerifyingNpwp, npwpVerifiedData, handleVerifyNpwp, uploadedDocs, setUploadedDocs, isUploadingDoc, handleDocUpload, selectedFile, setSelectedFile, companies, selectedCompany, setSelectedCompany, termsAccepted, setTermsAccepted } = vm;

  /**
   * Check if country is Indonesia
   */
  const isIndonesia = (): boolean => {
    const country = formData.country?.toUpperCase();
    return country === "ID" || country === "INDONESIA";
  };

  switch (slide) {
    case 1:
      return (
        <SlideSection title="Profil Perusahaan" subtitle="Informasi dasar & identitas" icon={<Building2 size={22} className="text-orange-500" />} accentColor="#f97316">
          <div className="flex flex-col gap-2">
            <FormLabel>Negara & Tax ID{isIndonesia() ? " (NPWP) *" : ""}</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={formData.country}
                onChange={e => updateField("country", e.target.value)}
                className="px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none"
              >
                <option value="ID">Indonesia</option>
                <option value="MY">Malaysia</option>
                <option value="SG">Singapore</option>
              </select>
              <div className="md:col-span-2 flex gap-2">
                <input 
                  type="text" 
                  placeholder={formData.country === 'ID' ? "01.234.567.8-901.000" : "Tax ID / UEN"} 
                  value={formData.tax_id} 
                  onChange={e => updateField("tax_id", e.target.value)} 
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm" 
                />
                {isIndonesia() && (
                  <button 
                    onClick={handleVerifyNpwp} 
                    disabled={isVerifyingNpwp || !formData.tax_id} 
                    className={`px-4 md:px-6 rounded-xl font-bold text-xs transition-all ${npwpVerifiedData ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20"}`}
                  >
                    {isVerifyingNpwp ? <Loader2 size={16} className="animate-spin" /> : npwpVerifiedData ? <CheckCircle2 size={16} /> : "Verifikasi"}
                  </button>
                )}
              </div>
            </div>
            {npwpVerifiedData && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-sm font-bold text-[var(--ui-text-primary)]">{npwpVerifiedData.nama}</div>
                <div className="text-[10px] text-[var(--ui-text-muted)] uppercase tracking-widest mt-0.5">Status: <span className="text-emerald-400 font-bold">{npwpVerifiedData.statusWp || npwpVerifiedData.status || "Aktif"}</span></div>
              </div>
            )}
          </div>
          <Field label="Nama Perusahaan *" value={formData.company_name} onChange={(v:any) => updateField("company_name", v)} placeholder="Contoh: PT Tunas Global Teknologi" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <FormLabel>Jenis Industri *</FormLabel>
              <select
                value={formData.industry_type}
                onChange={e => updateField("industry_type", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none"
              >
                <option value="" className="bg-[var(--ui-bg-page)]">Pilih Jenis Industri...</option>
                <option value="Technology" className="bg-[var(--ui-bg-page)]">Technology</option>
                <option value="Manufacturing" className="bg-[var(--ui-bg-page)]">Manufacturing</option>
                <option value="Logistics" className="bg-[var(--ui-bg-page)]">Logistics</option>
                <option value="Healthcare" className="bg-[var(--ui-bg-page)]">Healthcare</option>
                <option value="Retail" className="bg-[var(--ui-bg-page)]">Retail</option>
                <option value="Finance" className="bg-[var(--ui-bg-page)]">Finance</option>
                <option value="Construction" className="bg-[var(--ui-bg-page)]">Construction</option>
                <option value="Services" className="bg-[var(--ui-bg-page)]">Services</option>
                <option value="Other" className="bg-[var(--ui-bg-page)]">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormLabel>Keywords / Tags</FormLabel>
            <textarea
              value={formData.keywords}
              onChange={e => updateField("keywords", e.target.value)}
              placeholder="Contoh: industrial pump, hydraulic, spare parts"
              className="w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Telepon" value={formData.phone} onChange={(v:any) => updateField("phone", v)} />
            <Field label="Email" value={formData.email} onChange={(v:any) => updateField("email", v)} type="email" />
          </div>
          <div className="flex flex-col gap-2">
            <FormLabel>Business Type *</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: "buyer", l: "Buyer" }, { v: "vendor", l: "Vendor" }].map(opt => (
                <button 
                  key={opt.v} 
                  type="button" 
                  onClick={() => updateField("type", opt.v)} 
                  className={`
                    py-3 rounded-xl font-bold text-sm transition-all border-2
                    ${formData.type === opt.v 
                      ? "bg-orange-500/10 border-orange-500/40 text-orange-400" 
                      : "bg-[var(--ui-bg-input)] border-[var(--ui-border-subtle)] text-[var(--ui-text-muted)] hover:border-[var(--ui-border-input)]"
                    }
                  `}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </SlideSection>
      );
    
    case 2:
      return (
        <SlideSection title="Location" subtitle="Business address" icon={<MapPin size={22} className="text-amber-500" />} accentColor="#f59e0b">
          <LocationStep 
            formData={formData} 
            updateField={updateField} 
            updateHqAddress={vm.updateHqAddress}
            addHqAddress={vm.addHqAddress}
            removeHqAddress={vm.removeHqAddress}
          />
        </SlideSection>
      );

    case 3:
      return (
        <SlideSection title="Banking" subtitle="Payment details" icon={<CreditCard size={22} className="text-yellow-500" />} accentColor="#fbbf24">
          <div className="flex flex-col gap-1.5">
            <FormLabel>Bank Name</FormLabel>
            <select
              value={formData.bank_name}
              onChange={e => updateField("bank_name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none"
            >
              <option value="" className="bg-[var(--ui-bg-page)]">Select Bank...</option>
              <option value="BNI" className="bg-[var(--ui-bg-page)]">BNI</option>
              <option value="Mandiri" className="bg-[var(--ui-bg-page)]">Mandiri</option>
              <option value="BCA" className="bg-[var(--ui-bg-page)]">BCA</option>
              <option value="BRI" className="bg-[var(--ui-bg-page)]">BRI</option>
            </select>
          </div>
          <Field label="Account Number" value={formData.bank_account} onChange={(v:any) => updateField("bank_account", v)} />
          <Field label="Nama Pemilik Rekening" value={formData.bank_account_name} onChange={(v:any) => updateField("bank_account_name", v)} />
        </SlideSection>
      );

    case 4:
      return (
        <SlideSection title="Dokumen" subtitle="Dokumen perusahaan & legalitas" icon={<FileText size={22} className="text-orange-500" />} accentColor="#f59e0b">
          {/* Informasi dokumen yang diperlukan */}
          <div className="mb-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <p className="text-xs text-[var(--ui-text-secondary)] mb-1 font-medium">Dokumen yang direkomendasikan:</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md">NPWP</span>
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md">KTP Direktur</span>
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md">Akta Perusahaan</span>
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md">NIB</span>
              <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md">SIUP</span>
            </div>
            <p className="text-xs text-[var(--ui-text-muted)] mt-2">Upload minimal satu dokumen untuk verifikasi perusahaan</p>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)} 
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none"
            >
              {[
                "NPWP", 
                "SIUP", 
                "NIB", 
                "KTP Direktur", 
                "Akta Perusahaan", 
                "TDP (Tanda Daftar Perusahaan)",
                "SKDP (Surat Keterangan Domisili Perusahaan)",
                "Surat Izin Usaha Perdagangan (SIUP)",
                "Surat Izin Usaha Industri (SIUI)",
                "Other"
              ].map(t => <option key={t} value={t} className="bg-[var(--ui-bg-page)]">{t}</option>)}
            </select>
            <button 
              onClick={() => docInputRef.current?.click()} 
              disabled={isUploadingDoc}
              className={`w-12 h-12 rounded-xl text-white flex items-center justify-center transition-colors shrink-0 ${isUploadingDoc ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              {isUploadingDoc ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </div>
          <input ref={docInputRef} type="file" className="hidden" onChange={e => {
            if (e.target.files?.[0]) {
              handleDocUpload(e.target.files[0], docType);
              // Reset input file agar bisa upload file yang sama lagi
              e.target.value = '';
            }
          }} />
          
          {vm.error && (
            <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                <span>Gagal upload dokumen: {vm.error}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 mt-2">
            {uploadedDocs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[var(--ui-border-input)] rounded-2xl">
                <FileText size={32} className="mx-auto text-[var(--ui-text-muted)] mb-2" />
                <p className="text-sm text-[var(--ui-text-secondary)]">Belum ada dokumen diupload</p>
                <p className="text-xs text-[var(--ui-text-muted)] mt-1">Upload minimal satu dokumen perusahaan</p>
              </div>
            ) : (
              uploadedDocs.map((d: any, i: number) => (
                <div key={i} className="p-4 bg-[var(--ui-bg-input)] border border-[var(--ui-border-subtle)] rounded-xl flex items-center justify-between group hover:border-[var(--ui-border-input)] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.file_path ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {d.file_path ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--ui-text-primary)]">{d.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--ui-text-muted)]">({d.type})</span>
                        {!d.file_path && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Error: no file_path</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setUploadedDocs((p: any) => p.filter((_: any, idx: number) => idx !== i))} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    <X size={16} className="text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </SlideSection>
      );

    case 5:
      return (
        <SlideSection title="Upload Data" subtitle="Import Initial Data" icon={<UploadCloud size={22} className="text-emerald-500" />} accentColor="#10b981">
          {/* Penjelasan upload data berdasarkan tipe perusahaan */}
          <div className="p-5 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] mb-6">
            <p className="text-sm text-[var(--ui-text-primary)] font-medium">
              {formData.type === "buyer" 
                ? "Silahkan upload historical purchase order anda disini untuk proses pembuatan analisa laporan pembelian anda dan proses migrasi data yang lebih cepat."
                : "Silahkan upload List product catalog anda disini untuk proses pembuatan online catalog dan proses migrasi data yang lebih cepat."
              }
            </p>
          </div>
          
          {/* Template Excel Download */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-[var(--ui-text-primary)] mb-3">Template Standard Excel</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a 
                href="/assets/templates/buyer-purchase-order-template.xlsx" 
                download
                className="p-4 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] hover:border-[var(--ui-border-input-focus)] transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--ui-text-primary)]">Template Purchase Order (Buyer)</div>
                  <div className="text-xs text-[var(--ui-text-muted)]">Format Excel/CSV untuk data pembelian</div>
                </div>
              </a>
              <a 
                href="/assets/templates/vendor-catalog-template.xlsx" 
                download
                className="p-4 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] hover:border-[var(--ui-border-input-focus)] transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--ui-text-primary)]">Template Product Catalog (Vendor)</div>
                  <div className="text-xs text-[var(--ui-text-muted)]">Format Excel/CSV untuk katalog produk</div>
                </div>
              </a>
            </div>
          </div>
          
          {/* Upload Area */}
          <div className="p-8 md:p-12 border-2 border-dashed border-[var(--ui-border-input)] rounded-3xl text-center bg-[var(--ui-bg-input)] hover:bg-[var(--ui-bg-input-focus)] transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-[var(--ui-bg-input)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={32} className="text-[var(--ui-text-muted)]" />
            </div>
            <p className="text-sm text-[var(--ui-text-secondary)] mb-6">{selectedFile ? selectedFile.name : "Select an Excel or CSV file to import"}</p>
            <label className="inline-flex items-center px-6 py-3 bg-[var(--ui-bg-input)] hover:bg-[var(--ui-bg-input-focus)] border border-[var(--ui-border-input)] rounded-xl text-sm font-bold text-[var(--ui-text-primary)] cursor-pointer transition-all">
              Choose File
              <input type="file" accept=".csv, .xlsx, .xls, .xlsm, .ods" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>
        </SlideSection>
      );

    case 6:
      return (
        <SlideSection title="Ketentuan Penggunaan" subtitle="Syarat & Ketentuan Platform HUNTR" icon={<ScrollText size={22} className="text-violet-500" />} accentColor="#8b5cf6">
          {/* Scrollable T&C Content */}
          <div className="max-h-[420px] overflow-y-auto pr-2 flex flex-col gap-5 text-sm text-[var(--ui-text-secondary)] leading-relaxed scrollbar-thin scrollbar-thumb-[var(--ui-border-input)] scrollbar-track-transparent">
            
            <div>
              <h3 className="text-base font-black text-[var(--ui-text-primary)] mb-3 uppercase tracking-wide">
                KETENTUAN PENGGUNAAN PLATFORM HUNTR
              </h3>
            </div>

            {/* Ayat 1 */}
            <div className="p-4 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-violet-500/15 text-violet-400 text-xs font-black flex items-center justify-center shrink-0">1</span>
                <h4 className="font-bold text-[var(--ui-text-primary)]">Masa Uji Coba Gratis (Free Trial)</h4>
              </div>
              <p>
                Masa Uji Coba Gratis berlaku selama <strong className="text-[var(--ui-text-primary)]">14 (empat belas) hari kalender</strong> terhitung sejak proses pendaftaran akun Pelanggan dinyatakan berhasil (<em>complete</em>). Setelah masa uji coba berakhir, Pelanggan akan dikenakan Biaya Layanan sesuai dengan ketentuan pada ayat (2) pada ketentuan di bawah ini.
              </p>
            </div>

            {/* Ayat 2 */}
            <div className="p-4 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-violet-500/15 text-violet-400 text-xs font-black flex items-center justify-center shrink-0">2</span>
                <h4 className="font-bold text-[var(--ui-text-primary)]">Besaran Biaya Layanan (Platform Fee)</h4>
              </div>
              <p className="mb-3">
                Biaya Layanan yang dikenakan kepada Pelanggan dihitung berdasarkan nilai transaksi dengan ketentuan sebagai berikut:
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <span className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--ui-text-primary)]">Nilai Transaksi Rp0,- s.d. Rp100.000.000,-</span>
                    <span className="text-[var(--ui-text-muted)]"> — dikenakan Biaya Layanan sebesar </span>
                    <span className="font-black text-violet-400">5% (lima persen)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <span className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--ui-text-primary)]">Nilai Transaksi Rp100.000.001,- s.d. Rp250.000.000,-</span>
                    <span className="text-[var(--ui-text-muted)]"> — dikenakan Biaya Layanan sebesar </span>
                    <span className="font-black text-violet-400">3% (tiga persen)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <span className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--ui-text-primary)]">Nilai Transaksi di atas Rp250.000.000,-</span>
                    <span className="text-[var(--ui-text-muted)]"> — dikenakan Biaya Layanan sebesar </span>
                    <span className="font-black text-violet-400">2% (dua persen)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ayat 3 */}
            <div className="p-4 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-violet-500/15 text-violet-400 text-xs font-black flex items-center justify-center shrink-0">3</span>
                <h4 className="font-bold text-[var(--ui-text-primary)]">Ketentuan Pengenaan Biaya</h4>
              </div>
              <p>
                Biaya Layanan sebagaimana dimaksud pada ketentuan nomor (2) di atas hanya dikenakan atas transaksi yang dinyatakan <strong className="text-[var(--ui-text-primary)]">berhasil (<em>successful transaction</em>)</strong>. Pelanggan yang tidak memiliki transaksi tidak akan dikenakan biaya apa pun, hingga terdapat perubahan ketentuan lebih lanjut yang diberitahukan secara resmi oleh Penyedia Platform HUNTR.
              </p>
            </div>

            {/* CTA Info */}
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 text-xs text-[var(--ui-text-muted)]">
              <span className="font-bold text-orange-400">Klik Setuju</span> jika anda sudah mengetahui tentang syarat dan ketentuan penggunaan Platform HUNTR dan untuk melanjutkan proses.{" "}
              <span className="font-bold text-[var(--ui-text-secondary)]">Klik Cancel</span> untuk membatalkan proses.
            </div>
          </div>

          {/* Checkbox Agreement */}
          <div className="mt-6">
            <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${termsAccepted ? "bg-violet-500/8 border-violet-500/40" : "bg-[var(--ui-bg-input)] border-[var(--ui-border-input)] hover:border-violet-500/30"}`}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${termsAccepted ? "bg-violet-500 border-violet-500" : "bg-transparent border-[var(--ui-border-input)]"}`}
                onClick={() => setTermsAccepted(!termsAccepted)}
              >
                {termsAccepted && <CheckCircle2 size={13} className="text-white" />}
              </div>
              <span className="text-sm text-[var(--ui-text-secondary)] select-none" onClick={() => setTermsAccepted(!termsAccepted)}>
                Saya telah membaca, memahami, dan <strong className="text-[var(--ui-text-primary)]">menyetujui</strong> seluruh Ketentuan Penggunaan Platform HUNTR di atas.
              </span>
            </label>
          </div>
        </SlideSection>
      );

    case 7:
      return (
        <SlideSection title="Berhasil!" subtitle="Workspace perusahaan Anda telah siap" icon={<LogIn size={22} className="text-orange-500" />} accentColor="#f97316">
          <div className="flex flex-col gap-3">
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
                  <div className={`font-semibold text-sm ${selectedCompany?.id === c.id ? "text-orange-400" : "text-[var(--ui-text-primary)]"}`}>{c.name}</div>
                  <div className="text-[10px] text-[var(--ui-text-muted)] uppercase tracking-wider mt-0.5">Perusahaan Terdaftar</div>
                </div>
                {selectedCompany?.id === c.id && (
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
            <button 
              onClick={handleLoginAsCompany} 
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 mt-2"
            >
              Masuk ke Workspace
            </button>
          </div>
        </SlideSection>
      );

    default:
      return null;
  }
};
