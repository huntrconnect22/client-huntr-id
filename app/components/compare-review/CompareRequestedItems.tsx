import React from "react";
import { Package } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

interface CompareRequestedItemsProps {
  items: any[];
}

export const CompareRequestedItems: React.FC<CompareRequestedItemsProps> = ({ items = [] }) => {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        Requested Items ({items.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item: any, index: number) => {
          const catalogue = item.catalogue;
          return (
            <div
              key={index}
              style={{
                padding: 16,
                background: "var(--ui-bg-input)",
                borderRadius: 12,
                border: "1px solid var(--ui-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: catalogue?.image_path ? "transparent" : "var(--ui-bg-card)",
                    border: "1px solid var(--ui-border)",
                  }}
                >
                  {catalogue?.image_path ? (
                    <img
                      src={getAssetUrl(catalogue.image_url || catalogue.image_path)}
                      alt={catalogue?.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                      }}
                    />
                  ) : (
                    <Package size={22} className="text-[var(--ui-text-muted)] opacity-40" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {catalogue?.category && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#f59e0b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      {catalogue.category}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--ui-text-primary)",
                      marginBottom: 2,
                    }}
                  >
                    {catalogue?.name || "Unknown Item"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ui-text-muted)",
                      marginBottom: 4,
                    }}
                  >
                    Qty: {item.qty} {catalogue?.uom || "pcs"}
                  </div>
                  {catalogue?.specifications && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ui-text-muted)",
                        lineHeight: 1.4,
                        maxWidth: 400,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {catalogue.specifications}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#f97316",
                  }}
                >
                  Rp {Number(item.estimated_price || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>per {catalogue?.uom || "pcs"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
