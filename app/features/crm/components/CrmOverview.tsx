import React from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  ContactRound,
  DollarSign,
  Headphones,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { RecordRow } from "../types";
import { date, money, stages } from "../crm-utils";
import { Empty, MetricCard, Panel, StatusBadge } from "./CrmShared";

export function CrmOverview({
  crm,
  onSelectTab,
}: {
  crm: Record<string, any>;
  onSelectTab?: (tab: string) => void;
}) {
  const metrics = crm.dashboard.metrics ?? {};

  return (
    <div className="space-y-5">
      {/* ── Metric Grid ───────────────────────────────────────────── */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Lead Aktif"
          value={metrics.open_leads ?? 0}
          caption="Prospek siap dikonversi"
          icon={Target}
          accent="orange"
        />
        <MetricCard
          label="Total Nilai Pipeline"
          value={money(metrics.pipeline_value)}
          caption="Akumulasi deal dalam proses"
          icon={TrendingUp}
          accent="amber"
        />
        <MetricCard
          label="Forecast Berbobot"
          value={money(metrics.weighted_forecast)}
          caption="Estimasi realisasi win rate"
          icon={DollarSign}
          accent="indigo"
        />
        <MetricCard
          label="Tiket Terbuka"
          value={metrics.open_tickets ?? 0}
          caption="Keluhan / request butuh respon"
          icon={Headphones}
          accent="sky"
        />
        <MetricCard
          label="Task Terlambat"
          value={metrics.overdue_tasks ?? 0}
          caption="Follow up melewati tenggat"
          icon={AlertTriangle}
          accent="rose"
        />
        <MetricCard
          label="SLA Terlewati"
          value={metrics.sla_breaches ?? 0}
          caption="Respon tiket melebihi batas waktu"
          icon={ShieldAlert}
          accent="rose"
        />
      </section>

      {/* ── Pipeline Breakdown & Upcoming Tasks ────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
        <Panel
          title="Alur Penjualan (Sales Pipeline)"
          caption="Distribusi nilai dan jumlah deal di setiap tahapan aktif"
          icon={ContactRound}
        >
          <PipelineBars pipeline={crm.dashboard.pipeline ?? {}} />
        </Panel>

        <Panel
          title="Prioritas Kerja Berikutnya"
          caption="Tindak lanjut yang dijadwalkan oleh tim"
          icon={Clock}
        >
          <TaskList rows={crm.dashboard.upcoming_tasks ?? []} />
        </Panel>
      </section>

      {/* ── Quickstart & Recent Activity ──────────────────────────── */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Alur Kerja Cepat CRM"
          caption="Langkah terstruktur memaksimalkan konversi penjualan"
          icon={Zap}
        >
          <div className="space-y-3">
            <div className="flex gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 transition-colors hover:border-orange-500/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-xs font-bold text-orange-500">
                1
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[var(--ui-text-primary)]">
                  Hubungkan Email & WhatsApp
                </p>
                <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                  Semua interaksi pelanggan akan tersinkronisasi otomatis dalam satu timeline kontak terpusat.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 transition-colors hover:border-orange-500/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-xs font-bold text-orange-500">
                2
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[var(--ui-text-primary)]">
                  Kualifikasi Lead dengan AI Score
                </p>
                <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                  Fokuskan follow up pada calon pembeli dengan skor prospek tinggi sebelum mengonversinya menjadi deal.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 transition-colors hover:border-orange-500/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-xs font-bold text-orange-500">
                3
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[var(--ui-text-primary)]">
                  Kawal Deal di Pipeline & Terbitkan CPQ
                </p>
                <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                  Geser tahapan negosiasi, ajukan approval diskon, dan kunci kesepakatan penjualan hingga closed-won.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Aktivitas Terbaru"
          caption="Jejak interaksi dan pekerjaan tim di seluruh entitas"
          icon={Activity}
        >
          <TaskList rows={crm.dashboard.recent_activity ?? []} isRecent />
        </Panel>
      </section>
    </div>
  );
}

function PipelineBars({ pipeline }: { pipeline: Record<string, any> }) {
  const activeStages = stages.slice(0, 4);
  const max = Math.max(
    ...Object.values(pipeline).map((x: any) => Number(x.amount || 0)),
    1,
  );

  return (
    <div className="space-y-3.5">
      {activeStages.map((stage) => {
        const row = pipeline[stage] || {};
        const value = Number(row.amount || 0);
        const count = Number(row.count || 0);
        const percent = Math.max(4, (value / max) * 100);

        return (
          <div key={stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize font-bold text-[var(--ui-text-primary)]">
                {stage.replaceAll("_", " ")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--ui-text-muted)]">
                  {count} deal
                </span>
                <span className="font-extrabold text-orange-500">
                  {money(value)}
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskList({
  rows,
  isRecent,
}: {
  rows: RecordRow[];
  isRecent?: boolean;
}) {
  return rows.length ? (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/50 p-2.5 transition-colors hover:border-orange-500/30"
        >
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="truncate text-xs font-bold text-[var(--ui-text-primary)]">
              {r.title}
            </div>
            <div className="text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1.5">
              <span className="capitalize">{r.type || r.status}</span>
              <span>·</span>
              <span>{date(r.due_at || r.created_at)}</span>
            </div>
          </div>
          <StatusBadge value={r.status || "open"} />
        </div>
      ))}
    </div>
  ) : (
    <Empty
      text={
        isRecent
          ? "Belum ada jejak aktivitas tercatat."
          : "Belum ada aktivitas follow up terjadwal."
      }
      icon={Clock}
    />
  );
}
