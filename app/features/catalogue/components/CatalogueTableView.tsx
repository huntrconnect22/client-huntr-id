import React from "react";
import { type CatalogueItem } from "../types";

interface CatalogueTableViewProps {
  items: CatalogueItem[];
  selectedItemIds: (string | number)[];
  onToggleSelectItem: (id: string | number) => void;
  onToggleSelectAll: () => void;
  onEditItem: (item: CatalogueItem) => void;
}

export default function CatalogueTableView({
  items,
  selectedItemIds,
  onToggleSelectItem,
  onToggleSelectAll,
  onEditItem,
}: CatalogueTableViewProps) {
  const topTen = items.slice(0, 10);
  const isAllSelected = selectedItemIds.length > 0 && selectedItemIds.length === topTen.length;

  return (
    <div
      style={{
        overflow: "hidden",
        borderRadius: 8,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ background: "var(--ui-bg-input)", borderBottom: "1px solid var(--ui-border)" }}>
            <th style={{ padding: "10px 16px", width: 40 }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
              />
            </th>
            <th
              style={{
                padding: "10px 16px",
                color: "var(--ui-text-muted)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Item Info
            </th>
            <th
              style={{
                padding: "10px 16px",
                color: "var(--ui-text-muted)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Category
            </th>
            <th
              style={{
                padding: "10px 16px",
                color: "var(--ui-text-muted)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              UOM
            </th>
            <th
              style={{
                padding: "10px 16px",
                color: "var(--ui-text-muted)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textAlign: "right",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <tr
                key={item.id}
                style={{
                  borderBottom: "1px solid var(--ui-border-subtle)",
                  background: isSelected ? "rgba(249,115,22,0.06)" : "transparent",
                  transition: "background 0.1s ease",
                }}
              >
                <td style={{ padding: "14px 16px" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectItem(item.id)}
                    style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
                  />
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ color: "var(--ui-text-primary)", fontWeight: 600, fontSize: 13 }}>
                    {item.name}
                  </div>
                  <div style={{ color: "var(--ui-text-muted)", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>
                    {item.item_code}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: "var(--ui-text-brand)", fontSize: 12, fontWeight: 600 }}>
                    {item.category || "General"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--ui-text-secondary)", fontSize: 12 }}>
                  {item.uom}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    style={{
                      background: "var(--ui-bg-input)",
                      border: "1px solid var(--ui-border-input)",
                      padding: "6px 14px",
                      borderRadius: 6,
                      color: "var(--ui-text-primary)",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--huntr-orange)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ui-border-input)")}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
