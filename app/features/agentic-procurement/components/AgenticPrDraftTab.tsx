import React, { useState, useRef } from "react";
import {
  Building,
  Calendar,
  ShieldCheck,
  DollarSign,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  FileText,
  Tag,
  ChevronDown,
  Trophy,
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

const DEPT_KEYS = [
  "procurement",
  "ga",
  "it",
  "finance",
  "hr",
  "operations",
  "marketing",
  "rnd",
  "legal",
  "facility",
  "supplyChain",
  "sales",
] as const;

const TENDER_DAYS = [7, 14, 21, 30];

interface AgenticPrDraftTabProps {
  prDraft: any;
  intent: any;
  activeCompanyName?: string;
  isCreatingPr: boolean;
  onCreatePr: (config: PrConfig) => void;
  onUpdateItemQty: (index: number, quantity: number) => void;
  formatRupiah: (num: number) => string;
  getTotalBudget: (draft?: any, intent?: any) => number;
  selectedWinner?: any;
  wmsInstalled?: boolean;
  warehouses?: any[];
}

export interface PrConfig {
  department: string;
  tenderDays: number;
  attachments: File[];
  warehouseId?: string;
}

function StatusBadgeInner({
  status,
  t,
}: {
  status: string;
  t: (k: string) => string;
}) {
  const map: Record<string, { label: string; cls: string }> = {
    verified_catalogue: {
      label: t("agentic.prDraft.statusBadge.verifiedCatalogue"),
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    historical_reference: {
      label: t("agentic.prDraft.statusBadge.historical"),
      cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
    web_market_reference: {
      label: t("agentic.prDraft.statusBadge.webMarket"),
      cls: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    },
    web_listing_reference: {
      label: t("agentic.prDraft.statusBadge.webListing"),
      cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    market_estimate: {
      label: t("agentic.prDraft.statusBadge.marketEstimate"),
      cls: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    buyer_budget: {
      label: t("agentic.prDraft.statusBadge.buyerBudget"),
      cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    rfq_required: {
      label: t("agentic.prDraft.statusBadge.rfqRequired"),
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <span
      className={
        "px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap " +
        m.cls
      }
    >
      {m.label}
    </span>
  );
}

export default function AgenticPrDraftTab({
  prDraft,
  intent,
  activeCompanyName,
  isCreatingPr,
  onCreatePr,
  onUpdateItemQty,
  formatRupiah,
  getTotalBudget,
  selectedWinner,
  wmsInstalled = false,
  warehouses = [],
}: AgenticPrDraftTabProps) {
  const { t } = useLanguage();

  const DEPARTMENTS = DEPT_KEYS.map((k) =>
    t(`agentic.prDraft.departments.${k}`),
  );

  const totalBudget = getTotalBudget(prDraft, intent);
  const defaultDept = DEPARTMENTS[0];
  const initialDept = (() => {
    const d = prDraft?.department;
    if (!d) return defaultDept;
    // Jika sudah pernah di-set ke nilai string cocok dengan translated values, keep
    if (DEPARTMENTS.includes(d)) return d;
    // Coba match via key originalnya (conbackend msh "Procurement")
    const idx = [
      "Procurement",
      "General Affairs (GA)",
      "Information Technology (IT)",
      "Finance & Accounting",
      "Human Resources (HR)",
      "Operations",
      "Marketing",
      "Research & Development (R&D)",
      "Legal",
      "Facility Management",
      "Supply Chain",
      "Sales",
    ].indexOf(d);
    if (idx >= 0) return DEPARTMENTS[idx] ?? defaultDept;
    return defaultDept;
  })();

  const [department, setDepartment] = useState<string>(initialDept);
  const [tenderDays, setTenderDays] = useState<number>(
    prDraft?.duration_days || 14,
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const allowed = Array.from(files).filter((f) =>
      [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(f.type),
    );
    setAttachments((prev) => [...prev, ...allowed].slice(0, 5));
  }

  function removeFile(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  const tRenderPrf = (s: string) =>
    typeof s === "string" && s.toLowerCase().includes("urgent")
      ? "urgent"
      : "normal";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Left: PR Document ── */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
          {/* Header */}
          <div className="border-b border-[var(--ui-border)] pb-3">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              {t("agentic.prDraft.headerTitle")}
            </span>
            <h3 className="text-sm md:text-base font-bold text-[var(--ui-text-primary)] mt-0.5">
              {prDraft.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-[var(--ui-text-muted)]">
              <span className="flex items-center gap-1">
                <Building size={11} /> {t("agentic.prDraft.needDeptLabel")}:{" "}
                {department}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />{" "}
                {t("agentic.prDraft.tenderLabel", { days: tenderDays })}
              </span>
              <span>•</span>
              <span
                className={
                  "px-1.5 rounded font-semibold text-[10px] border " +
                  (tRenderPrf(prDraft.priority || "") === "urgent"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")
                }
              >
                {tRenderPrf(prDraft.priority || "") === "urgent"
                  ? t("agentic.prDraft.priorityUrgent")
                  : t("agentic.prDraft.priorityNormal")}
              </span>
              {selectedWinner && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold">
                  <Trophy size={9} />
                  {t("agentic.prDraft.selectedWinnerPrefix")}{" "}
                  {selectedWinner.product_name || selectedWinner.name}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
              {t("agentic.prDraft.needDescriptionTitle")}
            </span>
            <p className="text-xs text-[var(--ui-text-primary)] leading-relaxed bg-[var(--ui-bg-input)] p-3 rounded-md border border-[var(--ui-border)]">
              {prDraft.description}
            </p>
          </div>

          {/* Justification */}
          {prDraft.business_justification && (
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px] flex items-center gap-1">
                <ShieldCheck size={12} className="text-orange-400" />
                {t("agentic.prDraft.businessJustification")}
              </span>
              <div className="text-xs text-[var(--ui-text-primary)] bg-orange-500/5 p-3 rounded-md border border-orange-500/20">
                {prDraft.business_justification}
              </div>
            </div>
          )}

          {/* Line Items — Desktop */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
              {t("agentic.prDraft.lineItemsTitle", {
                count: prDraft.suggested_items?.length || 0,
              })}
            </span>

            <div className="hidden sm:block overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--ui-bg-input)] border-b border-[var(--ui-border)] text-[var(--ui-text-muted)] font-semibold">
                    <th className="px-3 py-2">
                      {t("agentic.prDraft.tableHeaders.itemSpec")}
                    </th>
                    <th className="px-3 py-2">
                      {t("agentic.prDraft.tableHeaders.brand")}
                    </th>
                    <th className="px-3 py-2 text-center">
                      {t("agentic.prDraft.tableHeaders.qty")}
                    </th>
                    <th className="px-3 py-2 text-right">
                      {t("agentic.prDraft.tableHeaders.unitPrice")}
                    </th>
                    <th className="px-3 py-2 text-right">
                      {t("agentic.prDraft.tableHeaders.subtotal")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {prDraft.suggested_items?.map((item: any, idx: number) => {
                    const price = item.estimated_price || 0;
                    const subtotal = (item.qty || 1) * price;
                    const status =
                      item.price_status ||
                      (price > 0
                        ? item.catalogue_id
                          ? "verified_catalogue"
                          : "buyer_budget"
                        : "rfq_required");
                    const brand =
                      item.brand ||
                      item.vendor_name ||
                      selectedWinner?.vendor_name ||
                      "";
                    const webSources = (item.web_sources || [])
                      .filter((source: any) => source.link)
                      .slice(0, 10);

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-[var(--ui-bg-input)]/50 transition-colors"
                      >
                        <td className="px-3 py-2.5 max-w-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[var(--ui-text-primary)]">
                              {item.name}
                            </span>
                            <StatusBadgeInner status={status} t={t} />
                          </div>
                          <div className="text-[11px] text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
                            {item.detailed_specs || item.reason || "—"}
                          </div>
                          {item.item_code && (
                            <div className="text-[10px] text-[var(--ui-text-muted)] opacity-70 font-mono mt-0.5">
                              {t("agentic.prDraft.itemCodeLabel")}{" "}
                              {item.item_code}
                            </div>
                          )}
                          {item.price_note && (
                            <div className="text-[10px] text-blue-400/80 mt-0.5 italic">
                              {item.price_note}
                            </div>
                          )}
                          {webSources.length > 0 && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {webSources.map(
                                (source: any, sourceIndex: number) => (
                                  <a
                                    key={sourceIndex}
                                    href={source.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between gap-2 text-[10px] text-blue-400 hover:text-blue-300"
                                  >
                                    <span className="min-w-0 truncate">
                                      {source.title || source.source}
                                    </span>
                                    {source.price > 0 && (
                                      <span className="shrink-0">
                                        {formatRupiah(source.price)}
                                      </span>
                                    )}
                                  </a>
                                ),
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2.5 min-w-[100px]">
                          {brand ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--ui-text-secondary)]">
                              <Tag
                                size={10}
                                className="text-orange-400 flex-shrink-0"
                              />
                              {brand}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--ui-text-muted)] italic">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-center font-medium text-[var(--ui-text-primary)] whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={item.qty || 1}
                              onChange={(event) =>
                                onUpdateItemQty(
                                  idx,
                                  Math.max(
                                    1,
                                    Number.parseInt(event.target.value, 10) ||
                                      1,
                                  ),
                                )
                              }
                              aria-label={`${t("agentic.prDraft.tableHeaders.qty")} ${item.name}`}
                              className="w-16 bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded px-2 py-1 text-center text-[var(--ui-text-primary)]"
                            />
                            <span>
                              {item.uom || t("agentic.itemGenericUom")}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[var(--ui-text-secondary)] whitespace-nowrap">
                          {price > 0 ? (
                            formatRupiah(price)
                          ) : (
                            <span className="text-[11px] text-amber-400 italic">
                              {t("agentic.prDraft.statusBadge.rfqRequired")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-400 whitespace-nowrap">
                          {price > 0 ? (
                            formatRupiah(subtotal)
                          ) : (
                            <span className="text-[11px] text-amber-400 font-medium">
                              {t("agentic.prDraft.statusBadge.rfqRequired")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--ui-bg-input)] font-bold text-[var(--ui-text-primary)]">
                    <td colSpan={4} className="px-3 py-2 text-right">
                      {t("agentic.prDraft.totalBudget")}:
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-400">
                      {totalBudget > 0 ? (
                        formatRupiah(totalBudget)
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          {t("agentic.prDraft.needVendorOffer")}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden flex flex-col gap-2">
              {prDraft.suggested_items?.map((item: any, idx: number) => {
                const price = item.estimated_price || 0;
                const subtotal = (item.qty || 1) * price;
                const status =
                  item.price_status ||
                  (price > 0
                    ? item.catalogue_id
                      ? "verified_catalogue"
                      : "buyer_budget"
                    : "rfq_required");
                const brand =
                  item.brand ||
                  item.vendor_name ||
                  selectedWinner?.vendor_name ||
                  "";
                const webSources = (item.web_sources || [])
                  .filter((source: any) => source.link)
                  .slice(0, 10);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[var(--ui-text-primary)] leading-tight">
                        {item.name}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 flex-shrink-0">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.qty || 1}
                          onChange={(event) =>
                            onUpdateItemQty(
                              idx,
                              Math.max(
                                1,
                                Number.parseInt(event.target.value, 10) || 1,
                              ),
                            )
                          }
                          aria-label={`${t("agentic.prDraft.tableHeaders.qty")} ${item.name}`}
                          className="w-12 bg-transparent border-b border-orange-500/40 text-center text-orange-500 focus:outline-none"
                        />
                        {item.uom || t("agentic.itemGenericUom")}
                      </span>
                    </div>
                    {brand && (
                      <div className="flex items-center gap-1 text-[11px] text-[var(--ui-text-secondary)]">
                        <Tag size={10} className="text-orange-400" />
                        {brand}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      <StatusBadgeInner status={status} t={t} />
                    </div>
                    {item.detailed_specs && (
                      <p className="text-[11px] text-[var(--ui-text-muted)] leading-relaxed">
                        {item.detailed_specs}
                      </p>
                    )}
                    {item.price_note && (
                      <p className="text-[10px] text-blue-400/80 italic">
                        {item.price_note}
                      </p>
                    )}
                    {webSources.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {webSources.map((source: any, sourceIndex: number) => (
                          <a
                            key={sourceIndex}
                            href={source.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start justify-between gap-2 text-[10px] text-blue-400 hover:text-blue-300"
                          >
                            <span className="min-w-0 truncate">
                              {source.title || source.source}
                            </span>
                            {source.price > 0 && (
                              <span className="shrink-0">
                                {formatRupiah(source.price)}
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-[var(--ui-border)] text-[11px]">
                      <span className="text-[var(--ui-text-muted)]">
                        {price > 0
                          ? "@ " + formatRupiah(price)
                          : t("agentic.prDraft.statusBadge.rfqRequired")}
                      </span>
                      <span className="font-bold font-mono text-orange-400">
                        {price > 0 ? formatRupiah(subtotal) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Config + Summary ── */}
      <div className="flex flex-col gap-3">
        {/* Department */}
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <Building size={12} className="text-orange-400" />
            {t("agentic.prDraft.configDeptTitle")} ·{" "}
            {t("agentic.prDraft.deptLabel")}
          </span>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full appearance-none bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded-md px-3 py-2 text-xs text-[var(--ui-text-primary)] pr-7 focus:outline-none focus:border-orange-400 transition-colors cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] pointer-events-none"
            />
          </div>
        </div>

        {/* Tender Duration */}
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={12} className="text-orange-400" />
            {t("agentic.prDraft.tenderDurationLabel")}
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {TENDER_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTenderDays(d)}
                className={
                  "py-1.5 rounded-md text-[11px] font-bold transition-all border cursor-pointer " +
                  (tenderDays === d
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] border-[var(--ui-border)] hover:border-orange-400/60")
                }
              >
                {t("agentic.prDraft.tenderDayShorthand", { days: d })}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--ui-text-muted)]">
            {t("agentic.prDraft.tenderActiveDuration")} ·{" "}
            <span className="font-bold text-[var(--ui-text-primary)]">
              {tenderDays} {t("agentic.prDraft.tenderDayUnit")}
            </span>
          </p>
        </div>

        {/* Upload */}
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <Upload size={12} className="text-orange-400" />
            {t("agentic.prDraft.attachmentsLabel")}
          </span>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={
              "border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors " +
              (isDragging
                ? "border-orange-400 bg-orange-500/10"
                : "border-[var(--ui-border)] hover:border-orange-400/50 hover:bg-[var(--ui-bg-input)]")
            }
          >
            <Upload
              size={16}
              className="mx-auto mb-1 text-[var(--ui-text-muted)]"
            />
            <p className="text-[10px] text-[var(--ui-text-muted)]">
              {t("agentic.prDraft.attachmentsHint")}
            </p>
            <p className="text-[9px] text-[var(--ui-text-muted)] opacity-60 mt-0.5">
              {t("agentic.prDraft.maxFilesNote", {
                current: attachments.length,
              })}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-col gap-1">
              {attachments.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[10px]"
                >
                  <FileText
                    size={11}
                    className="text-orange-400 flex-shrink-0"
                  />
                  <span className="flex-1 truncate text-[var(--ui-text-primary)] font-medium">
                    {f.name}
                  </span>
                  <span className="text-[var(--ui-text-muted)] flex-shrink-0">
                    {formatFileSize(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-[var(--ui-text-muted)] hover:text-red-400 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <X size={10} />{" "}
                    <span className="sr-only">
                      {t("agentic.prDraft.removeFile")}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={12} className="text-emerald-400" />
            {t("agentic.prDraft.grandTotal")}
          </span>
          <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
            <span className="text-[10px] text-emerald-400 font-semibold">
              {t("agentic.prDraft.totalBudget")}
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {totalBudget > 0
                ? formatRupiah(totalBudget)
                : t("agentic.prDraft.needVendorOffer")}
            </span>
            {totalBudget === 0 && (
              <span className="text-[10px] text-amber-400 mt-0.5">
                {t("agentic.prDraft.needVendorOffer")}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs divide-y divide-[var(--ui-border)]">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">
                {t("agentic.prDraft.summaryCompany")}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {activeCompanyName || t("agentic.prDraft.buyerFallback")}
              </span>
            </div>
            {wmsInstalled && (
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[var(--ui-text-muted)]">
                  Receiving warehouse
                </label>
                <select
                  value={warehouseId}
                  onChange={(event) => setWarehouseId(event.target.value)}
                  className="w-full rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1.5 text-xs text-[var(--ui-text-primary)]"
                >
                  <option value="">No WMS warehouse selected</option>
                  {warehouses
                    .filter((warehouse) => warehouse.status === "active")
                    .map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} · {warehouse.code}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-[var(--ui-text-muted)]">
                  Goods Receipt will be recorded in this warehouse.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">
                {t("agentic.prDraft.deptLabel")}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)] truncate max-w-[130px]">
                {department}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">
                {t("agentic.prDraft.tenderDurationLabel")}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {t("agentic.prDraft.tenderDayShorthand", { days: tenderDays })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">
                {t("agentic.prDraft.attachmentsLabel")}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {attachments.length > 0
                  ? attachments.length + " " + t("agentic.prDraft.summaryFiles")
                  : "—"}
              </span>
            </div>
            {selectedWinner && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[var(--ui-text-muted)]">
                  {t("agentic.comparison.selectedBadge")}
                </span>
                <span className="font-semibold text-yellow-400 flex items-center gap-1 truncate max-w-[130px]">
                  <Trophy size={10} />{" "}
                  {selectedWinner.product_name || selectedWinner.name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--ui-text-muted)]">
                {t("agentic.prDraft.summaryDelivery")}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)] truncate max-w-[130px]">
                {prDraft.delivery_point_recommendation ||
                  t("agentic.prDraft.summaryHeadOffice")}
              </span>
            </div>
          </div>
          <button
            onClick={() =>
              onCreatePr({ department, tenderDays, attachments, warehouseId })
            }
            disabled={isCreatingPr}
            className="w-full mt-1 py-2.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCreatingPr ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{t("agentic.tabs.saving")}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>{t("agentic.prDraft.actions.createNow")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
