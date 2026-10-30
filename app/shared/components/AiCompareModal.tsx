import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import React, { useEffect, useState } from "react";
import {
  X, Sparkles, Loader2, CheckCircle2, XCircle,
  ShoppingCart, Lightbulb, Star, Package
} from "lucide-react";
import { aiCompare } from "../lib/api/ai";
import { useLanguage } from "../context/LanguageContext";
import { getAssetUrl } from "../lib/assets";

interface AiCompareModalProps {
  catalogueIds: string[];
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

function ScoreBar({ score, isRecommended }: { score: number; isRecommended: boolean }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: animated ? `${score || 0}%` : "0%",
            background: isRecommended
              ? "linear-gradient(90deg, #f97316, #f59e0b)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: 4,
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: isRecommended
              ? "0 0 8px rgba(249,115,22,0.5)"
              : "0 0 8px rgba(99,102,241,0.5)",
          }}
        />
      </div>
      <span style={{
        fontSize: 14,
        fontWeight: 900,
        color: isRecommended ? "#f97316" : "#8b5cf6",
        minWidth: 32,
        textAlign: "right",
      }}>
        {score ?? "—"}
      </span>
    </div>
  );
}

function ProductCard({
  item,
  catalogue,
  isRecommended,
  onAddToCart,
  t,
}: {
  item: any;
  catalogue: any;
  isRecommended: boolean;
  onAddToCart: (c: any) => void;
  t: (k: string, o?: any) => string;
}) {
  const imgUrl = catalogue?.image_url || catalogue?.image_path
    ? getAssetUrl(catalogue.image_url || catalogue.image_path)
    : null;

  return (
    <div
      style={{
        background: isRecommended
          ? "linear-gradient(160deg, rgba(249,115,22,0.07) 0%, rgba(168,85,247,0.04) 100%)"
          : "var(--ui-bg-input)",
        border: isRecommended
          ? "2px solid rgba(249,115,22,0.45)"
          : "1px solid var(--ui-border)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        overflow: "visible",
        flex: 1,
        boxShadow: isRecommended
          ? "0 8px 32px rgba(249,115,22,0.15), inset 0 1px 0 rgba(249,115,22,0.1)"
          : "0 2px 12px rgba(0,0,0,0.2)",
        transition: "transform 0.2s ease",
      }}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #f97316, #f59e0b)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 900,
          padding: "5px 16px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(249,115,22,0.5)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <Star size={10} fill="#fff" /> {t("marketplace.aiCompareModal.recommendedBadge")}
        </div>
      )}

      {/* Product Image */}
      <div style={{
        borderRadius: "18px 18px 0 0",
        overflow: "hidden",
        height: 120,
        background: "rgba(255,255,255,0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid var(--ui-border)",
        flexShrink: 0,
      }}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={catalogue?.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Package size={40} color="var(--ui-text-muted)" />
        )}
      </div>

      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Product Name & Vendor */}
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            color: "var(--ui-text-primary)",
            lineHeight: 1.3,
            marginBottom: 3,
          }}>
            {item.product_name || catalogue?.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600 }}>
            {item.vendor_name || catalogue?.company?.name || catalogue?.vendor}
          </div>
        </div>

        {/* AI Score */}
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            color: isRecommended ? "#f97316" : "#8b5cf6",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}>
            AI Score
          </div>
          <ScoreBar score={item.score} isRecommended={isRecommended} />
        </div>

        {/* Value Rating */}
        {item.value_rating && (
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: isRecommended ? "#f97316" : "#6366f1",
            background: isRecommended ? "rgba(249,115,22,0.1)" : "rgba(99,102,241,0.1)",
            padding: "4px 10px",
            borderRadius: 8,
            display: "inline-block",
            width: "fit-content",
          }}>
            {item.value_rating}
          </div>
        )}

        {/* Pros */}
        {item.pros?.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900, color: "#22c55e",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
            }}>
              {t("marketplace.aiCompareModal.prosLabel")}
            </div>
            {item.pros.slice(0, 3).map((pro: string, i: number) => (
              <div key={i} style={{
                display: "flex", gap: 6, alignItems: "flex-start",
                fontSize: 11, color: "var(--ui-text-secondary)", marginBottom: 4,
              }}>
                <CheckCircle2 size={12} color="#22c55e" style={{ marginTop: 1, flexShrink: 0 }} />
                {pro}
              </div>
            ))}
          </div>
        )}

        {/* Cons */}
        {item.cons?.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900, color: "#ef4444",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
            }}>
              {t("marketplace.aiCompareModal.consLabel") || "Cons"}
            </div>
            {item.cons.slice(0, 3).map((con: string, i: number) => (
              <div key={i} style={{
                display: "flex", gap: 6, alignItems: "flex-start",
                fontSize: 11, color: "var(--ui-text-secondary)", marginBottom: 4,
              }}>
                <XCircle size={12} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                {con}
              </div>
            ))}
          </div>
        )}

        {/* Specs */}
        <div style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--ui-border)",
          fontSize: 11,
          flexShrink: 0,
        }}>
          {[
            { label: t("marketplace.aiCompareModal.categoryLabel"), value: catalogue?.category },
            { label: t("marketplace.aiCompareModal.brandLabel"), value: catalogue?.brand },
            { label: t("marketplace.aiCompareModal.uomLabel"), value: catalogue?.uom },
          ].filter(r => r.value).map((row, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 12px",
              borderBottom: i < 2 ? "1px solid var(--ui-border)" : undefined,
              background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            }}>
              <span style={{ color: "var(--ui-text-muted)", fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Add to Cart */}
        {catalogue && (
          <HuntrButton
            onClick={() => onAddToCart(catalogue)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 12,
              background: isRecommended
                ? "linear-gradient(135deg, #f97316, #f59e0b)"
                : "var(--ui-bg-card)",
              border: isRecommended ? "none" : "1px solid var(--ui-border)",
              color: isRecommended ? "#fff" : "var(--ui-text-primary)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              boxShadow: isRecommended ? "0 6px 18px rgba(249,115,22,0.3)" : "none",
              transition: "all 0.2s ease",
              marginTop: "auto",
            }}
          >
            <ShoppingCart size={13} />
            {t("marketplace.aiCompareModal.addToCart")}
          </HuntrButton>
        )}
      </div>
    </div>
  );
}

export default function AiCompareModal({ catalogueIds, onClose, onAddToCart }: AiCompareModalProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const res = await aiCompare(catalogueIds);
        setResult(res);
      } catch {
        setError(t("marketplace.aiCompareModal.loadFailed"));
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

  return (
    <>
      <style>{`
        @keyframes compareModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aiPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes vsPulse {
          0%, 100% { opacity: 0.7; text-shadow: 0 0 20px rgba(99,102,241,0.4); }
          50% { opacity: 1; text-shadow: 0 0 40px rgba(139,92,246,0.7); }
        }
        .ai-compare-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 16px; backdrop-filter: blur(4px); }
        .ai-compare-modal { animation: compareModalIn 0.3s ease; }
      `}</style>

      <div className="ai-compare-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <HuntrSurface
          className="ai-compare-modal"
          style={{
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 28,
            width: "100%",
            maxWidth: 900,
            maxHeight: "92vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(249,115,22,0.07), rgba(168,85,247,0.05))",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: "linear-gradient(135deg, #f97316, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                animation: "aiPulse 2.5s ease-in-out infinite",
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "var(--ui-text-primary)" }}>
                  AI Product Comparison
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600 }}>
                  {t("marketplace.aiCompareModal.subtitle", { count: catalogueIds.length })}
                </p>
              </div>
            </div>
            <HuntrButton
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
                color: "var(--ui-text-muted)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </HuntrButton>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            {loading ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 16, padding: "60px 0",
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: "linear-gradient(135deg, #f97316, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "aiPulse 1.5s ease-in-out infinite",
                }}>
                  <Sparkles size={28} color="#fff" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)", marginBottom: 6 }}>
                    {t("marketplace.aiCompareModal.loadingTitle")}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>
                    {t("marketplace.aiCompareModal.loadingDesc")}
                  </div>
                </div>
                <Loader2 size={18} color="var(--ui-text-muted)" className="animate-spin" />
              </div>
            ) : error ? (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 16, padding: 24, color: "#ef4444", textAlign: "center", fontWeight: 600,
              }}>
                {error}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* AI Summary */}
                {analysis.summary && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(249,115,22,0.07), rgba(168,85,247,0.04))",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: 16, padding: "18px 20px",
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 900, color: "#f97316",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <Sparkles size={11} /> {t("marketplace.aiCompareModal.aiAnalysis")}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.7 }}>
                      {analysis.summary}
                    </p>
                    {analysis.recommendation && (
                      <div style={{
                        marginTop: 12, padding: "10px 14px",
                        background: "rgba(249,115,22,0.1)", borderRadius: 10,
                        fontSize: 12, fontWeight: 700, color: "#f97316",
                        display: "flex", alignItems: "flex-start", gap: 6,
                      }}>
                        <Lightbulb size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                        {analysis.recommendation}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Cards with VS divider */}
                <div style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                }}>
                  {matrix.map((item: any, idx: number) => {
                    const catalogue = catalogues.find((c) => c.id === item.catalogue_id);
                    const isRecommended = item.catalogue_id === recommendedId;
                    const isLast = idx === matrix.length - 1;

                    return (
                      <React.Fragment key={item.catalogue_id}>
                        <div style={{ flex: 1, paddingTop: 16, paddingBottom: 4, minWidth: 0 }}>
                          <ProductCard
                            item={item}
                            catalogue={catalogue}
                            isRecommended={isRecommended}
                            onAddToCart={onAddToCart}
                            t={t}
                          />
                        </div>
                        {/* VS Divider */}
                        {!isLast && (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "16px 12px",
                            flexShrink: 0,
                            gap: 8,
                          }}>
                            <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--ui-border), transparent)" }} />
                            <div style={{
                              fontSize: 18, fontWeight: 900,
                              background: "linear-gradient(135deg, #6366f1, #a855f7)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              animation: "vsPulse 2s ease-in-out infinite",
                              letterSpacing: "0.05em",
                            }}>
                              VS
                            </div>
                            <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--ui-border), transparent)" }} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* No AI data fallback — show product cards from raw catalogues */}
                {matrix.length === 0 && catalogues.length > 0 && (
                  <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                    {catalogues.map((catalogue: any, idx: number) => {
                      const isLast = idx === catalogues.length - 1;
                      return (
                        <React.Fragment key={catalogue.id}>
                          <div style={{ flex: 1, paddingTop: 16, paddingBottom: 4, minWidth: 0 }}>
                            <ProductCard
                              item={{ catalogue_id: catalogue.id, product_name: catalogue.name }}
                              catalogue={catalogue}
                              isRecommended={false}
                              onAddToCart={onAddToCart}
                              t={t}
                            />
                          </div>
                          {!isLast && (
                            <div style={{
                              display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              padding: "16px 12px", flexShrink: 0, gap: 8,
                            }}>
                              <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--ui-border), transparent)" }} />
                              <div style={{
                                fontSize: 18, fontWeight: 900,
                                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                animation: "vsPulse 2s ease-in-out infinite",
                              }}>
                                VS
                              </div>
                              <div style={{ width: 1, flex: 1, background: "linear-gradient(to bottom, transparent, var(--ui-border), transparent)" }} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </HuntrSurface>
      </div>
    </>
  );
}
