import React from "react";

export function PageSkeleton() {
  return (
    <div style={{ padding: "40px", width: "100%", maxWidth: 1400, margin: "0 auto", height: "100vh", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Header Skeleton */}
        <div>
          <div style={{ width: "200px", height: "32px", background: "var(--ui-bg-card)", borderRadius: "8px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <div style={{ width: "400px", height: "16px", background: "var(--ui-bg-card)", borderRadius: "4px", marginTop: "12px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", animationDelay: "100ms" }} />
        </div>
        
        {/* Metric Cards Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "16px" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: "120px", background: "var(--ui-bg-card)", borderRadius: "16px", border: "1px solid var(--ui-border)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", animationDelay: `${i * 100}ms` }} />
          ))}
        </div>

        {/* Large Chart Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <div style={{ height: "300px", background: "var(--ui-bg-card)", borderRadius: "16px", border: "1px solid var(--ui-border)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <div style={{ height: "300px", background: "var(--ui-bg-card)", borderRadius: "16px", border: "1px solid var(--ui-border)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", animationDelay: "200ms" }} />
        </div>
      </div>
    </div>
  );
}
