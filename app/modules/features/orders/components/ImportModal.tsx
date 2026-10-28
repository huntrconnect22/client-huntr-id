import React from "react";
import {
  Loader2, X, FileSpreadsheet
} from "lucide-react";

interface ImportModalProps {
  companyType: string;
  importFile: File | null;
  isImporting: boolean;
  importError: string | null;
  importSuccess: boolean;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onImport: () => void;
}

export const ImportModal = ({
  companyType,
  importFile,
  isImporting,
  importError,
  importSuccess,
  onFileChange,
  onClose,
  onImport,
}: ImportModalProps) => {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 12,
    }}>
      <div style={{
        background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12,
        width: "100%", maxWidth: 500, padding: 12, display: "flex", flexDirection: "column", gap: 16,
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
            Import {companyType === "buyer" ? "Historical PO" : "Catalogue"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ui-text-muted)", cursor: "pointer", transition: "color 0.3s ease" }}>
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: 12, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 12, textAlign: "center",
            background: "var(--ui-bg-input)", cursor: "pointer", transition: "all 0.3s ease",
          }}
          onClick={() => document.getElementById("csv-input")?.click()}
        >
          <FileSpreadsheet size={48} color={importFile ? "#f59e0b" : "var(--ui-text-muted)"} style={{ marginBottom: 16, transition: "color 0.3s ease" }} />
          <p style={{ color: importFile ? "var(--ui-text-primary)" : "var(--ui-text-secondary)", margin: 0, fontSize: 14, fontWeight: 600, transition: "color 0.3s ease" }}>
            {importFile ? importFile.name : "Click to select Excel or CSV file"}
          </p>
          <p style={{ color: "var(--ui-text-muted)", fontSize: 12, marginTop: 8, transition: "color 0.3s ease" }}>
            Supported formats: CSV, Excel (.xlsx, .xls, .xlsm, .ods)
          </p>
          <input
            id="csv-input"
            type="file"
            accept=".csv, .xlsx, .xls, .xlsm, .ods"
            style={{ display: "none" }}
            onChange={e => onFileChange(e.target.files?.[0] || null)}
          />
        </div>

        {importError && (
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, transition: "all 0.3s ease" }}>
            {importError}
          </div>
        )}

        {importSuccess && (
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 13, transition: "all 0.3s ease" }}>
            Import successful! Processing in background...
          </div>
        )}

        <button
          onClick={onImport}
          disabled={!importFile || isImporting || importSuccess}
          style={{
            width: "100%", padding: 12, borderRadius: 8, background: "linear-gradient(135deg,#f97316,#f59e0b)",
            color: "#fff", fontWeight: 700, border: "none", cursor: (isImporting || !importFile) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 8px 20px rgba(249,115,22,0.2)", opacity: (isImporting || !importFile) ? 0.6 : 1, transition: "all 0.3s ease"
          }}
        >
          {isImporting ? <Loader2 size={20} className="animate-spin" /> : "Start Import"}
        </button>
      </div>
    </div>
  );
};


