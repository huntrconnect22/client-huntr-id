import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import {
  Printer,
  History,
  Target,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Award,
  Split,
} from "lucide-react";
import { printComparisonForm } from "../../utils/printComparisonForm";

interface ComparisonMatrixTableProps {
  request: any;
  rankings: any[];
  awardedProposal: any;
  overallAnalysis?: string;
  companyName?: string;
  onOpenSeparateOrder?: () => void;
}

export const ComparisonMatrixTable: React.FC<ComparisonMatrixTableProps> = ({
  request,
  rankings = [],
  awardedProposal,
  overallAnalysis = "",
  companyName,
  onOpenSeparateOrder,
}) => {
  const items: any[] = request?.items || [];

  // Extract proposals from rankings or request
  const allProposals: any[] = (rankings.length > 0
    ? rankings.map((r: any) => ({
        ...r.proposal,
        company: r.proposal?.company || { name: r.vendor },
        rank: r.rank,
        is_winner: r.is_winner,
        items: r.proposal?.items || [],
      }))
    : request?.proposals || []
  ).filter(Boolean);

  const awarded =
    awardedProposal?.proposal ||
    awardedProposal ||
    allProposals.find(
      (p: any) =>
        p?.is_winner ||
        p?.winner_status === "awarded" ||
        p?.winner_status === "approved"
    ) ||
    allProposals[0] ||
    null;

  const awardedVendorName = awarded?.company?.name || awarded?.vendor || "—";

  // Calculations
  let totalLastPrice = 0;
  let totalAwardedPrice = 0;
  const vendorTotals: { [vendorId: string]: number } = {};

  allProposals.forEach((p) => {
    vendorTotals[p.id] = 0;
  });

  const vatRate = 0.11;

  const handlePrint = () => {
    printComparisonForm({
      request,
      rankings,
      awardedProposal,
      overallAnalysis,
      companyName,
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid var(--ui-border)",
        background: "var(--ui-bg-card)",
      }}
    >
      {/* Top Header Card */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid var(--ui-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          background: "linear-gradient(180deg, var(--ui-bg-card) 0%, var(--ui-bg-subtle) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              background: "rgba(239, 125, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef7d00",
            }}
          >
            <FileSpreadsheet size={22} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                fontSize: "1.1rem",
                color: "var(--ui-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Comparison Form (比较表)
              <Chip
                label="Per-Item Matrix"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(239, 125, 0, 0.12)",
                  color: "#ef7d00",
                }}
              />
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--ui-text-muted)", fontSize: "0.825rem" }}>
              Breakdown komparasi harga per item antar vendor lengkap dengan kolom Last Purchase Price &amp; Deviasi.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {onOpenSeparateOrder && (
            <Button
              variant="outlined"
              onClick={onOpenSeparateOrder}
              startIcon={<Split size={16} />}
              sx={{
                borderColor: "#ef7d00",
                color: "#ef7d00",
                fontWeight: 800,
                textTransform: "none",
                borderRadius: 2.5,
                px: 2,
                py: 1,
                "&:hover": {
                  borderColor: "#d96d00",
                  bgcolor: "rgba(239, 125, 0, 0.08)",
                },
              }}
            >
              Separate Order (Pisah PO)
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handlePrint}
            startIcon={<Printer size={16} />}
            sx={{
              background: "linear-gradient(135deg, #ef7d00 0%, #d96d00 100%)",
              color: "#ffffff",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              boxShadow: "0 4px 14px rgba(239, 125, 0, 0.25)",
              "&:hover": {
                background: "#d96d00",
              },
            }}
          >
            Print / Export PDF Form
          </Button>
        </Box>
      </Box>

      {/* Main Table */}
      <TableContainer sx={{ maxHeight: 650, overflowX: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: 900, borderCollapse: "separate" }}>
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "var(--ui-bg-subtle)",
                  width: 44,
                  textAlign: "center",
                  borderBottom: "2px solid var(--ui-border)",
                }}
              >
                No.
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "var(--ui-bg-subtle)",
                  minWidth: 200,
                  borderBottom: "2px solid var(--ui-border)",
                }}
              >
                Item Description
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "var(--ui-bg-subtle)",
                  width: 60,
                  textAlign: "center",
                  borderBottom: "2px solid var(--ui-border)",
                }}
              >
                Qty
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "var(--ui-bg-subtle)",
                  width: 65,
                  textAlign: "center",
                  borderBottom: "2px solid var(--ui-border)",
                }}
              >
                UoM
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "var(--ui-bg-subtle)",
                  width: 130,
                  textAlign: "right",
                  borderBottom: "2px solid var(--ui-border)",
                  borderRight: "1px solid var(--ui-border)",
                }}
              >
                Last Price / 最后价格
              </TableCell>

              {/* Awarded Vendor Header */}
              <TableCell
                colSpan={4}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  bgcolor: "rgba(34, 197, 94, 0.08)",
                  color: "#15803d",
                  textAlign: "center",
                  borderBottom: "1px solid #86efac",
                  borderRight: "2px solid var(--ui-border)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                  <Award size={14} />
                  Awarded &amp; Negotiation Result (供应商中标及谈判结果)
                </Box>
              </TableCell>

              {/* Bidding Vendors Headers */}
              {allProposals.map((p, idx) => (
                <TableCell
                  key={p.id || idx}
                  colSpan={2}
                  sx={{
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    bgcolor: "var(--ui-bg-subtle)",
                    textAlign: "center",
                    borderBottom: "1px solid var(--ui-border)",
                    borderRight: idx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                    <Chip
                      label={`#${p.rank || idx + 1}`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        bgcolor: p.is_winner ? "#22c55e" : "var(--ui-border)",
                        color: p.is_winner ? "#fff" : "var(--ui-text-primary)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {p.company?.name || p.vendor || `Vendor #${idx + 1}`}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>

            {/* Sub-header row */}
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(34, 197, 94, 0.05)",
                  color: "#166534",
                  textAlign: "right",
                  borderBottom: "2px solid var(--ui-border)",
                  width: 95,
                }}
              >
                Unit Price
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(34, 197, 94, 0.05)",
                  color: "#166534",
                  textAlign: "right",
                  borderBottom: "2px solid var(--ui-border)",
                  width: 105,
                }}
              >
                Total Price
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(34, 197, 94, 0.05)",
                  color: "#166534",
                  textAlign: "center",
                  borderBottom: "2px solid var(--ui-border)",
                  width: 110,
                }}
              >
                Vendor
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  bgcolor: "rgba(34, 197, 94, 0.05)",
                  color: "#166534",
                  textAlign: "right",
                  borderBottom: "2px solid var(--ui-border)",
                  borderRight: "2px solid var(--ui-border)",
                  width: 75,
                }}
              >
                Deviation
              </TableCell>

              {allProposals.map((p, idx) => (
                <React.Fragment key={`sub-${p.id || idx}`}>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      bgcolor: "var(--ui-bg-subtle)",
                      textAlign: "right",
                      borderBottom: "2px solid var(--ui-border)",
                      width: 95,
                    }}
                  >
                    Unit / 单价
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      bgcolor: "var(--ui-bg-subtle)",
                      textAlign: "right",
                      borderBottom: "2px solid var(--ui-border)",
                      borderRight: idx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                      width: 105,
                    }}
                  >
                    Total / 总价
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item, idx) => {
              const qty = Number(item.qty || 1);
              const uom = item.uom || item.catalogue?.uom || "Pcs";
              const itemName = item.item_name || item.catalogue?.name || `Item #${idx + 1}`;
              const specs = item.specifications || item.catalogue?.specifications || item.service_scope || "";

              // Last price resolution: 1. historical, 2. estimated_price, 3. 0
              const lastPrice = Number(item.last_price ?? (item.estimated_price ?? 0));
              const lastPriceSource = item.last_price_source || (item.last_price ? "historical" : item.estimated_price ? "target_price" : "none");
              totalLastPrice += lastPrice * qty;

              // Awarded item offer
              const awardedItemOffer = awarded?.items?.find(
                (pi: any) => String(pi.rfq_item_id) === String(item.id)
              );
              const awardedUnitPrice = awardedItemOffer
                ? Number(awardedItemOffer.price_offer || 0)
                : (awarded?.price_offer ? Number(awarded.price_offer) / (items.length || 1) / qty : 0);
              const awardedTotalPrice = awardedUnitPrice * qty;
              totalAwardedPrice += awardedTotalPrice;

              let deviation = 0;
              if (lastPrice > 0) {
                deviation = ((awardedUnitPrice - lastPrice) / lastPrice) * 100;
              }

              return (
                <TableRow key={item.id || idx} hover sx={{ "&:last-child td": { borderBottom: "1px solid var(--ui-border)" } }}>
                  <TableCell sx={{ textAlign: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.825rem", color: "var(--ui-text-primary)" }}>
                      {itemName}
                    </Typography>
                    {specs && (
                      <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", display: "block", fontSize: "0.725rem" }}>
                        {specs}
                      </Typography>
                    )}
                    {item.sku && (
                      <Typography variant="caption" sx={{ color: "#ef7d00", fontWeight: 700, fontSize: "0.7rem" }}>
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: 800, fontSize: "0.8rem" }}>
                    {qty}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", fontSize: "0.75rem", color: "var(--ui-text-muted)" }}>
                    {uom}
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      borderRight: "1px solid var(--ui-border)",
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.8rem",
                          fontFamily: "monospace",
                          color: lastPrice === 0 ? "var(--ui-text-muted)" : "var(--ui-text-primary)",
                        }}
                      >
                        Rp {lastPrice.toLocaleString("id-ID")}
                      </Typography>
                      {lastPriceSource === "historical" ? (
                        <Tooltip title={`Berdasarkan riwayat pembelian terakhir ${item.last_price_date ? `(${item.last_price_date})` : ""}`} arrow>
                          <Chip
                            icon={<History size={10} />}
                            label="Historical"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              bgcolor: "rgba(34, 197, 94, 0.12)",
                              color: "#166534",
                              mt: 0.25,
                            }}
                          />
                        </Tooltip>
                      ) : lastPriceSource === "target_price" ? (
                        <Tooltip title="Belum pernah beli, diambil dari Target Price PR" arrow>
                          <Chip
                            icon={<Target size={10} />}
                            label="Target PR"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              bgcolor: "rgba(239, 125, 0, 0.12)",
                              color: "#c2410c",
                              mt: 0.25,
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Tidak ada data riwayat harga atau target PR (0)" arrow>
                          <Chip
                            icon={<HelpCircle size={10} />}
                            label="No Prior Data"
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              bgcolor: "var(--ui-border)",
                              color: "var(--ui-text-muted)",
                              mt: 0.25,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Awarded Cells */}
                  <TableCell sx={{ textAlign: "right", bgcolor: "rgba(34, 197, 94, 0.02)" }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#166534", fontFamily: "monospace" }}>
                      Rp {awardedUnitPrice.toLocaleString("id-ID")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", bgcolor: "rgba(34, 197, 94, 0.02)" }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#166534", fontFamily: "monospace" }}>
                      Rp {awardedTotalPrice.toLocaleString("id-ID")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", bgcolor: "rgba(34, 197, 94, 0.02)" }}>
                    <Chip
                      label={awardedVendorName}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        bgcolor: "#dcfce7",
                        color: "#15803d",
                        maxWidth: 110,
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      textAlign: "right",
                      bgcolor: "rgba(34, 197, 94, 0.02)",
                      borderRight: "2px solid var(--ui-border)",
                    }}
                  >
                    {lastPrice > 0 ? (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.25 }}>
                        {deviation < 0 ? (
                          <TrendingDown size={12} color="#16a34a" />
                        ) : deviation > 0 ? (
                          <TrendingUp size={12} color="#dc2626" />
                        ) : null}
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            fontFamily: "monospace",
                            color: deviation < 0 ? "#16a34a" : deviation > 0 ? "#dc2626" : "var(--ui-text-muted)",
                          }}
                        >
                          {deviation > 0 ? `+${deviation.toFixed(2)}%` : `${deviation.toFixed(2)}%`}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: "var(--ui-text-muted)" }}>
                        0.00%
                      </Typography>
                    )}
                  </TableCell>

                  {/* Vendors Quotations */}
                  {allProposals.map((p, pIdx) => {
                    const pItemOffer = p.items?.find(
                      (pi: any) => String(pi.rfq_item_id) === String(item.id)
                    );
                    const unitPrice = pItemOffer
                      ? Number(pItemOffer.price_offer || 0)
                      : (p.price_offer ? Number(p.price_offer) / (items.length || 1) / qty : 0);
                    const lineTotal = unitPrice * qty;
                    vendorTotals[p.id] = (vendorTotals[p.id] || 0) + lineTotal;

                    return (
                      <React.Fragment key={`cell-${p.id || pIdx}-${item.id || idx}`}>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Typography variant="body2" sx={{ fontSize: "0.78rem", fontFamily: "monospace" }}>
                            Rp {unitPrice.toLocaleString("id-ID")}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "right",
                            borderRight: pIdx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.78rem", fontFamily: "monospace" }}>
                            Rp {lineTotal.toLocaleString("id-ID")}
                          </Typography>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              );
            })}

            {/* Total Row */}
            <TableRow sx={{ bgcolor: "var(--ui-bg-subtle)", "& td": { fontWeight: 900 } }}>
              <TableCell colSpan={4} sx={{ textAlign: "right", fontSize: "0.75rem" }}>
                Total / 总计:
              </TableCell>
              <TableCell sx={{ textAlign: "right", borderRight: "1px solid var(--ui-border)", fontFamily: "monospace" }}>
                Rp {totalLastPrice.toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: "right", color: "#166534", fontFamily: "monospace" }}>
                Rp {totalAwardedPrice.toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: "center", borderRight: "2px solid var(--ui-border)" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#15803d" }}>
                  {awardedVendorName}
                </Typography>
              </TableCell>
              {allProposals.map((p, idx) => (
                <TableCell
                  key={`tot-${p.id || idx}`}
                  colSpan={2}
                  sx={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    borderRight: idx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                  }}
                >
                  Rp {(vendorTotals[p.id] || 0).toLocaleString("id-ID")}
                </TableCell>
              ))}
            </TableRow>

            {/* VAT 11% Row */}
            <TableRow sx={{ bgcolor: "var(--ui-bg-card)", "& td": { fontSize: "0.75rem" } }}>
              <TableCell colSpan={4} sx={{ textAlign: "right", fontWeight: 700, color: "var(--ui-text-muted)" }}>
                VAT 11% / PPN:
              </TableCell>
              <TableCell sx={{ textAlign: "right", borderRight: "1px solid var(--ui-border)", fontFamily: "monospace" }}>
                Rp {(totalLastPrice * vatRate).toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: "right", color: "#166534", fontFamily: "monospace" }}>
                Rp {(totalAwardedPrice * vatRate).toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ borderRight: "2px solid var(--ui-border)" }} />
              {allProposals.map((p, idx) => (
                <TableCell
                  key={`vat-${p.id || idx}`}
                  colSpan={2}
                  sx={{
                    textAlign: "right",
                    fontFamily: "monospace",
                    color: "var(--ui-text-muted)",
                    borderRight: idx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                  }}
                >
                  Rp {((vendorTotals[p.id] || 0) * vatRate).toLocaleString("id-ID")}
                </TableCell>
              ))}
            </TableRow>

            {/* Grand Total Row */}
            <TableRow
              sx={{
                bgcolor: "rgba(239, 125, 0, 0.06)",
                borderTop: "2px solid #ef7d00",
                "& td": { fontWeight: 900, py: 1.25 },
              }}
            >
              <TableCell colSpan={4} sx={{ textAlign: "right", fontSize: "0.825rem", color: "#c2410c" }}>
                Grand Total / 最终总额:
              </TableCell>
              <TableCell sx={{ textAlign: "right", borderRight: "1px solid var(--ui-border)", fontFamily: "monospace", fontSize: "0.85rem" }}>
                Rp {(totalLastPrice + totalLastPrice * vatRate).toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: "right", color: "#15803d", fontFamily: "monospace", fontSize: "0.85rem" }}>
                Rp {(totalAwardedPrice + totalAwardedPrice * vatRate).toLocaleString("id-ID")}
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: "center", borderRight: "2px solid var(--ui-border)" }}>
                <Chip label="AWARDED" size="small" sx={{ fontWeight: 900, bgcolor: "#22c55e", color: "#fff", height: 20 }} />
              </TableCell>
              {allProposals.map((p, idx) => {
                const tot = vendorTotals[p.id] || 0;
                return (
                  <TableCell
                    key={`grand-${p.id || idx}`}
                    colSpan={2}
                    sx={{
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      borderRight: idx === allProposals.length - 1 ? "none" : "1px solid var(--ui-border)",
                    }}
                  >
                    Rp {(tot + tot * vatRate).toLocaleString("id-ID")}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Average Deviation */}
            <TableRow sx={{ bgcolor: "var(--ui-bg-subtle)" }}>
              <TableCell colSpan={4} sx={{ textAlign: "right", fontWeight: 800, fontSize: "0.75rem" }}>
                Average Deviation Percentage / 平均偏差百分比:
              </TableCell>
              <TableCell colSpan={5} sx={{ textAlign: "left", pl: 2, borderRight: "2px solid var(--ui-border)" }}>
                {totalLastPrice > 0 ? (
                  <Chip
                    label={`${(((totalAwardedPrice - totalLastPrice) / totalLastPrice) * 100).toFixed(2)}% vs Last Price`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: totalAwardedPrice <= totalLastPrice ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      color: totalAwardedPrice <= totalLastPrice ? "#15803d" : "#b91c1c",
                    }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: "var(--ui-text-muted)" }}>
                    0.00% (No baseline last price)
                  </Typography>
                )}
              </TableCell>
              <TableCell colSpan={allProposals.length * 2} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Terms & Conditions Comparison Footer */}
      <Box sx={{ p: 2.5, bgcolor: "var(--ui-bg-subtle)", borderTop: "1px solid var(--ui-border)" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5, color: "var(--ui-text-primary)" }}>
          Terms &amp; Condition Comparison (条款和条件比较)
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "var(--ui-bg-input)" }}>
                <TableCell sx={{ fontWeight: 800, width: 220 }}>Condition / Syarat</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#15803d", bgcolor: "rgba(34, 197, 94, 0.08)" }}>
                  Awarded ({awardedVendorName})
                </TableCell>
                {allProposals.map((p, idx) => (
                  <TableCell key={`th-term-${p.id || idx}`} sx={{ fontWeight: 800 }}>
                    {p.company?.name || p.vendor || `Vendor #${idx + 1}`}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 700 }}>1. Payment Scheme / 付款方式</TableCell>
                <TableCell sx={{ bgcolor: "rgba(34, 197, 94, 0.02)", fontWeight: 700, color: "#166534" }}>
                  {awarded?.payment_term || "Cash before delivery / TOP 30 Days"}
                </TableCell>
                {allProposals.map((p, idx) => (
                  <TableCell key={`pt-${p.id || idx}`}>{p.payment_term || "—"}</TableCell>
                ))}
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 700 }}>2. Delivery Time / 交货期</TableCell>
                <TableCell sx={{ bgcolor: "rgba(34, 197, 94, 0.02)", fontWeight: 700, color: "#166534" }}>
                  {awarded?.delivery_days ? `${awarded.delivery_days} working days after PO` : "Prompt"}
                </TableCell>
                {allProposals.map((p, idx) => (
                  <TableCell key={`dt-${p.id || idx}`}>
                    {p.delivery_days ? `${p.delivery_days} working days` : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow hover>
                <TableCell sx={{ fontWeight: 700 }}>3. Warranty / 保修期</TableCell>
                <TableCell sx={{ bgcolor: "rgba(34, 197, 94, 0.02)", fontWeight: 700, color: "#166534" }}>
                  {awarded?.warranty_months ? `${awarded.warranty_months} Months` : "Standard Warranty"}
                </TableCell>
                {allProposals.map((p, idx) => (
                  <TableCell key={`w-${p.id || idx}`}>
                    {p.warranty_months ? `${p.warranty_months} Months` : "—"}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

