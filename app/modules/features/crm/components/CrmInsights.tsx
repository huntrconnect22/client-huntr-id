import React from "react";
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ComposerKind } from "../types";
import { money } from "../crm-utils";
import { Mini, Panel } from "./CrmShared";

export function CrmInsights({
  crm,
  onCompose,
}: {
  crm: Record<string, any>;
  onCompose: (kind: ComposerKind) => void;
}) {
  const f = crm.forecast;
  const report = crm.reports || {};

  return (
    <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
      {/* ── Predictive Forecast Card ───────────────────────────────── */}
      <Panel
        title="Predictive AI Forecast"
        caption="Model proyeksi cerdas berbasis historis konversi dan pipeline aktif"
        icon={Sparkles}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Estimasi Pendapatan Kuartal Depan
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[var(--ui-text-primary)]">
              {money(f.predicted_amount, f.currency)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--ui-text-secondary)]">
              <span>Tingkat keyakinan:</span>
              <span className="rounded-md bg-[var(--ui-bg-input)] px-2 py-0.5 font-bold uppercase text-orange-500 border border-orange-500/20">
                {f.confidence || "Low"} Confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Mini
              label="Pipeline Berjalan"
              value={money(f.pipeline_amount, f.currency)}
              icon={TrendingUp}
            />
            <Mini
              label="Weighted Forecast"
              value={money(f.weighted_amount, f.currency)}
              icon={DollarSign}
            />
            <Mini
              label="Historical Win Rate"
              value={
                f.historical_win_rate == null
                  ? "Belum cukup data"
                  : `${Math.round(f.historical_win_rate * 100)}%`
              }
              icon={Target}
            />
            <Mini label="Model AI Engine" value="Explainable v1" icon={Zap} />
          </div>

          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 text-xs leading-relaxed text-[var(--ui-text-secondary)]">
            <div className="mb-1 font-bold text-[var(--ui-text-primary)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-orange-500" />
              Penjelasan Model Prediksi
            </div>
            {f.explanation ||
              "Tambahkan lebih banyak lead dan deal untuk meningkatkan akurasi rekomendasi otomatis."}
          </div>
        </div>
      </Panel>

      {/* ── Enterprise Reports ─────────────────────────────────────── */}
      <div className="space-y-4">
        <Panel
          title="Laporan Kinerja Enterprise"
          caption={`Evaluasi performa periode: ${report.period || "Bulan berjalan"}`}
          icon={BarChart3}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Mini label="Target Penjualan" value={money(report.sales_target)} />
            <Mini label="Realisasi Revenue" value={money(report.won_revenue)} />
            <Mini
              label="Pencapaian Target"
              value={
                report.target_attainment == null
                  ? "—"
                  : `${report.target_attainment}%`
              }
            />
            <Mini
              label="Win Rate Deal"
              value={report.win_rate == null ? "—" : `${report.win_rate}%`}
            />
          </div>

          {report.target_attainment != null && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="text-[var(--ui-text-secondary)]">
                  Progress Target Penjualan
                </span>
                <span className="text-orange-500">
                  {report.target_attainment}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, report.target_attainment))}%`,
                  }}
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-[var(--ui-text-muted)]">
            Laporan menyatukan data deal berstatus won, efisiensi penanganan
            tiket helpdesk, dan konversi kampanye marketing. Kurs mata uang
            tersimpan secara isolasi per perusahaan tenant.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-[var(--ui-border)]">
            <button
              onClick={() => onCompose("target")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
            >
              <Target size={13} />
              <span>Atur Target Penjualan</span>
            </button>
            <button
              onClick={() => onCompose("rate")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
            >
              <DollarSign size={13} />
              <span>Tambah Kurs Mata Uang</span>
            </button>
          </div>
        </Panel>

        <Panel
          title="Mekanisme Scoring Lead Transparan"
          caption="Kriteria evaluasi otomatis agar tim sales fokus pada prioritas tepat"
          icon={CheckCircle2}
        >
          <div className="space-y-2 text-xs leading-relaxed text-[var(--ui-text-secondary)]">
            <p>
              Scoring otomatis mengevaluasi 4 faktor utama prospek: kelengkapan
              profil PIC, nama dan kredibilitas perusahaan calon pembeli, sumber
              akuisisi (referral/web/iklan), serta estimasi nilai transaksi.
            </p>
            <div className="rounded-lg border-l-2 border-orange-500 bg-orange-500/5 p-3 text-[var(--ui-text-primary)] font-medium">
              Transparansi penuh: Tim dapat meninjau breakdown alasan skor
              langsung pada setiap item lead tanpa black-box.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}


