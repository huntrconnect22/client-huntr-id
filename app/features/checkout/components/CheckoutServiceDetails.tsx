import React from "react";
import { Briefcase, Sparkles, Clock } from "lucide-react";
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
    <div className="space-y-4 border-l-2 border-orange-500 bg-orange-500/5 p-4 rounded-r-xl">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-orange-500/20">
        <div>
          <p className="text-xs font-bold text-[var(--ui-text-primary)] flex items-center gap-1.5">
            <Briefcase size={14} className="text-orange-500" />
            Detail Pengadaan Jasa & Spesifikasi Proyek
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--ui-text-muted)]">
            Pengadaan jasa dinilai dari pagu budget, waktu pengerjaan, dan deliverables BAST.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
          Penerimaan via BAST
        </span>
      </div>

      {/* 1. Jenis Proyek */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1">
          <Sparkles size={11} className="text-orange-400" />
          Jenis Proyek / Kategori Jasa *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SERVICE_PROJECT_TYPES.map((type) => {
            const isSelected = projectType === type.id;
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setProjectType(type.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-orange-500 bg-orange-500/10 shadow-sm"
                    : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-400/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-orange-500/10 text-orange-500"
                    }`}
                  >
                    <Icon size={13} />
                  </div>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? "text-orange-500" : "text-[var(--ui-text-primary)]"
                    }`}
                  >
                    {type.label}
                  </span>
                </div>
                <span className="text-[9px] text-[var(--ui-text-muted)] mt-1.5 line-clamp-2">
                  {type.desc}
                </span>
              </button>
            );
          })}
        </div>

        {projectType === "Lainnya" && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Tuliskan jenis proyek spesifik (misal: Jasa Survei Topografi, Sertifikasi ISO)..."
              value={customProjectType}
              onChange={(e) => setCustomProjectType(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-orange-500/50 text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500"
            />
          </div>
        )}
      </div>

      {/* 2. Waktu Pengerjaan */}
      <div className="space-y-2 pt-2 border-t border-[var(--ui-border)]/60">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1">
            <Clock size={11} className="text-orange-400" />
            Waktu & Jadwal Pengerjaan *
          </label>
          {durationCalculation && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                durationCalculation.error
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {durationCalculation.error || `⏱️ Durasi: ${durationCalculation.text}`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
            Tanggal Mulai Pengerjaan *
            <input
              type="date"
              value={serviceStartDate}
              onChange={(e) => setServiceStartDate(e.target.value)}
              className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
            Target Selesai Pengerjaan (Deadline) *
            <input
              type="date"
              min={serviceStartDate || undefined}
              value={serviceEndDate}
              onChange={(e) => setServiceEndDate(e.target.value)}
              className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
            />
          </label>
        </div>

        <label className="block text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
          Pola Waktu Kerja / Jam Kerja (Opsional)
          <input
            type="text"
            value={serviceWorkingSchedule}
            onChange={(e) => setServiceWorkingSchedule(e.target.value)}
            placeholder="misal: Hari Kerja Senin - Jumat (08:00 - 17:00 WIB), atau Shift 24 Jam Non-stop"
            className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
          />
        </label>
      </div>

      {/* 3. Acceptance Criteria & SLA */}
      <div className="pt-2 border-t border-[var(--ui-border)]/60">
        <label className="block text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
          Kriteria Penerimaan & Deliverables (Syarat BAST) *
          <textarea
            value={acceptanceCriteria}
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
            placeholder="Contoh: 1. Laporan progres mingguan, 2. Dokumentasi serah terima / BAST ditandatangani PM, 3. Garansi pengerjaan minimal 30 hari kalender, 4. Uji fungsi (UAT) lolos 100%."
            rows={3}
            className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
          />
        </label>
      </div>
    </div>
  );
}
