import React from "react";
import { ChevronRight } from "lucide-react";
import { getAssetUrl } from "../../../lib/assets";
import { type CatalogueItem } from "../types";

interface CatalogueGridViewProps {
  items: CatalogueItem[];
  selectedItemIds: (string | number)[];
  onToggleSelectItem: (id: string | number) => void;
  onEditItem: (item: CatalogueItem) => void;
}

export default function CatalogueGridView({
  items,
  selectedItemIds,
  onToggleSelectItem,
  onEditItem,
}: CatalogueGridViewProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {items.map((item) => {
        const isSelected = selectedItemIds.includes(item.id);
        return (
          <div
            key={item.id}
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--ui-bg-card)",
              border: `1px solid ${isSelected ? "var(--huntr-orange)" : "var(--ui-border)"}`,
              borderRadius: 8,
              transition: "border-color 0.15s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelectItem(item.id)}
                  style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ui-text-brand)",
                    background: "var(--ui-bg-badge)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    letterSpacing: "0.06em",
                    fontFamily: "monospace",
                  }}
                >
                  {item.item_code}
                </div>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)", margin: 0, lineHeight: 1.3 }}>
                {item.name}
              </h4>
              <div style={{ fontSize: 11, color: "var(--ui-text-brand)", marginTop: 3, fontWeight: 600 }}>
                {item.category || "General"}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ui-text-secondary)",
                  margin: "8px 0 0",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.specifications || "No detailed specifications provided."}
              </p>
              {(item.image_url || item.image_path) && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={getAssetUrl(item.image_url || item.image_path)}
                    alt={item.name}
                    style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 6 }}
                  />
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: "auto",
                paddingTop: 12,
                borderTop: "1px solid var(--ui-border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>
                UOM: <strong style={{ color: "var(--ui-text-secondary)" }}>{item.uom}</strong>
              </span>
              <button
                type="button"
                onClick={() => onEditItem(item)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ui-text-brand)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Edit <ChevronRight size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
