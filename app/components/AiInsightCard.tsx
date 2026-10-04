import React from "react";
import { Sparkles, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface AiInsightCardProps {
  summary: string;
  totalFound: number;
  query: string;
  catalogueIds: string[];
  onGeneratePr: () => void;
  onDismiss: () => void;
  isGenerating?: boolean;
  comparisonAnalysis?: string | null;
  isComparison?: boolean;
  specs?: string[];
}

function ComparisonTableRenderer({ text }: { text: string }) {
  if (!text.includes("|")) {
    return (
      <div style={{ fontSize: 13, color: "var(--ui-text-secondary)", whiteSpace: "pre-line", lineHeight: 1.6 }}>
        {text}
      </div>
    );
  }

  const lines = text.split("\n");
  const tableRows: string[][] = [];
  const textBefore: string[] = [];
  const textAfter: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      inTable = true;
      if (trimmed.includes("---") || trimmed.includes("===")) {
        continue;
      }
      const cols = trimmed.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      tableRows.push(cols);
    } else {
      if (inTable && trimmed === "") {
        inTable = false;
        continue;
      }
      if (inTable) {
        inTable = false;
      }
      if (trimmed !== "") {
        if (tableRows.length === 0) {
          textBefore.push(line);
        } else {
          textAfter.push(line);
        }
      }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      {textBefore.length > 0 && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
          {textBefore.join("\n")}
        </p>
      )}

      {tableRows.length > 0 && (
        <div style={{ width: "100%", overflowX: "auto", borderRadius: 14, border: "1px solid rgba(249,115,22,0.15)", background: "rgba(0,0,0,0.25)", marginTop: 8, marginBottom: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(249,115,22,0.12)", borderBottom: "1px solid rgba(249,115,22,0.2)" }}>
                {tableRows[0].map((cell, idx) => (
                  <th key={idx} style={{ padding: "10px 14px", fontWeight: 800, color: "#f97316" }}>
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, rowIdx) => (
                <tr key={rowIdx} style={{ borderBottom: rowIdx === tableRows.length - 2 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} style={{ padding: "10px 14px", color: cellIdx === 0 ? "var(--ui-text-secondary)" : "var(--ui-text-primary)", fontWeight: cellIdx === 0 ? 700 : 400 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {textAfter.length > 0 && (
        <div style={{ margin: 0, fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
          {textAfter.join("\n")}
        </div>
      )}
    </div>
  );
}

/**
 * AiInsightCard
 *
 * Card yang tampil di atas hasil search saat AI mode aktif.
 * Menampilkan ringkasan AI dan tombol "Buat PR Otomatis".
 */
export default function AiInsightCard({
  summary,
  totalFound,
  query,
  catalogueIds,
  onGeneratePr,
  onDismiss,
  isGenerating = false,
  comparisonAnalysis = null,
  isComparison = false,
  specs = [],
}: AiInsightCardProps) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.05) 50%, rgba(168,85,247,0.05) 100%)",
        border: "1px solid rgba(249,115,22,0.25)",
        borderRadius: 20,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "fadeSlideIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* AI Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg, #f97316, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}
        >
          <Sparkles size={20} color="#fff" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#f97316",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Huntr AI
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isComparison ? "#6366f1" : "#a855f7",
                background: isComparison ? "rgba(99,102,241,0.1)" : "rgba(168,85,247,0.1)",
                padding: "2px 8px",
                borderRadius: 20,
                border: isComparison ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(168,85,247,0.2)",
              }}
            >
              {isComparison ? t("marketplace.aiInsight.badgeComparison") : t("marketplace.aiInsight.badgeAi")}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ui-text-primary)",
              lineHeight: 1.6,
            }}
          >
            {summary}
          </p>

          {/* Spec badges from AI intent */}
          {specs && specs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {specs.map((spec, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700,
                  color: "#f59e0b",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.18)",
                  padding: "2px 8px", borderRadius: 20,
                }}>
                  {spec}
                </span>
              ))}
            </div>
          )}

          {comparisonAnalysis && (
            <div style={{ marginTop: 12 }}>
              <ComparisonTableRenderer text={comparisonAnalysis} />
            </div>
          )}

          {/* Loading skeleton for comparison */}
          {isComparison && !comparisonAnalysis && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 12, borderRadius: 6, background: "rgba(99,102,241,0.12)", width: "60%", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ height: 80, borderRadius: 10, background: "rgba(99,102,241,0.08)", width: "100%", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.2s" }} />
              <div style={{ height: 12, borderRadius: 6, background: "rgba(99,102,241,0.08)", width: "80%", animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.4s" }} />
              <div style={{ fontSize: 11, color: "#6366f1", marginTop: 4 }}>{t("marketplace.aiInsight.loadingComparison")}</div>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--ui-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label={t("marketplace.aiInsight.closeAria")}
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats + Action */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(249,115,22,0.12)",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            {t("marketplace.aiInsight.productsFound", { count: totalFound })}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ui-text-muted)",
              maxWidth: 240,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {t("marketplace.aiInsight.forQuery", { query })}
          </div>
        </div>

        {catalogueIds.length > 0 && (
          <button
            onClick={onGeneratePr}
            disabled={isGenerating}
            style={{
              padding: "8px 18px",
              borderRadius: 12,
              background: isGenerating
                ? "rgba(249,115,22,0.3)"
                : "linear-gradient(135deg, #f97316, #f59e0b)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: isGenerating
                ? "none"
                : "0 4px 14px rgba(249,115,22,0.35)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {isGenerating ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t("marketplace.aiInsight.generatingPr")}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {t("marketplace.aiInsight.generatePrBtn")}
              </>
            )}
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
