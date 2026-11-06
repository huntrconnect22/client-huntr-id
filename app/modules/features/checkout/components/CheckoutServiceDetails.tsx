import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React from "react";
import { Briefcase, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { SERVICE_PROJECT_TYPES } from "../constants";
import type { DurationCalculation } from "../types";

interface CheckoutServiceDetailsProps {
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
  acceptanceCriteria: string;
  setAcceptanceCriteria: (val: string) => void;
  durationCalculation: DurationCalculation | null;
}

export function CheckoutServiceDetails({
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
  acceptanceCriteria,
  setAcceptanceCriteria,
  durationCalculation,
}: CheckoutServiceDetailsProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-orange-500/25 bg-orange-500/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-orange-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--ui-text-primary)]">
              Detail Pengadaan Jasa & Spesifikasi Proyek
            </p>
            <p className="text-xs text-[var(--ui-text-muted)]">
              Pengadaan jasa dinilai dari pagu budget, target waktu penyelesaian, dan serah terima BAST.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
          Penerimaan via BAST
        </span>
      </div>

      {/* 1. Kategori Jasa / Jenis Proyek */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1.5">
          <Sparkles size={13} className="text-orange-500" />
          Kategori Layanan / Tipe Kontrak Jasa <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {SERVICE_PROJECT_TYPES.map((type) => {
            const isSelected = projectType === type.id;
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setProjectType(type.id)}
                className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-orange-500 bg-orange-500/10 shadow-sm ring-2 ring-orange-500/20"
                    : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-500/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-orange-500" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? "text-orange-500" : "text-[var(--ui-text-primary)]"
                    }`}
                  >
                    {type.label}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--ui-text-muted)] mt-2 leading-tight">
                  {type.desc}
                </span>
              </button>
            );
          })}
        </div>

        {projectType === "Lainnya" && (
          <div className="mt-2">
            <HuntrInput
              type="text"
              placeholder="Tuliskan kategori jasa spesifik (misal: Jasa Uji Laboratorium, Audit ISO, Pemetaan Topografi)..."
              value={customProjectType}
              onChange={(e) => setCustomProjectType(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--ui-bg-input)] border border-orange-500 text-xs text-[var(--ui-text-primary)] outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        )}
      </div>

      {/* 2. Jadwal & Waktu Pengerjaan */}
      <div className="space-y-3 pt-3 border-t border-[var(--ui-border)]/60">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1.5">
            <Clock size={13} className="text-orange-500" />
            Jadwal Pelaksanaan & Batas Waktu <span className="text-red-500">*</span>
          </label>
          {durationCalculation && (
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                durationCalculation.error
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              {durationCalculation.error || `⏱️ Durasi: ${durationCalculation.text}`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[var(--ui-text-secondary)] mb-1.5 block">
              Tanggal Mulai Pengerjaan <span className="text-red-500">*</span>
            </label>
            <HuntrInput
              type="date"
              value={serviceStartDate}
              onChange={(e) => setServiceStartDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--ui-text-secondary)] mb-1.5 block">
              Target Selesai (Deadline) <span className="text-red-500">*</span>
            </label>
            <HuntrInput
              type="date"
              min={serviceStartDate || undefined}
              value={serviceEndDate}
              onChange={(e) => setServiceEndDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--ui-text-secondary)] mb-1.5 block">
            Jadwal Kerja / Jam Kerja Layanan (Opsional)
          </label>
          <HuntrInput
            type="text"
            value={serviceWorkingSchedule}
            onChange={(e) => setServiceWorkingSchedule(e.target.value)}
            placeholder="Contoh: Senin - Jumat (08:00 - 17:00 WIB), atau Siaga 24 Jam Non-stop"
            className="w-full p-2.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      {/* 3. Acceptance Criteria & Syarat BAST */}
      <div className="pt-3 border-t border-[var(--ui-border)]/60">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5 block">
          Kriteria Penerimaan & Deliverables (Syarat BAST) <span className="text-red-500">*</span>
        </label>
        <HuntrTextarea
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder="Jelaskan deliverable yang wajib dipenuhi vendor sebelum BAST diterbitkan:&#10;1. Laporan akhir dan dokumentasi pengerjaan lengkap&#10;2. Pengujian fungsi (UAT) dinyatakan lolos 100%&#10;3. Garansi layanan minimal 30 hari kalender"
          rows={3}
          className="w-full p-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-y"
        />
      </div>
    </div>
  );
}
