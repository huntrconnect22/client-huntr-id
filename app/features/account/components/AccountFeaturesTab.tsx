import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  isAgenticProcurementEnabled,
  setAgenticProcurementEnabled,
} from "../../../lib/features";

interface AccountFeaturesTabProps {
  onSuccess: (msg: string | null) => void;
}

export function AccountFeaturesTab({ onSuccess }: AccountFeaturesTabProps) {
  const [agenticEnabled, setAgenticEnabled] = useState(isAgenticProcurementEnabled());

  const handleToggleAgentic = (val: boolean) => {
    setAgenticProcurementEnabled(val);
    setAgenticEnabled(val);
    if (val) {
      onSuccess("AI Agentic Procurement berhasil diaktifkan! Menu sekarang muncul di sidebar navigasi.");
    } else {
      onSuccess("AI Agentic Procurement dinonaktifkan. Menu telah disembunyikan dari sidebar navigasi.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Feature Flags & AI Tools</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            BETA
          </span>
        </div>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          Aktifkan fitur eksperimental dan modul AI secara manual sesuai kebutuhan alur kerja Anda.
        </p>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          AI & Autonomous Procurement
        </span>

        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          {/* Agentic Procurement Toggle Card */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/20">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[var(--ui-text-primary)]">
                    AI Agentic Procurement
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
                    AI Assistant
                  </span>
                  {agenticEnabled ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AKTIF DI SIDEBAR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-500/10 text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                      NONAKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--ui-text-muted)] leading-relaxed max-w-xl">
                  Mengaktifkan agen cerdas untuk pengadaan otonom. AI akan meriset spesifikasi teknis, mencocokkan katalog vendor, membandingkan estimasi harga, dan menyusun draf Purchase Requisition (PR) secara otomatis.
                </p>
                <div className="text-[11px] text-[var(--ui-text-secondary)] pt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-orange-400">Status:</span>
                  {agenticEnabled
                    ? "Menu 'AI Agentic Procurement' ditampilkan di sidebar pada bagian Procurement (Buyer)."
                    : "Menu disembunyikan dari sidebar navigasi."}
                </div>
              </div>
            </div>

            {/* Interactive Switch Toggle */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                role="switch"
                aria-checked={agenticEnabled}
                onClick={() => handleToggleAgentic(!agenticEnabled)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                  agenticEnabled
                    ? "bg-gradient-to-r from-orange-500 to-amber-500"
                    : "bg-[var(--ui-border)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    agenticEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
