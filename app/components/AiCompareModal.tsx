import React, { useEffect, useState, useRef } from "react";
import { X, Sparkles, Star, Loader2, CheckCircle2, ShoppingCart, Lightbulb } from "lucide-react";
import { aiCompare } from "../lib/api/ai";

interface AiCompareModalProps {
  catalogueIds: string[];
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

/**
 * AiCompareModal
 *
 * Modal perbandingan produk menggunakan AI.
 * Menampilkan tabel spec + AI analysis + rekomendasi.
 */
export default function AiCompareModal({
  catalogueIds,
  onClose,
  onAddToCart,
}: AiCompareModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Click outside to close functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const res = await aiCompare(catalogueIds);
        setResult(res);
      } catch (e) {
        setError("Gagal memuat perbandingan AI. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [catalogueIds]);

  const analysis = result?.ai_analysis || {};
  const matrix: any[] = analysis.comparison_matrix || [];
  const catalogues: any[] = result?.catalogues || [];
  const recommendedId = analysis.recommended_id;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: 20,
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)",
          borderRadius: 32,
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px -12px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(168,85,247,0.04))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, #f97316, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
              }}
            >
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 900,
                  color: "var(--ui-text-primary)",
                }}
              >
                AI Product Comparison
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "var(--ui-text-muted)",
                  fontWeight: 600,
                }}
              >
                {catalogueIds.length} produk dibandingkan oleh Huntr AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border)",
              color: "var(--ui-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "60px 0",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #f97316, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <Sparkles size={26} color="#fff" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--ui-text-primary)",
                    marginBottom: 6,
                  }}
                >
                  Huntr AI sedang menganalisis...
                </div>
                <div
                  style={{ fontSize: 13, color: "var(--ui-text-muted)" }}
                >
                  Membandingkan spesifikasi, harga, dan kualitas produk
                </div>
              </div>
            </div>
          ) : error ? (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 16,
                padding: 24,
                color: "#ef4444",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* AI Summary */}
              {analysis.summary && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(249,115,22,0.07), rgba(168,85,247,0.04))",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: 18,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={12} /> Analisis AI
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "var(--ui-text-secondary)",
                      lineHeight: 1.7,
                    }}
                  >
                    {analysis.summary}
                  </p>
                  {analysis.recommendation && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 16px",
                        background: "rgba(249,115,22,0.08)",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#f97316",
                      }}
                    >
                      <Lightbulb size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />{analysis.recommendation}
                    </div>
                  )}
                </div>
              )}

              {/* Product Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(catalogueIds.length, 3)}, 1fr)`,
                  gap: 16,
                }}
              >
                {matrix.map((item: any) => {
                  const catalogue = catalogues.find(
                    (c) => c.id === item.catalogue_id
                  );
                  const isRecommended = item.catalogue_id === recommendedId;

                  return (
                    <div
                      key={item.catalogue_id}
                      style={{
                        background: isRecommended
                          ? "linear-gradient(135deg, rgba(249,115,22,0.06), rgba(245,158,11,0.03))"
                          : "var(--ui-bg-input)",
                        border: isRecommended
                          ? "2px solid rgba(249,115,22,0.4)"
                          : "1px solid var(--ui-border-input)",
                        borderRadius: 20,
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        position: "relative",
                      }}
                    >
                      {/* Recommended Badge */}
                      {isRecommended && (
                        <div
                          style={{
                            position: "absolute",
                            top: -12,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background:
                              "linear-gradient(135deg, #f97316, #f59e0b)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "4px 12px",
                            borderRadius: 20,
                            whiteSpace: "nowrap",
                            boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
                          }}
                        >
                          ✦ AI REKOMENDASI
                        </div>
                      )}

                      {/* Product Name & Score */}
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "var(--ui-text-primary)",
                            marginBottom: 4,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.product_name || catalogue?.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ui-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          {item.vendor_name || catalogue?.vendor}
                        </div>
                      </div>

                      {/* Score */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${item.score || 0}%`,
                              background: isRecommended
                                ? "linear-gradient(90deg, #f97316, #f59e0b)"
                                : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                              borderRadius: 3,
                              transition: "width 0.8s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: isRecommended
                              ? "#f97316"
                              : "var(--ui-text-secondary)",
                            minWidth: 36,
                          }}
                        >
                          {item.score || "—"}
                        </span>
                      </div>

                      {/* Value Rating */}
                      {item.value_rating && (
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: isRecommended ? "#f97316" : "#6366f1",
                            background: isRecommended
                              ? "rgba(249,115,22,0.1)"
                              : "rgba(99,102,241,0.1)",
                            padding: "4px 10px",
                            borderRadius: 8,
                            display: "inline-block",
                          }}
                        >
                          {item.value_rating}
                        </div>
                      )}

                      {/* Specs Grid */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          fontSize: 12,
                        }}
                      >
                        {catalogue?.category && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--ui-text-muted)" }}>Kategori</span>
                            <span style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>
                              {catalogue.category}
                            </span>
                          </div>
                        )}
                        {catalogue?.brand && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--ui-text-muted)" }}>Brand</span>
                            <span style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>
                              {catalogue.brand}
                            </span>
                          </div>
                        )}
                        {catalogue?.uom && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--ui-text-muted)" }}>UOM</span>
                            <span style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>
                              {catalogue.uom}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pros */}
                      {item.pros?.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 900,
                              color: "#22c55e",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginBottom: 6,
                            }}
                          >
                            Kelebihan
                          </div>
                          {item.pros.slice(0, 3).map((pro: string, i: number) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: 6,
                                alignItems: "flex-start",
                                fontSize: 12,
                                color: "var(--ui-text-secondary)",
                                marginBottom: 4,
                              }}
                            >
                              <CheckCircle2
                                size={12}
                                color="#22c55e"
                                style={{ marginTop: 2, flexShrink: 0 }}
                              />
                              {pro}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add to Cart */}
                      {catalogue && (
                        <button
                          onClick={() => onAddToCart(catalogue)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: 12,
                            background: isRecommended
                              ? "linear-gradient(135deg, #f97316, #f59e0b)"
                              : "var(--ui-bg-card)",
                            border: isRecommended
                              ? "none"
                              : "1px solid var(--ui-border)",
                            color: isRecommended ? "#fff" : "var(--ui-text-primary)",
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            boxShadow: isRecommended
                              ? "0 6px 16px rgba(249,115,22,0.3)"
                              : "none",
                            transition: "all 0.2s ease",
                            marginTop: "auto",
                          }}
                        >
                          <ShoppingCart size={14} />
                          Tambah ke Cart
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
