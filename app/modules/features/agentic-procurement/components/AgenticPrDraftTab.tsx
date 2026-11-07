import React, { useState, useRef } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableFooter,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import {
  Building,
  Calendar,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  Upload,
  X,
  FileText,
  Tag,
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
  onUpdateItemQty: (index: number, quantity: number | "") => void;
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

function priceConfidenceLabel(confidence?: string): string | null {
  const labels: Record<string, string> = {
    high: "Keandalan tinggi",
    medium: "Keandalan sedang",
    low: "Keandalan rendah",
    buyer_provided: "Anggaran dari buyer",
  };
  return labels[confidence || ""] || null;
}

function StatusBadgeInner({
  status,
  t,
}: {
  status: string;
  t: (k: string) => string;
}) {
  const map: Record<string, { label: string; color: "success" | "info" | "primary" | "warning" | "secondary" | "default" }> = {
    verified_catalogue: {
      label: t("agentic.prDraft.statusBadge.verifiedCatalogue"),
      color: "success",
    },
    historical_reference: {
      label: t("agentic.prDraft.statusBadge.historical"),
      color: "info",
    },
    market_triangulated: {
      label: "Harga tervalidasi",
      color: "success",
    },
    web_market_reference: {
      label: t("agentic.prDraft.statusBadge.webMarket"),
      color: "primary",
    },
    web_listing_reference: {
      label: t("agentic.prDraft.statusBadge.webListing"),
      color: "info",
    },
    market_estimate: {
      label: t("agentic.prDraft.statusBadge.marketEstimate"),
      color: "secondary",
    },
    buyer_budget: {
      label: t("agentic.prDraft.statusBadge.buyerBudget"),
      color: "info",
    },
    rfq_required: {
      label: t("agentic.prDraft.statusBadge.rfqRequired"),
      color: "warning",
    },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <Chip
      size="small"
      label={m.label}
      color={m.color}
      variant="outlined"
      sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
    />
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
    if (DEPARTMENTS.includes(d)) return d;
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

  const isUrgent =
    typeof prDraft.priority === "string" &&
    prDraft.priority.toLowerCase().includes("urgent");

  return (
    <Grid container spacing={3}>
      {/* ── Left Column: PR Draft Document & Table ── */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {/* Header */}
          <Box sx={{ pb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "primary.main" }}>
              {t("agentic.prDraft.headerTitle")}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
              {prDraft.title}
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", mt: 1, gap: 1 }}>
              <Chip
                size="small"
                icon={<Building size={12} />}
                label={`${t("agentic.prDraft.needDeptLabel")}: ${department}`}
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
              <Chip
                size="small"
                icon={<Calendar size={12} />}
                label={t("agentic.prDraft.tenderLabel", { days: tenderDays })}
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
              <Chip
                size="small"
                label={isUrgent ? t("agentic.prDraft.priorityUrgent") : t("agentic.prDraft.priorityNormal")}
                color={isUrgent ? "error" : "success"}
                sx={{ fontSize: 11, fontWeight: 700 }}
              />
              {selectedWinner && (
                <Chip
                  size="small"
                  icon={<Trophy size={12} color="#f59e0b" />}
                  label={`${t("agentic.prDraft.selectedWinnerPrefix")} ${selectedWinner.product_name || selectedWinner.name}`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontSize: 11, fontWeight: 700 }}
                />
              )}
            </Stack>
          </Box>

          {/* Description */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", display: "block", mb: 0.75 }}>
              {t("agentic.prDraft.needDescriptionTitle")}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {prDraft.description}
              </Typography>
            </Paper>
          </Box>

          {/* Business Justification */}
          {prDraft.business_justification && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                <ShieldCheck size={14} color="#ef7d00" />
                {t("agentic.prDraft.businessJustification")}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(239, 125, 0, 0.04)", borderColor: "rgba(239, 125, 0, 0.25)" }}>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {prDraft.business_justification}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Items Table */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary", display: "block", mb: 1 }}>
              {t("agentic.prDraft.lineItemsTitle", {
                count: prDraft.suggested_items?.length || 0,
              })}
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{t("agentic.prDraft.tableHeaders.itemSpec")}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{t("agentic.prDraft.tableHeaders.brand")}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>{t("agentic.prDraft.tableHeaders.qty")}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>{t("agentic.prDraft.tableHeaders.unitPrice")}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>{t("agentic.prDraft.tableHeaders.subtotal")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!prDraft.suggested_items?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        Belum ada item dengan referensi harga yang dapat dimasukkan ke draft PR.
                      </TableCell>
                    </TableRow>
                  ) : (
                    prDraft.suggested_items.map((item: any, idx: number) => {
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
                        .slice(0, 5);

                      return (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {item.name}
                              </Typography>
                              <StatusBadgeInner status={status} t={t} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4 }}>
                              {item.detailed_specs || item.reason || "—"}
                            </Typography>
                            {item.price_note && (
                              <Typography variant="caption" sx={{ color: "info.main", fontStyle: "italic", display: "block", mt: 0.25 }}>
                                {item.price_note}
                              </Typography>
                            )}
                            {webSources.length > 0 && (
                              <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                                {webSources.map((source: any, sIdx: number) => (
                                  <MuiLink
                                    key={sIdx}
                                    href={source.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{ fontSize: 11, display: "flex", justifyContent: "space-between" }}
                                  >
                                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                      {source.title || source.source}
                                    </span>
                                    {source.price > 0 && <strong>{formatRupiah(source.price)}</strong>}
                                  </MuiLink>
                                ))}
                              </Stack>
                            )}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {brand ? (
                              <Chip size="small" icon={<Tag size={10} />} label={brand} variant="outlined" sx={{ fontSize: 11 }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>

                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                              <TextField
                                type="text"
                                inputMode="numeric"
                                size="small"
                                placeholder="1"
                                value={item.qty === "" || item.qty === 0 ? "" : item.qty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "");
                                  onUpdateItemQty(idx, raw === "" ? "" : Number(raw));
                                }}
                                onBlur={() => {
                                  if (item.qty === "" || Number(item.qty) <= 0) {
                                    onUpdateItemQty(idx, 1);
                                  }
                                }}
                                slotProps={{
                                  htmlInput: {
                                    style: { textAlign: "center", width: 54, padding: "4px 6px" },
                                  },
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {item.uom || t("agentic.itemGenericUom")}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {price > 0 ? (
                              formatRupiah(price)
                            ) : (
                              <Typography variant="caption" color="warning.main" sx={{ fontStyle: "italic" }}>
                                {t("agentic.prDraft.statusBadge.rfqRequired")}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                            {price > 0 ? (
                              formatRupiah(subtotal)
                            ) : (
                              <Typography variant="caption" color="warning.main">
                                {t("agentic.prDraft.statusBadge.rfqRequired")}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                <TableFooter sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, fontSize: 13 }}>
                      {t("agentic.prDraft.totalBudget")}:
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 900, fontSize: 14, color: "primary.main" }}>
                      {totalBudget > 0 ? formatRupiah(totalBudget) : t("agentic.prDraft.needVendorOffer")}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Grid>

      {/* ── Right Column: Configuration & Actions ── */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={2.5}>
          {/* Department Card */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <Building size={14} color="#ef7d00" />
                {t("agentic.prDraft.configDeptTitle")}
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel id="pr-dept-label">Departemen</InputLabel>
                <Select
                  labelId="pr-dept-label"
                  label="Departemen"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Tender Duration */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <Calendar size={14} color="#ef7d00" />
                {t("agentic.prDraft.tenderDurationLabel")}
              </Typography>

              <Grid container spacing={1}>
                {TENDER_DAYS.map((d) => (
                  <Grid size={{ xs: 3 }} key={d}>
                    <Button
                      fullWidth
                      variant={tenderDays === d ? "contained" : "outlined"}
                      color={tenderDays === d ? "primary" : "inherit"}
                      onClick={() => setTenderDays(d)}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, py: 0.75 }}
                    >
                      {t("agentic.prDraft.tenderDayShorthand", { days: d })}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="caption" color="text.secondary">
                {t("agentic.prDraft.tenderActiveDuration")} · <strong>{tenderDays} {t("agentic.prDraft.tenderDayUnit")}</strong>
              </Typography>
            </Stack>
          </Paper>

          {/* Attachments */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <Upload size={14} color="#ef7d00" />
                {t("agentic.prDraft.attachmentsLabel")}
              </Typography>

              <Box
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
                sx={{
                  border: "2px dashed",
                  borderColor: isDragging ? "primary.main" : "divider",
                  borderRadius: 2.5,
                  p: 2.5,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: isDragging ? (theme) => `${theme.palette.primary.main}0D` : "action.hover",
                  transition: "all 0.2s ease",
                }}
              >
                <Upload size={20} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                  {t("agentic.prDraft.attachmentsHint")}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", color: "text.disabled", mt: 0.5, fontSize: 10 }}>
                  {t("agentic.prDraft.maxFilesNote", { current: attachments.length })}
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </Box>

              {attachments.length > 0 && (
                <Stack spacing={1}>
                  {attachments.map((f, i) => (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                        <FileText size={14} color="#ef7d00" />
                        <Typography variant="caption" noWrap sx={{ fontWeight: 600 }}>{f.name}</Typography>
                      </Stack>
                      <IconButton size="small" onClick={() => removeFile(i)}>
                        <X size={12} />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Financial Summary & Action */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={2}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}>
                <DollarSign size={14} color="#10b981" />
                {t("agentic.prDraft.grandTotal")}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: "rgba(16, 185, 129, 0.08)",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                }}
              >
                <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700, display: "block" }}>
                  {t("agentic.prDraft.totalBudget")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: "monospace", color: "success.main", mt: 0.25 }}>
                  {totalBudget > 0 ? formatRupiah(totalBudget) : t("agentic.prDraft.needVendorOffer")}
                </Typography>
              </Paper>

              {wmsInstalled && (
                <FormControl fullWidth size="small">
                  <InputLabel id="pr-warehouse-label">Gudang Penerimaan</InputLabel>
                  <Select
                    labelId="pr-warehouse-label"
                    label="Gudang Penerimaan"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                  >
                    <MenuItem value="">Tanpa Gudang WMS</MenuItem>
                    {warehouses
                      .filter((w) => w.status === "active")
                      .map((w) => (
                        <MenuItem key={w.id} value={w.id}>{w.name} · {w.code}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => onCreatePr({ department, tenderDays, attachments, warehouseId })}
                disabled={isCreatingPr || !(prDraft.suggested_items?.length > 0)}
                startIcon={
                  isCreatingPr ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />
                }
                sx={{
                  borderRadius: 2.5,
                  py: 1.5,
                  fontWeight: 800,
                  textTransform: "none",
                  fontSize: 14,
                  boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`,
                }}
              >
                {isCreatingPr ? t("agentic.tabs.saving") : t("agentic.prDraft.actions.createNow")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );
}
