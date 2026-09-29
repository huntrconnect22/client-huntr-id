import React, { useState } from "react";
import { Sparkles, CheckCircle2, Check, Award, BarChart2, Radar as RadarIcon } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface AgenticComparisonTabProps {
  comparison: any;
  formatRupiah: (num: number) => string;
}

// Warna chart untuk tiap produk
const CHART_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f43f5e", // rose
  "#eab308", // yellow
];

type ViewMode = "cards" | "radar" | "bar";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2.5 text-xs shadow-xl">
        <p className="font-bold text-[var(--ui-text-primary)] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === "number" && p.value > 10000
              ? `Rp ${p.value.toLocaleString("id-ID")}`
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AgenticComparisonTab({
  comparison,
  formatRupiah,
}: AgenticComparisonTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  if (!comparison) return null;

  const winnerId = comparison.winner_id ?? null;
  const matrix: any[] = comparison.comparison_matrix || [];

  // ── Build Radar chart data (score breakdown per produk per dimension) ──
  // Dimensions we pick: score, estimasi harga (normalized), pros count, cons count (inverted)
  const radarDimensions = ["Score", "Value", "Kelebihan", "Kekurangan (inv)"];
  const maxPrice = Math.max(...matrix.map((m) => m.estimated_price_idr || 0)) || 1;

  const radarData = radarDimensions.map((dim) => {
    const entry: any = { subject: dim };
    matrix.forEach((item) => {
      const name = item.product_name?.substring(0, 18) ?? `Produk ${item.catalogue_id}`;
      if (dim === "Score") entry[name] = item.score ?? 75;
      if (dim === "Value") {
        // cheaper = better: invert price ratio
        const priceNorm = (item.estimated_price_idr || 0) / maxPrice;
        entry[name] = Math.round((1 - priceNorm) * 100);
      }
      if (dim === "Kelebihan") entry[name] = Math.min((item.pros?.length ?? 0) * 20, 100);
      if (dim === "Kekurangan (inv)") entry[name] = Math.max(100 - (item.cons?.length ?? 0) * 25, 0);
    });
    return entry;
  });

  // ── Build Bar chart data (price comparison) ──
  const barData = matrix.map((item) => ({
    name: item.product_name?.substring(0, 18) ?? `Produk ${item.catalogue_id}`,
    Harga: item.estimated_price_idr || 0,
    Score: item.score ?? 75,
    isWinner: winnerId !== null && String(item.catalogue_id) === String(winnerId),
  }));

  const productNames = matrix.map(
    (item) => item.product_name?.substring(0, 18) ?? `Produk ${item.catalogue_id}`
  );

  const viewButtons: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "cards", label: "Kartu", icon: <Award size={12} /> },
    { key: "radar", label: "Radar", icon: <RadarIcon size={12} /> },
    { key: "bar", label: "Grafik", icon: <BarChart2 size={12} /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Executive Summary */}
      {comparison.executive_summary && (
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-orange-500/30 flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sparkles size={12} /> Ringkasan Analisis Komparasi
          </span>
          <p className="text-[var(--ui-text-primary)] leading-relaxed">
            {comparison.executive_summary}
          </p>
          {comparison.winner_reason && (
            <div className="mt-1 text-[11px] p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-1.5">
              <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                <b>Rekomendasi Utama:</b> {comparison.winner_reason}
              </span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Toggle */}
      {matrix.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mr-1">
            Tampilan:
          </span>
          {viewButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setViewMode(btn.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                viewMode === btn.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-500/40"
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {viewMode === "cards" && (
        <>
          {matrix.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matrix.map((item: any, idx: number) => {
                const isWinner =
                  winnerId !== null &&
                  String(item.catalogue_id) === String(winnerId);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg bg-[var(--ui-bg-card)] border flex flex-col justify-between gap-2.5 shadow-sm relative ${
                      isWinner
                        ? "border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-[var(--ui-border)]"
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                        <Award size={9} /> Direkomendasikan
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-[var(--ui-text-primary)] leading-snug">
                          {item.product_name}
                        </h4>
                        <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {item.score || 85}/100
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="w-full h-1.5 rounded-full bg-[var(--ui-bg-input)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isWinner ? "bg-emerald-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${item.score || 85}%` }}
                        />
                      </div>

                      {item.key_specs && (
                        <div className="p-2 rounded bg-[var(--ui-bg-input)] text-[11px] text-[var(--ui-text-secondary)] border border-[var(--ui-border)]">
                          {item.key_specs}
                        </div>
                      )}
                      {item.pros?.length > 0 && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-emerald-400 block mb-0.5 text-[10px]">Kelebihan:</span>
                          <ul className="space-y-0.5">
                            {item.pros.map((pro: string, pIdx: number) => (
                              <li key={pIdx} className="flex items-start gap-1 text-[var(--ui-text-secondary)]">
                                <Check size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.cons?.length > 0 && (
                        <div className="text-[11px]">
                          <span className="font-semibold text-amber-400 block mb-0.5 text-[10px]">Catatan:</span>
                          <ul className="space-y-0.5">
                            {item.cons.map((con: string, cIdx: number) => (
                              <li key={cIdx} className="flex items-start gap-1 text-[var(--ui-text-muted)]">
                                <span className="text-amber-400">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.best_for && (
                        <div className="text-[10px] text-[var(--ui-text-muted)] italic">
                          Cocok untuk: {item.best_for}
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
                      <span className="text-[11px]">
                        {item.value_rating ? (
                          <span className={`font-medium ${item.value_rating?.toLowerCase().includes("sangat") ? "text-emerald-400" : "text-[var(--ui-text-muted)]"}`}>
                            {item.value_rating}
                          </span>
                        ) : (
                          <span className="text-[var(--ui-text-muted)]">Estimasi:</span>
                        )}
                      </span>
                      <span className="font-bold font-mono text-[var(--ui-text-primary)]">
                        {(item.estimated_price_idr || 0) > 0
                          ? formatRupiah(item.estimated_price_idr)
                          : "Perlu Penawaran"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
              Perbandingan otomatis aktif ketika ada 2 atau lebih opsi barang.
            </div>
          )}
        </>
      )}

      {/* ── RADAR VIEW ── */}
      {viewMode === "radar" && matrix.length > 0 && (
        <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3">
            Radar Komparasi Multi-Dimensi
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--ui-border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--ui-text-muted)", fontSize: 11 }}
              />
              {productNames.map((name, i) => (
                <Radar
                  key={name}
                  name={name}
                  dataKey={name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "var(--ui-text-secondary)" }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-[var(--ui-text-muted)] mt-2 text-center">
            * Score, Value (harga relatif), Kelebihan (jumlah), Kekurangan (dibalik) — semua dinormalisasi 0–100
          </p>
        </div>
      )}

      {/* ── BAR VIEW ── */}
      {viewMode === "bar" && matrix.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Harga Estimasi */}
          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3">
              Perbandingan Harga Estimasi
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                  tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Harga" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={`cell-price-${i}`}
                      fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Score */}
          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3">
              Skor AI per Produk (0–100)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell
                      key={`cell-score-${i}`}
                      fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend: winner indicator */}
          <p className="text-[10px] text-[var(--ui-text-muted)] text-center">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1 align-middle" />
            Hijau = Produk yang direkomendasikan AI
          </p>
        </div>
      )}
    </div>
  );
}
