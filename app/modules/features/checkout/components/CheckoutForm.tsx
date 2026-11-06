import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Select as HuntrSelect, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React from "react";
import {
  ClipboardList,
  Building,
  MapPin,
  Calendar,
  Paperclip,
  FileText,
  Package,
  Briefcase,
  Layers,
  Zap,
  Users,
  CheckCircle2,
  Check,
  Upload,
  X,
  Info,
  Warehouse,
} from "lucide-react";
import { CheckoutServiceDetails } from "./CheckoutServiceDetails";
import { DEPARTMENT_OPTIONS, TENDER_DURATION_OPTIONS } from "../constants";
import type {
  CartItem,
  CompanyAddress,
  DurationCalculation,
  ProcurementMode,
  ProcurementType,
} from "../types";

interface CheckoutFormProps {
  procurementType: ProcurementType;
  setProcurementType: (type: ProcurementType) => void;
  procurementMode: ProcurementMode;
  setProcurementMode: (mode: ProcurementMode) => void;
  cart: CartItem[];
  prTitle: string;
  setPrTitle: (val: string) => void;
  prDepartment: string;
  setPrDepartment: (val: string) => void;
  prDesc: string;
  setPrDesc: (val: string) => void;
  prDuration: number;
  setPrDuration: (val: number) => void;
  prDocument: File | null;
  setPrDocument: (file: File | null) => void;
  deliveryPoint: string;
  setDeliveryPoint: (val: string) => void;
  companyAddresses: CompanyAddress[];
  wmsInstalled: boolean;
  warehouses: any[];
  warehouseId: string;
  warehouseDeliveryPoint: string;
  onWarehouseChange: (warehouseId: string) => void;
  // Service props
  projectType: string;
  setProjectType: (val: string) => void;
  customProjectType: string;
  setCustomProjectType: (val: string) => void;
  serviceStartDate: string;
  setServiceStartDate: (val: string) => void;
  serviceEndDate: string;
  setServiceEndDate: (val: string) => void;
  serviceWorkingSchedule: string;
  setServiceWorkingSchedule: (val: string) => void;
  serviceLocation: string;
  setServiceLocation: (val: string) => void;
  acceptanceCriteria: string;
  setAcceptanceCriteria: (val: string) => void;
  durationCalculation: DurationCalculation | null;
}

export function CheckoutForm({
  procurementType,
  setProcurementType,
  procurementMode,
  setProcurementMode,
  cart,
  prTitle,
  setPrTitle,
  prDepartment,
  setPrDepartment,
  prDesc,
  setPrDesc,
  prDuration,
  setPrDuration,
  prDocument,
  setPrDocument,
  deliveryPoint,
  setDeliveryPoint,
  companyAddresses,
  wmsInstalled,
  warehouses,
  warehouseId,
  warehouseDeliveryPoint,
  onWarehouseChange,
  projectType,
  setProjectType,
  customProjectType,
  setCustomProjectType,
  serviceStartDate,
  setServiceStartDate,
  serviceEndDate,
  setServiceEndDate,
  serviceWorkingSchedule,
  setServiceWorkingSchedule,
  serviceLocation,
  setServiceLocation,
  acceptanceCriteria,
  setAcceptanceCriteria,
  durationCalculation,
}: CheckoutFormProps) {
  return (
    <div className="space-y-6">
      {/* ── CARD 1: Metode & Objek Pengadaan ── */}
      <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--ui-border)]">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)] tracking-tight">
              Strategi & Jalur Pengadaan
            </h3>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
              Pilih klasifikasi objek pengadaan serta metode sourcing yang sesuai.
            </p>
          </div>
        </div>

        {/* 1. Objek Pengadaan (Goods / Services / Mixed) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-primary)] block">
            1. Objek Pengadaan *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: "goods",
                label: "Barang (Goods)",
                desc: "Material fisik / asset inventaris yang dapat diterima ke gudang.",
                icon: Package,
              },
              {
                value: "services",
                label: "Jasa (Services)",
                desc: "Pekerjaan profesional, perbaikan, sewa, atau konsultasi (BAST).",
                icon: Briefcase,
              },
              {
                value: "mixed",
                label: "Campuran (Mixed)",
                desc: "Pengadaan kombinasi barang dan jasa dalam 1 dokumen PR.",
                icon: Layers,
              },
            ].map((opt) => {
              const isSelected = procurementType === opt.value;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next =
                      opt.value === "services" &&
                      cart.some((item) => item.line_type !== "service")
                        ? "mixed"
                        : opt.value;
                    setProcurementType(next as any);
                    if (next === "services") onWarehouseChange("");
                  }}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/[0.08] dark:bg-orange-500/15 ring-2 ring-orange-500/30 shadow-xs"
                      : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-400/40 hover:bg-[var(--ui-bg-card)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-[var(--ui-border)] bg-[var(--ui-bg-card)]"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-sm font-bold block ${
                        isSelected ? "text-orange-500" : "text-[var(--ui-text-primary)]"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-[var(--ui-text-muted)] mt-1 block leading-relaxed">
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Jalur Pengadaan (Tender vs Direct) */}
        <div className="space-y-3 pt-4 border-t border-[var(--ui-border)]/60">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-primary)] block">
            2. Jalur Pengadaan (Procurement Route) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                mode: "tender",
                label: "Tender / Bidding Terbuka",
                badge: "Multi-Vendor Quotation",
                desc: "Publikasikan permintaan harga ke vendor-vendor terpilih atau marketplace setelah disetujui manager.",
                icon: Users,
              },
              {
                mode: "direct",
                label: "Pembelian Langsung (Direct Purchase)",
                badge: "Direct PO / Urgent",
                desc: "Langsung terbitkan Purchase Order tanpa proses tender penawaran. Cocok untuk kebutuhan cepat.",
                icon: Zap,
              },
            ].map((opt) => {
              const isSelected = procurementMode === opt.mode;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setProcurementMode(opt.mode as any);
                    if (opt.mode === "direct") setPrDocument(null);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/[0.08] dark:bg-orange-500/15 ring-2 ring-orange-500/30 shadow-xs"
                      : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-400/40 hover:bg-[var(--ui-bg-card)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-orange-500 text-white shadow-xs"
                            : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <span
                          className={`text-sm font-bold block ${
                            isSelected
                              ? "text-orange-500"
                              : "text-[var(--ui-text-primary)]"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-orange-500/10 text-orange-500 mt-0.5 inline-block">
                          {opt.badge}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-[var(--ui-border)] bg-[var(--ui-bg-card)]"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ui-text-muted)] leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CARD 2: Informasi Utama Purchase Request ── */}
      <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--ui-border)]">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
            <Building size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)] tracking-tight">
              Informasi Utama Pengadaan
            </h3>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
              Rincian judul pengadaan, unit kerja pemohon, serta latar belakang kebutuhan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PR Title */}
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-[var(--ui-text-primary)] block">
              Judul Purchase Request (PR) <span className="text-red-500">*</span>
            </label>
            <HuntrInput
              type="text"
              placeholder="Contoh: Pengadaan Laptop & Monitor Divisi IT Q4"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5 sm:col-span-1">
            <label className="text-xs font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
              <Building size={13} className="text-orange-500" />
              Departemen Pemohon <span className="text-red-500">*</span>
            </label>
            <HuntrSelect
              value={prDepartment}
              onChange={(e) => setPrDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </HuntrSelect>
          </div>
        </div>

        {/* Purpose / Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--ui-text-primary)] block">
            Latar Belakang & Justifikasi Kebutuhan
          </label>
          <HuntrTextarea
            placeholder="Jelaskan tujuan dan urgensi pengadaan ini untuk mempermudah evaluasi approval manager..."
            value={prDesc}
            onChange={(e) => setPrDesc(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── CARD 3: Layanan Jasa (Spesifikasi Teknis Proyek) ── */}
      {procurementType !== "goods" && (
        <CheckoutServiceDetails
          projectType={projectType}
          setProjectType={setProjectType}
          customProjectType={customProjectType}
          setCustomProjectType={setCustomProjectType}
          serviceStartDate={serviceStartDate}
          setServiceStartDate={setServiceStartDate}
          serviceEndDate={serviceEndDate}
          setServiceEndDate={setServiceEndDate}
          serviceWorkingSchedule={serviceWorkingSchedule}
          setServiceWorkingSchedule={setServiceWorkingSchedule}
          acceptanceCriteria={acceptanceCriteria}
          setAcceptanceCriteria={setAcceptanceCriteria}
          durationCalculation={durationCalculation}
        />
      )}

      {/* ── CARD 4: Logistik & Lokasi Pengiriman ── */}
      <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--ui-border)]">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)] tracking-tight">
              {procurementType === "services"
                ? "Lokasi Pelaksanaan Layanan Jasa"
                : "Lokasi Pengiriman & Logistik"}
            </h3>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
              Tentukan alamat tujuan pengantaran barang atau site pengerjaan proyek.
            </p>
          </div>
        </div>

        {/* WMS Warehouse Selection */}
        {wmsInstalled && procurementType !== "services" && (
          <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--ui-bg-input)]/60 border border-[var(--ui-border)]">
            <label className="text-xs font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
              <Warehouse size={14} className="text-orange-500" />
              Gudang Penerima WMS (Warehouse)
            </label>
            <HuntrSelect
              value={warehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
            >
              <option value="">Belum memilih gudang WMS (Manual Delivery Point)</option>
              {warehouses
                .filter((w: any) => w.status === "active")
                .map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) {w.address ? `· ${w.address}` : ""}
                  </option>
                ))}
            </HuntrSelect>
            <p className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 mt-1">
              <Info size={12} className="text-orange-400 shrink-0" />
              Penerimaan barang (Goods Receipt) PR ini otomatis terhubung dengan modul inventory WMS.
            </p>
          </div>
        )}

        {/* Delivery Point Selection / Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
            <MapPin size={13} className="text-orange-500" />
            {procurementType === "services"
              ? "Lokasi Kerja / Site Pelaksanaan *"
              : "Titik Pengiriman (Delivery Point) *"}
          </label>
          {companyAddresses.length > 0 ? (
            <HuntrSelect
              value={deliveryPoint}
              onChange={(e) => {
                setDeliveryPoint(e.target.value);
                if (procurementType === "services") {
                  setServiceLocation(e.target.value);
                }
              }}
              disabled={Boolean(warehouseId)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {warehouseId && (
                <option value={warehouseDeliveryPoint}>
                  Gudang WMS: {warehouseDeliveryPoint || "Alamat gudang"}
                </option>
              )}
              {companyAddresses.map((address) => (
                <option key={address.id} value={address.value}>
                  {address.label}: {address.value}
                </option>
              ))}
            </HuntrSelect>
          ) : (
            <HuntrTextarea
              placeholder="Contoh: Jl. Jendral Sudirman Kav. 52-53, Gedung Bursa Efek Indonesia Tower 1 Lt. 12, Jakarta Selatan"
              value={deliveryPoint}
              onChange={(e) => {
                setDeliveryPoint(e.target.value);
                if (procurementType === "services") {
                  setServiceLocation(e.target.value);
                }
              }}
              disabled={Boolean(warehouseId)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          )}
        </div>
      </div>

      {/* ── CARD 5: Konfigurasi Tender (Tender Duration & Docs) ── */}
      {procurementMode === "tender" && (
        <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--ui-border)]">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)] tracking-tight">
                Parameter & Dokumen Tender
              </h3>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                Batas waktu penawaran vendor serta lampiran TOR / RKS tender.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tender Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-500" />
                Durasi Buka Tender (Tender Period) *
              </label>
              <HuntrSelect
                value={prDuration}
                onChange={(e) => setPrDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              >
                {TENDER_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </HuntrSelect>
              <p className="text-[11px] text-[var(--ui-text-muted)]">
                Tender aktif terhitung sejak disetujui (Approved) oleh manager.
              </p>
            </div>

            {/* Supporting Document */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                <Paperclip size={13} className="text-orange-500" />
                Dokumen Pendukung / TOR (Opsional)
              </label>

              <HuntrInput
                type="file"
                id="pr-document"
                onChange={(e) => setPrDocument(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.png"
              />

              {prDocument ? (
                <div className="p-3 rounded-xl border border-orange-500/30 bg-orange-500/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={18} className="text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ui-text-primary)] truncate">
                        {prDocument.name}
                      </p>
                      <p className="text-[10px] text-[var(--ui-text-muted)]">
                        {(prDocument.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrDocument(null)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                    title="Hapus file"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById("pr-document")?.click()}
                  className="w-full p-3 rounded-xl border border-dashed border-[var(--ui-border)] hover:border-orange-500/60 bg-[var(--ui-bg-input)] hover:bg-orange-500/[0.03] text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-muted)] group-hover:text-orange-500 transition-colors shrink-0">
                    <Upload size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--ui-text-primary)] group-hover:text-orange-500 transition-colors">
                      Pilih file TOR / RKS (PDF, DOCX, JPG)
                    </p>
                    <p className="text-[10px] text-[var(--ui-text-muted)]">
                      Maksimal ukuran file 10MB
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
