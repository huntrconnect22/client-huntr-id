import React from "react";
import { UploadCloud } from "lucide-react";

interface CatalogueBulkImportProps {
  file: File | null;
  setFile: (file: File | null) => void;
  loading: boolean;
  result: any;
  onSubmit: (e: React.FormEvent) => void;
}

const primaryBtn = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "var(--huntr-orange)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

export default function CatalogueBulkImport({
  file,
  setFile,
  loading,
  result,
  onSubmit,
}: CatalogueBulkImportProps) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 8,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>
            Bulk Import
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ui-text-muted)" }}>
            Upload your catalogue via Excel or CSV file.
          </p>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            id="csv-upload"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="csv-upload"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border-input)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              color: file ? "var(--ui-text-primary)" : "var(--ui-text-muted)",
            }}
          >
            <UploadCloud size={15} /> {file ? file.name : "Select file..."}
          </label>
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              ...primaryBtn,
              opacity: !file || loading ? 0.5 : 1,
            }}
          >
            {loading ? "Processing..." : "Import"}
          </button>
        </form>
      </div>
      {result && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 8,
            color: "var(--huntr-green)",
            fontSize: 12,
          }}
        >
          ✓ Catalogue update has been queued and will be visible shortly.
        </div>
      )}
    </div>
  );
}
