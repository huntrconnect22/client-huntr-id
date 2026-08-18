import React from "react";
import { Sparkles, Zap, AlertCircle } from "lucide-react";

interface AgenticNoticeBannerProps {
  isFeatureEnabled: boolean;
  onActivateFeature: () => void;
  onOpenSettings: () => void;
}

export default function AgenticNoticeBanner({
  isFeatureEnabled,
  onActivateFeature,
  onOpenSettings,
}: AgenticNoticeBannerProps) {
  return (
    <>
      {/* Inactive Feature Notice Banner */}
      {!isFeatureEnabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="flex-shrink-0 text-orange-500" />
            <div className="text-xs text-[var(--ui-text-primary)]">
              <span className="font-bold text-orange-500">Fitur Belum Aktif di Sidebar:</span> AI Agentic Procurement saat ini nonaktif di pengaturan tampilan Anda.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onActivateFeature}
              className="px-3 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Zap size={13} />
              <span>Aktifkan Sekarang</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-md bg-[var(--ui-bg-input)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] font-semibold transition-all cursor-pointer"
            >
              Buka Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer Hint Banner (Beta) */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
        <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <div className="flex-1 text-xs leading-relaxed">
          <span className="font-bold">Disclaimer Versi Beta:</span> Fitur Agentic AI Procurement saat ini masih dalam <b>Versi Beta</b>. Hasil pencarian katalog, komparasi spesifikasi teknis, serta estimasi harga dihasilkan secara otomatis oleh model AI dan <b>tidak dijamin 100% akurat</b>. Dokumen PR ini berfungsi sebagai draf referensi cerdas; mohon periksa dan sesuaikan kembali sebelum mengajukan ke proses persetujuan resmi (*approval*).
        </div>
      </div>
    </>
  );
}
