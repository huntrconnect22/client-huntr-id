import React from "react";
import { BarChart3 } from "lucide-react";

interface CompareAiAnalysisProps {
  analysis: string;
}

export const CompareAiAnalysis: React.FC<CompareAiAnalysisProps> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 24,
        background: "rgba(34,197,94,0.05)",
        border: "1px solid rgba(34,197,94,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <BarChart3 size={24} color="#22c55e" />
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            color: "#22c55e",
          }}
        >
          Overall AI Analysis
        </h3>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--ui-text-primary)",
        }}
      >
        {analysis}
      </p>
    </div>
  );
};
