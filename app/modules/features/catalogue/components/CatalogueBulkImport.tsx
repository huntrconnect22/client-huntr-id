import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import React from "react";
import { Download, UploadCloud } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

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

const downloadTemplate = () => {
  const rows = [
    ["Inventory Code", "Inventory name", "Category", "Specifications", "Primary UOM"],
    ["SKU-CTH-001", "Contoh Produk", "Office Supplies", "Warna putih; ukuran A4", "Pcs"],
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "huntr-catalogue-import-template.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

export default function CatalogueBulkImport({
  file,
  setFile,
  loading,
  result,
  onSubmit,
}: CatalogueBulkImportProps) {
  const { t } = useLanguage();

  return (
    <HuntrSurface
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
            {t("catalogue.importCard.title")}
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ui-text-muted)" }}>
            {t("catalogue.importCard.subtitle")}
          </p>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <HuntrButton
            type="button"
            onClick={downloadTemplate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--ui-border-input)",
              background: "transparent",
              color: "var(--ui-text-secondary)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Download size={15} /> {t("catalogue.importCard.downloadTemplate")}
          </HuntrButton>
          <HuntrInput
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
            <UploadCloud size={15} /> {file ? file.name : t("catalogue.importCard.selectFile")}
          </label>
          <HuntrButton
            type="submit"
            disabled={loading || !file}
            style={{
              ...primaryBtn,
              opacity: !file || loading ? 0.5 : 1,
            }}
          >
            {loading ? t("catalogue.importCard.processing") : t("catalogue.importCard.importBtn")}
          </HuntrButton>
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
            fontSize: 12,
            color: "var(--ui-text-secondary)",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </HuntrSurface>
  );
}


