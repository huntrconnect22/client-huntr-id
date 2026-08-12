import React, { useEffect, useState } from "react";
import { TrendingUp, Flame, Minus, Sparkles } from "lucide-react";
import { getTrendingSearches } from "../../lib/api/catalogue";

interface TrendingKeyword {
  keyword: string;
  count: number;
  percentage: number;
  trend: "rising" | "stable" | "new" | string;
  category: string | null;
  ai_insight: string | null;
}

interface TrendingData {
  keywords: TrendingKeyword[];
  enriched_by: "gemini" | "none" | string;
  period_days: number;
  generated_at: string;
}

const TREND_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  rising: {
    icon: <TrendingUp size={10} />,
    color: "#34d399",
    label: "Naik",
  },
  new: {
    icon: <Sparkles size={10} />,
    color: "#a78bfa",
    label: "Baru",
  },
  stable: {
    icon: <Minus size={10} />,
    color: "#94a3b8",
    label: "Stabil",
  },
};

function TrendBadge({ trend }: { trend: string }) {
  const cfg = TREND_CONFIG[trend] ?? TREND_CONFIG.stable;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 6px",
        borderRadius: 999,
        fontSize: 9,
        fontWeight: 700,
        background: `${cfg.color}22`,
        color: cfg.color,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function TrendingSearchWidget() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getTrendingSearches(10, 30)
      .then((res: any) => {
        if (cancelled) return;
        const payload = res?.data ?? res;
        setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const keywords = data?.keywords ?? [];

  return (
    <div
      style={{
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--ui-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--ui-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Analitik Pencarian
          </div>
          <h3
            style={{
              margin: "3px 0 0",
              fontSize: 15,
              fontWeight: 900,
              color: "var(--ui-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Flame size={15} color="#f97316" />
            Barang Paling Banyak Dicari
          </h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          {data?.period_days && (
            <span
              style={{
                fontSize: 10,
                color: "var(--ui-text-muted)",
                background: "var(--ui-bg)",
                border: "1px solid var(--ui-border)",
                borderRadius: 4,
                padding: "2px 8px",
              }}
            >
              {data.period_days} hari terakhir
            </span>
          )}
          {data?.enriched_by === "gemini" && (
            <span
              style={{
                fontSize: 9,
                color: "#a78bfa",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Sparkles size={9} />
              Diperkaya AI
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 18px 16px" }}>
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  borderRadius: 8,
                  background: "var(--ui-border)",
                  opacity: 0.5,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "var(--ui-text-muted)",
              fontSize: 12,
            }}
          >
            Gagal memuat data. Coba refresh halaman.
          </div>
        )}

        {!loading && !error && keywords.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "var(--ui-text-muted)",
              fontSize: 12,
            }}
          >
            Belum ada data pencarian dalam {data?.period_days ?? 30} hari terakhir.
          </div>
        )}

        {!loading && !error && keywords.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {keywords.map((item, idx) => {
              const isExpanded = expanded === idx;
              const barColor =
                idx === 0
                  ? "#f97316"
                  : idx === 1
                  ? "#fb923c"
                  : idx === 2
                  ? "#fdba74"
                  : "var(--ui-primary)";

              return (
                <div key={item.keyword}>
                  {/* Row */}
                  <div
                    style={{ cursor: item.ai_insight ? "pointer" : "default" }}
                    onClick={() =>
                      item.ai_insight
                        ? setExpanded(isExpanded ? null : idx)
                        : undefined
                    }
                  >
                    {/* Label row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--ui-text-muted)",
                            width: 16,
                            flexShrink: 0,
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--ui-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.keyword}
                        </span>
                        {item.category && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "var(--ui-text-muted)",
                              background: "var(--ui-bg)",
                              border: "1px solid var(--ui-border)",
                              borderRadius: 4,
                              padding: "1px 5px",
                              flexShrink: 0,
                              display: "none",
                            }}
                            className="category-tag"
                          >
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        <TrendBadge trend={item.trend ?? "stable"} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: barColor,
                          }}
                        >
                          {item.count}×
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div
                      style={{
                        height: 5,
                        borderRadius: 999,
                        background: "var(--ui-border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${item.percentage}%`,
                          background: barColor,
                          borderRadius: 999,
                          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>

                  {/* AI insight expandable */}
                  {item.ai_insight && isExpanded && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: "8px 10px",
                        background: "rgba(167,139,250,0.07)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "var(--ui-text-muted)",
                        lineHeight: 1.5,
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                      }}
                    >
                      <Sparkles size={11} color="#a78bfa" style={{ marginTop: 1, flexShrink: 0 }} />
                      <span>{item.ai_insight}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
