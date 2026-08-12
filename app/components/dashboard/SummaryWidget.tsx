import React from "react";

export function SummaryWidget({
  label,
  value,
  hint,
  icon: Icon,
  accent = "orange",
}: {
  label: string;
  value: string;
  hint: string;
  icon: any;
  accent?: "orange" | "green" | "blue";
}) {
  const accentStyles = {
    orange: { bg: "rgba(249,115,22,0.1)", color: "#f59e0b" },
    green: { bg: "rgba(34,197,94,0.1)", color: "#34d399" },
    blue: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa" },
  }[accent];

  return (
    <div style={{
      background: "var(--ui-bg-card)",
      border: "1px solid var(--ui-border)",
      borderRadius: 4,
      padding: "12px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minHeight: 110,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: accentStyles.bg, color: accentStyles.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: "var(--ui-text-primary)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ui-text-secondary)", lineHeight: 1.4 }}>{hint}</div>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--ui-border-subtle)" }}>
      <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ui-text-primary)" }}>{value}</div>
    </div>
  );
}
