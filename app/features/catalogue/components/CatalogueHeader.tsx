import React from "react";
import { Plus, Wand2, Loader2, Search, LayoutGrid, List } from "lucide-react";

interface CatalogueHeaderProps {
  onAddNew: () => void;
  onBatchAiUpdate: () => void;
  selectedCount: number;
  aiBatchUpdating: boolean;
  localSearch: string;
  setLocalSearch: (val: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export default function CatalogueHeader({
  onAddNew,
  onBatchAiUpdate,
  selectedCount,
  aiBatchUpdating,
  localSearch,
  setLocalSearch,
  viewMode,
  setViewMode,
}: CatalogueHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={onAddNew}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "var(--huntr-orange)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          <Plus size={16} /> Add New Item
        </button>

        {/* ChatGPT AI Batch Update Button */}
        <button
          onClick={onBatchAiUpdate}
          disabled={aiBatchUpdating || selectedCount === 0}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid var(--ui-border)",
            backgroundColor: selectedCount > 0 ? "rgba(249,115,22,0.1)" : "var(--ui-bg-card)",
            borderColor: selectedCount > 0 ? "var(--huntr-orange)" : "var(--ui-border)",
            color: selectedCount > 0 ? "var(--huntr-orange)" : "var(--ui-text-primary)",
            fontSize: 13,
            fontWeight: 700,
            cursor: selectedCount === 0 || aiBatchUpdating ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: selectedCount === 0 || aiBatchUpdating ? 0.6 : 1,
          }}
        >
          {aiBatchUpdating ? (
            <Loader2 className="animate-spin" size={15} color="var(--huntr-orange)" />
          ) : (
            <Wand2 size={15} color="var(--huntr-orange)" />
          )}
          ChatGPT AI Mass Update {selectedCount > 0 ? `(${selectedCount} Terpilih)` : "(Pilih Produk)"}
        </button>

      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 560 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={15}
            color="var(--ui-text-muted)"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search your catalogue..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              borderRadius: 8,
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border-input)",
              color: "var(--ui-text-primary)",
              outline: "none",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            background: "var(--ui-bg-input)",
            padding: 3,
            borderRadius: 8,
            border: "1px solid var(--ui-border-input)",
          }}
        >
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: "none",
              background: viewMode === "grid" ? "var(--ui-bg-card)" : "transparent",
              cursor: "pointer",
            }}
          >
            <LayoutGrid size={16} color={viewMode === "grid" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              border: "none",
              background: viewMode === "list" ? "var(--ui-bg-card)" : "transparent",
              cursor: "pointer",
            }}
          >
            <List size={16} color={viewMode === "list" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
          </button>
        </div>
      </div>
    </div>
  );
}
