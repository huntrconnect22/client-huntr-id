import React from "react";
import { Sparkles, Loader2, X, Image as ImageIcon } from "lucide-react";
import { PRODUCT_CATEGORIES, type CatalogueFormData } from "../types";

interface CatalogueModalFormProps {
  show: boolean;
  onClose: () => void;
  editingItem: any | null;
  formData: CatalogueFormData;
  setFormData: React.Dispatch<React.SetStateAction<CatalogueFormData>>;
  productImage: File | null;
  setProductImage: (file: File | null) => void;
  loading: boolean;
  aiAutofilling: boolean;
  aiImageSearching: boolean;
  onAiAutofill: () => void;
  onAiImageSearch: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const Field = ({ label, value, onChange, placeholder, required }: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-secondary)" }}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{
        padding: "9px 12px",
        borderRadius: 8,
        border: "1px solid var(--ui-border-input)",
        background: "var(--ui-bg-input)",
        color: "var(--ui-text-primary)",
        fontSize: 13,
        outline: "none",
      }}
    />
  </div>
);

const lbl = { fontSize: 12, fontWeight: 600, color: "var(--ui-text-secondary)" };
const inputStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid var(--ui-border-input)",
  background: "var(--ui-bg-input)",
  color: "var(--ui-text-primary)",
  fontSize: 13,
  outline: "none",
};
const primaryBtn = {
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "var(--huntr-orange)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

export default function CatalogueModalForm({
  show,
  onClose,
  editingItem,
  formData,
  setFormData,
  productImage,
  setProductImage,
  loading,
  aiAutofilling,
  aiImageSearching,
  onAiAutofill,
  onAiImageSearch,
  onSubmit,
}: CatalogueModalFormProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "0",
          borderRadius: 12,
          border: "1px solid var(--ui-border)",
          background: "var(--ui-bg-card)",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.35)",
          position: "relative",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--ui-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
              {editingItem ? "Edit Product" : "Add New Product"}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* ChatGPT AI Autofill Trigger */}
            <button
              type="button"
              onClick={onAiAutofill}
              disabled={aiAutofilling}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg px-2.5 py-1.5 transition-all shadow-xs"
              style={{
                cursor: aiAutofilling ? "not-allowed" : "pointer",
                opacity: aiAutofilling ? 0.7 : 1,
              }}
              title="Gunakan ChatGPT AI untuk mencari spesifikasi, merek, kategori & gambar produk secara otomatis"
            >
              {aiAutofilling ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
              <span>{aiAutofilling ? "Menganalisis..." : "ChatGPT AI Auto-fill"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                border: "1px solid var(--ui-border)",
                background: "transparent",
                color: "var(--ui-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-input)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-muted)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            padding: "18px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <Field
            label="Item Code"
            value={formData.item_code}
            onChange={(v: any) => setFormData((prev) => ({ ...prev, item_code: v }))}
            placeholder="e.g. HTR-123456"
            required
          />
          <Field
            label="Product Name"
            value={formData.name}
            onChange={(v: any) => setFormData((prev) => ({ ...prev, name: v }))}
            placeholder="e.g. Hydraulic Pump"
            required
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={lbl}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              style={inputStyle}
              required
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Brand (Optional)"
            value={formData.brand}
            onChange={(v: any) => setFormData((prev) => ({ ...prev, brand: v }))}
            placeholder="e.g. Bosch, Siemens"
          />
          <Field
            label="Keywords / Tags"
            value={formData.keywords}
            onChange={(v: any) => setFormData((prev) => ({ ...prev, keywords: v }))}
            placeholder="e.g. pump, hydraulic"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={lbl}>UOM</label>
            <select
              value={formData.uom}
              onChange={(e) => setFormData((prev) => ({ ...prev, uom: e.target.value }))}
              style={inputStyle}
              required
            >
              {["Pc", "Box", "Pack", "Kg", "Litre", "Meter", "Unit", "Set", "Roll"].map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <label style={lbl}>Product Image</label>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                className="w-full text-xs"
                style={{
                  ...inputStyle,
                  padding: "8px 12px",
                  cursor: "pointer",
                  flex: 1,
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                disabled={aiImageSearching || !formData.name.trim()}
                onClick={onAiImageSearch}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                title="Generate foto studio produk AI otomatis"
              >
                {aiImageSearching ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                <span>{aiImageSearching ? "Meng-generate..." : "Generate Foto AI"}</span>
              </button>
            </div>
            {productImage && (
              <div className="mt-2 flex items-center gap-2.5 p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] min-w-0 max-w-full">
                <img
                  src={URL.createObjectURL(productImage)}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-md border border-[var(--ui-border)] flex-shrink-0"
                />
                <span className="text-xs text-[var(--ui-text-secondary)] truncate flex-1 font-medium">
                  {productImage.name}
                </span>
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border-none cursor-pointer flex-shrink-0"
                >
                  ✕ Hapus
                </button>
              </div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={lbl}>Specifications</label>
            <textarea
              value={formData.specifications}
              onChange={(e) => setFormData((prev) => ({ ...prev, specifications: e.target.value }))}
              placeholder="Detailed description..."
              rows={4}
              style={{
                ...inputStyle,
                minHeight: 100,
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-bg-input)",
                color: "var(--ui-text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
