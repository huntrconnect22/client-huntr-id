import React, { useState } from "react";
import {
  Sparkles, CheckCircle2, Check, Award, BarChart2,
  Radar as RadarIcon, ExternalLink, Globe, Image as ImageIcon,
  TrendingUp, Tag,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

interface AgenticComparisonTabProps {
  comparison: any;
  formatRupiah: (num: number) => string;
}

const CHART_COLORS = [
  "#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e", "#eab308",
];

type ViewMode = "cards" | "radar" | "bar";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2.5 text-xs shadow-xl">
        <p className="font-bold text-[var(--ui-text-primary)] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}:{" "}
            {typeof p.value === "number" && p.value > 10000
              ? `Rp ${p.value.toLocaleString("id-ID")}`
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function ProductThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-32 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center">
        <ImageIcon size={28} className="text-[var(--ui-text-muted)]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-32 object-contain rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)]"
    />
  );
}

export default function AgenticComparisonTab({
  comparison,
  formatRupiah,
}: AgenticComparisonTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  if (!comparison) return null;

  const winnerId = comparison.winner_id ?? null;
  const matrix: any[] = comparison.comparison_matrix || [];

  // ── Radar chart data ──
  const radarDimensions = ["Score", "Kelebihan", "Kekurangan (inv)"];
  const radarData = radarDimensions.map((dim) => {
    const entry: any = { subject: dim };
    matrix.forEach((item) => {
      const name = item.product_name?.substring(0, 18) ?? `Produk ${item.catalogue_id}`;
      if (dim === "Score") entry[name] = item.score ?? 75;
      if (dim === "Kelebihan") entry[name] = Math.min((item.pros?.length ?? 0) * 20, 100);
      if (dim === "Kekurangan (inv)") entry[name] = Math.max(100 - (item.cons?.length ?? 0) * 25, 0);
    });
    return entry;
  });

  // ── Bar chart ──
  const barData = matrix.map((item) => ({
    name: item.product_name?.substring(0, 18) ?? `Produk ${item.catalogue_id}`,
    "Harga Web": Math.round(item.web_price_avg || 0),
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

      {/* ── AI Recommendation Banner ── */}
      {comparison.executive_summary && (
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-orange-500/30 flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Sparkles size={12} />
            Analisis &amp; Rekomendasi AI
          </span>
          <p className="text-[var(--ui-text-primary)] leading-relaxed">
            {comparison.executive_summary}
          </p>
          {comparison.winner_reason && (
            <div className="mt-1 text-[11px] p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-1.5">
              <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                <b>Rekomendasi Utama:</b> {comparison.winner_reason}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── View Mode Toggle ── */}
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
                  winnerId !== null && String(item.catalogue_id) === String(winnerId);
                const hasBravePrice = (item.web_price_avg || 0) > 0;
                const showSrc = expandedSources[idx] ?? false;
                const webSources: any[] = item.web_sources ?? [];

                return (
                  <div
                    key={idx}
                    className={`rounded-xl bg-[var(--ui-bg-card)] border flex flex-col shadow-sm relative overflow-hidden ${
                      isWinner
                        ? "border-emerald-500 ring-1 ring-emerald-500/20"
                        : "border-[var(--ui-border)]"
                    }`}
                  >
                    {/* Winner badge */}
                    {isWinner && (
                      <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow flex items-center gap-0.5">
                        <Award size={9} />
                        Direkomendasikan AI
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="p-3 pb-0">
                      <ProductThumbnail src={item.thumbnail} alt={item.product_name ?? "Produk"} />
                    </div>

                    <div className="p-3 flex flex-col gap-2">
                      {/* Nama + skor */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-[var(--ui-text-primary)] leading-snug">
                            {item.product_name}
                          </h4>
                          {item.vendor_name && (
                            <span className="text-[10px] text-[var(--ui-text-muted)]">
                              {item.vendor_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {item.score || 85}/100
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="w-full h-1 rounded-full bg-[var(--ui-bg-input)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWinner ? "bg-emerald-500" : "bg-orange-500"}`}
                          style={{ width: `${item.score || 85}%` }}
                        />
                      </div>

                      {/* Harga Brave */}
                      <div className={`rounded-lg p-2.5 border flex flex-col gap-0.5 ${hasBravePrice ? "bg-blue-500/8 border-blue-500/20" : "bg-[var(--ui-bg-input)] border-[var(--ui-border)]"}`}>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1 mb-0.5">
                          <Globe size={9} />
                          Harga Pasar (Brave Search)
                        </span>
                        {hasBravePrice ? (
                          <>
                            <span className="text-sm font-bold font-mono text-blue-400">
                              {formatRupiah(Math.round(item.web_price_avg))}
                            </span>
                            {(item.web_price_min || item.web_price_max) && (
                              <span className="text-[10px] text-[var(--ui-text-muted)]">
                                Range:{" "}
                                {formatRupiah(Math.round(item.web_price_min ?? item.web_price_avg))}
                                {" – "}
                                {formatRupiah(Math.round(item.web_price_max ?? item.web_price_avg))}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-[var(--ui-text-muted)] italic">
                            Tidak ditemukan harga di web
                          </span>
                        )}
                      </div>

                      {/* Spesifikasi (AI) */}
                      {item.key_specs && (
                        <div className="p-2 rounded-lg bg-[var(--ui-bg-input)] text-[11px] text-[var(--ui-text-secondary)] border border-[var(--ui-border)] leading-relaxed">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block mb-0.5">
                            Spesifikasi Utama
                          </span>
                          {item.key_specs}
                        </div>
                      )}

                      {/* Pros */}
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

                      {/* Cons */}
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

                      {/* Best for */}
                      {item.best_for && (
                        <div className="text-[10px] text-[var(--ui-text-muted)] italic flex items-center gap-1">
                          <Tag size={9} />
                          Cocok untuk: {item.best_for}
                        </div>
                      )}

                      {/* Sumber web Brave */}
                      {webSources.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSources((prev) => ({ ...prev, [idx]: !showSrc }))
                            }
                            className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            <Globe size={10} />
                            {showSrc ? "Sembunyikan" : "Lihat"} {webSources.length} sumber web Brave
                          </button>
                          {showSrc && (
                            <div className="mt-1.5 flex flex-col gap-1.5">
                              {webSources.map((src: any, sIdx: number) => (
                                <a
                                  key={sIdx}
                                  href={src.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-blue-500/40 transition-colors flex gap-2 group"
                                >
                                  {src.thumbnail && (
                                    <img
                                      src={src.thumbnail}
                                      alt=""
                                      className="w-10 h-10 object-cover rounded shrink-0 bg-[var(--ui-bg-card)]"
                                      onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-semibold text-[var(--ui-text-primary)] line-clamp-1 group-hover:text-blue-400 transition-colors flex items-center gap-0.5">
                                      {src.title}
                                      <ExternalLink size={8} className="flex-shrink-0 ml-0.5" />
                                    </div>
                                    <div className="text-[9px] text-[var(--ui-text-muted)] truncate">{src.source}</div>
                                    {src.snippet && (
                                      <div className="text-[9px] text-[var(--ui-text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
                                        {src.snippet}
                                      </div>
                                    )}
                                    {src.price > 0 && (
                                      <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                                        Rp {src.price.toLocaleString("id-ID")}
                                      </div>
                                    )}
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs mt-auto">
                      <span className={`text-[10px] font-semibold ${item.value_rating?.toLowerCase().includes("sangat") ? "text-emerald-400" : "text-[var(--ui-text-muted)]"}`}>
                        {item.value_rating ?? "Perlu RFQ"}
                      </span>
                      {hasBravePrice && (
                        <span className="text-[9px] text-blue-400 flex items-center gap-0.5">
                          <TrendingUp size={9} />
                          Harga web
                        </span>
                      )}
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
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--ui-text-muted)", fontSize: 11 }} />
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
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "var(--ui-text-secondary)" }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-[var(--ui-text-muted)] mt-2 text-center">
            * Score AI, Jumlah Kelebihan, Kekurangan (dibalik) — dinormalisasi 0–100
          </p>
        </div>
      )}

      {/* ── BAR VIEW ── */}
      {viewMode === "bar" && matrix.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
              Perbandingan Harga Pasar (Brave Search)
            </p>
            <p className="text-[9px] text-[var(--ui-text-muted)] mb-3 flex items-center gap-1">
              <Globe size={9} /> Data harga real-time dari web
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Harga Web" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={`cell-price-${i}`} fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
              Skor Teknis AI per Produk (0–100)
            </p>
            <p className="text-[9px] text-[var(--ui-text-muted)] mb-3 flex items-center gap-1">
              <Sparkles size={9} /> Berdasarkan kesesuaian spesifikasi teknis
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--ui-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={`cell-score-${i}`} fill={entry.isWinner ? "#10b981" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-[var(--ui-text-muted)] text-center">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1 align-middle" />
            Hijau = Produk yang direkomendasikan AI
          </p>
        </div>
      )}
    </div>
  );
}

