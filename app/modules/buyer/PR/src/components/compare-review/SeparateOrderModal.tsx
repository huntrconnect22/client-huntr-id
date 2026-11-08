import React, { useState, useMemo, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import {
  X,
  Split,
  Layers,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingDown,
  Building2,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiPost } from "~/lib/api";

interface SeparateOrderModalProps {
  rfq: any;
  rankings: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buyerUserId: string;
}

export const SeparateOrderModal: React.FC<SeparateOrderModalProps> = ({
  rfq,
  rankings = [],
  isOpen,
  onClose,
  onSuccess,
  buyerUserId,
}) => {
  const items: any[] = useMemo(() => rfq?.items || [], [rfq]);

  // List of valid proposals from rankings or rfq
  const allProposals: any[] = useMemo(() => {
    if (rankings.length > 0) {
      return rankings
        .map((r: any) => ({
          ...r.proposal,
          company: r.proposal?.company || { name: r.vendor },
          rank: r.rank,
          items: r.proposal?.items || [],
        }))
        .filter((p) => p && p.id);
    }
    return (rfq?.proposals || []).filter(Boolean);
  }, [rankings, rfq]);

  // Map: rfq_item_id -> selected proposal_id (or "none")
  const [itemVendorMap, setItemVendorMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize: default all items to Rank #1 vendor (if available)
  useEffect(() => {
    if (isOpen && items.length > 0 && allProposals.length > 0) {
      const initialMap: Record<string, string> = {};
      const defaultProposalId = String(allProposals[0]?.id || "");

      items.forEach((item) => {
        // Find if rank 1 proposal offers this item
        const p1Offer = allProposals[0]?.items?.find(
          (pi: any) => String(pi.rfq_item_id) === String(item.id)
        );
        if (p1Offer || allProposals[0]?.price_offer) {
          initialMap[String(item.id)] = defaultProposalId;
        } else {
          // Find any proposal that offers this item
          const anyProposal = allProposals.find((p) =>
            p.items?.some((pi: any) => String(pi.rfq_item_id) === String(item.id))
          );
          initialMap[String(item.id)] = anyProposal ? String(anyProposal.id) : "none";
        }
      });
      setItemVendorMap(initialMap);
    }
  }, [isOpen, items, allProposals]);

  // Helper to get unit price for a given proposal and item
  const getOfferPrice = (proposalId: string, itemId: string, itemQty: number): number => {
    if (!proposalId || proposalId === "none") return 0;
    const proposal = allProposals.find((p) => String(p.id) === String(proposalId));
    if (!proposal) return 0;

    const itemOffer = proposal.items?.find(
      (pi: any) => String(pi.rfq_item_id) === String(itemId)
    );
    if (itemOffer && itemOffer.price_offer !== undefined) {
      return Number(itemOffer.price_offer);
    }
    if (proposal.price_offer) {
      return Number(proposal.price_offer) / (items.length || 1) / (itemQty || 1);
    }
    return 0;
  };

  // Quick Action: Assign all items to Rank #1
  const handleAssignRank1 = () => {
    if (allProposals.length === 0) return;
    const topId = String(allProposals[0].id);
    const newMap: Record<string, string> = {};
    items.forEach((item) => {
      newMap[String(item.id)] = topId;
    });
    setItemVendorMap(newMap);
  };

  // Quick Action: Pick lowest price vendor per item (Smart Auto-Split)
  const handleAssignLowestPrice = () => {
    const newMap: Record<string, string> = {};
    items.forEach((item) => {
      let lowestPrice = Infinity;
      let bestProposalId = "none";

      allProposals.forEach((p) => {
        const price = getOfferPrice(String(p.id), String(item.id), Number(item.qty || 1));
        if (price > 0 && price < lowestPrice) {
          lowestPrice = price;
          bestProposalId = String(p.id);
        }
      });

      newMap[String(item.id)] = bestProposalId;
    });
    setItemVendorMap(newMap);
  };

  // Quick Action: Clear all
  const handleClearAll = () => {
    const newMap: Record<string, string> = {};
    items.forEach((item) => {
      newMap[String(item.id)] = "none";
    });
    setItemVendorMap(newMap);
  };

  // Group items by selected proposal
  const groupedOrders = useMemo(() => {
    const groups: Record<
      string,
      {
        proposal: any;
        items: Array<{ item: any; unitPrice: number; lineTotal: number }>;
        subtotal: number;
        vat: number;
        grandTotal: number;
      }
    > = {};

    Object.entries(itemVendorMap).forEach(([itemId, proposalId]) => {
      if (!proposalId || proposalId === "none") return;
      const item = items.find((i) => String(i.id) === String(itemId));
      if (!item) return;

      const proposal = allProposals.find((p) => String(p.id) === String(proposalId));
      if (!proposal) return;

      if (!groups[proposalId]) {
        groups[proposalId] = {
          proposal,
          items: [],
          subtotal: 0,
          vat: 0,
          grandTotal: 0,
        };
      }

      const qty = Number(item.qty || 1);
      const unitPrice = getOfferPrice(proposalId, itemId, qty);
      const lineTotal = unitPrice * qty;

      groups[proposalId].items.push({ item, unitPrice, lineTotal });
      groups[proposalId].subtotal += lineTotal;
    });

    // Calculate taxes and grand total for each group
    Object.values(groups).forEach((g) => {
      g.vat = g.subtotal * 0.11;
      g.grandTotal = g.subtotal + g.vat;
    });

    return groups;
  }, [itemVendorMap, items, allProposals]);

  const activeOrdersCount = Object.keys(groupedOrders).length;
  const totalAssignedItems = Object.values(groupedOrders).reduce(
    (sum, g) => sum + g.items.length,
    0
  );
  const totalSeparateAmount = Object.values(groupedOrders).reduce(
    (sum, g) => sum + g.grandTotal,
    0
  );

  // Open confirmation dialog directly in front
  const handleConfirmSeparateOrder = () => {
    if (activeOrdersCount === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Item Terlebih Dahulu",
        text: "Silakan tentukan minimal 1 barang untuk diterbitkan Purchase Order.",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  // Execute publication of separate orders
  const handleExecutePublish = async () => {
    setIsSubmitting(true);
    try {
      // Build awards payload
      const awards = Object.entries(groupedOrders).map(([proposalId, group]) => ({
        proposal_id: proposalId,
        item_ids: group.items.map((gi) => String(gi.item.id)),
      }));

      await apiPost(`/api/rfqs/${rfq.id}/award-winners`, {
        awards,
        award_mode: "separate_order",
        generate_po: true,
        user_id: buyerUserId,
      });

      setShowConfirmDialog(false);
      onClose();
      onSuccess();

      Swal.fire({
        icon: "success",
        title: "Separate Order Berhasil!",
        text: `${activeOrdersCount} Purchase Order telah berhasil dibuat dan diterbitkan untuk masing-masing vendor.`,
        confirmButtonColor: "#ef7d00",
      });
    } catch (err: any) {
      console.error("Failed to execute separate order", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menerbitkan Separate Order",
        text: err.message || "Terjadi kesalahan saat memproses order terpisah.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          borderBottom: "1px solid var(--ui-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "var(--ui-bg-subtle)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "rgba(239, 125, 0, 0.12)",
              color: "#ef7d00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Split size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.1rem", lineHeight: 1.2 }}>
              Separate Order / Pisah Purchase Order per Item
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--ui-text-muted)", fontSize: "0.8rem" }}>
              Tentukan vendor pemenang untuk masing-masing barang yang diminta.
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ borderRadius: 2 }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {/* Quick Automation Presets */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Sparkles size={18} color="#ef7d00" />
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              Pilihan Cepat (Smart Assignment):
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAssignLowestPrice}
              startIcon={<TrendingDown size={14} />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                fontSize: "0.75rem",
                borderColor: "#16a34a",
                color: "#16a34a",
                "&:hover": { bgcolor: "rgba(22, 163, 74, 0.08)", borderColor: "#15803d" },
              }}
            >
              Pilih Harga Termurah per Item
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handleAssignRank1}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                fontSize: "0.75rem",
                borderColor: "var(--ui-border)",
                color: "var(--ui-text-primary)",
              }}
            >
              Semua ke Vendor #1 ({allProposals[0]?.company?.name || "Rank 1"})
            </Button>

            <Button
              variant="text"
              size="small"
              onClick={handleClearAll}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                fontSize: "0.75rem",
                color: "var(--ui-text-muted)",
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>

        {/* Item Selection Table */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}
        >
          <Table size="small">
            <TableHead sx={{ bgcolor: "var(--ui-bg-subtle)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, width: 45, textAlign: "center" }}>No</TableCell>
                <TableCell sx={{ fontWeight: 900, minWidth: 200 }}>Barang / Jasa</TableCell>
                <TableCell sx={{ fontWeight: 900, width: 90, textAlign: "center" }}>Qty</TableCell>
                <TableCell sx={{ fontWeight: 900, width: 130, textAlign: "right" }}>
                  Target Price
                </TableCell>
                <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>
                  Pilih Vendor untuk PO Ini
                </TableCell>
                <TableCell sx={{ fontWeight: 900, width: 140, textAlign: "right" }}>
                  Subtotal PO
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, idx) => {
                const itemId = String(item.id);
                const selectedProposalId = itemVendorMap[itemId] || "none";
                const qty = Number(item.qty || 1);
                const uom = item.uom || item.catalogue?.uom || "Pcs";
                const unitPrice = getOfferPrice(selectedProposalId, itemId, qty);
                const lineTotal = unitPrice * qty;
                const targetPrice = Number(item.last_price ?? (item.estimated_price ?? 0));

                return (
                  <TableRow
                    key={itemId}
                    hover
                    sx={{
                      bgcolor:
                        selectedProposalId !== "none"
                          ? "transparent"
                          : "rgba(148, 163, 184, 0.04)",
                    }}
                  >
                    <TableCell sx={{ textAlign: "center", fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "var(--ui-text-primary)" }}>
                        {item.item_name || item.catalogue?.name || `Item #${idx + 1}`}
                      </Typography>
                      {item.specifications && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--ui-text-muted)",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.72rem",
                          }}
                        >
                          {item.specifications}
                        </Typography>
                      )}
                      {item.sku && (
                        <Typography variant="caption" sx={{ color: "#ef7d00", fontWeight: 700, fontSize: "0.7rem" }}>
                          SKU: {item.sku}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ textAlign: "center", fontWeight: 800 }}>
                      {qty} {uom}
                    </TableCell>

                    <TableCell sx={{ textAlign: "right", fontFamily: "monospace", color: "var(--ui-text-muted)" }}>
                      Rp {targetPrice.toLocaleString("id-ID")}
                    </TableCell>

                    {/* Vendor Selector Dropdown */}
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedProposalId}
                          onChange={(e) =>
                            setItemVendorMap((prev) => ({
                              ...prev,
                              [itemId]: e.target.value,
                            }))
                          }
                          sx={{
                            borderRadius: 2,
                            fontSize: "0.825rem",
                            fontWeight: 700,
                            bgcolor:
                              selectedProposalId !== "none"
                                ? "rgba(239, 125, 0, 0.04)"
                                : "var(--ui-bg-input)",
                          }}
                        >
                          <MenuItem value="none" sx={{ color: "var(--ui-text-muted)", fontSize: "0.8rem" }}>
                            <em>— Jangan Terbitkan PO untuk Item Ini —</em>
                          </MenuItem>
                          {allProposals.map((p, pIdx) => {
                            const pPrice = getOfferPrice(String(p.id), itemId, qty);
                            const pSubtotal = pPrice * qty;

                            return (
                              <MenuItem
                                key={p.id}
                                value={String(p.id)}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "0.825rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip
                                    label={`#${p.rank || pIdx + 1}`}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: "0.65rem",
                                      fontWeight: 900,
                                      bgcolor: p.is_winner ? "#22c55e" : "var(--ui-border)",
                                      color: p.is_winner ? "#fff" : "var(--ui-text-primary)",
                                    }}
                                  />
                                  <span>{p.company?.name || `Vendor #${pIdx + 1}`}</span>
                                </Box>
                                <Box sx={{ ml: 2, textAlign: "right" }}>
                                  {pPrice > 0 ? (
                                    <span style={{ color: "#16a34a", fontFamily: "monospace" }}>
                                      Rp {pPrice.toLocaleString("id-ID")}
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--ui-text-muted)" }}>
                                      (Harga Paket)
                                    </span>
                                  )}
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Calculated Line Total */}
                    <TableCell sx={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800 }}>
                      {selectedProposalId !== "none" ? (
                        <span style={{ color: "#166534" }}>Rp {lineTotal.toLocaleString("id-ID")}</span>
                      ) : (
                        <span style={{ color: "var(--ui-text-muted)" }}>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Live Preview: Generated Purchase Orders */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Layers size={18} color="#ef7d00" />
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Pratinjau Purchase Order yang Akan Diterbitkan ({activeOrdersCount} PO):
            </Typography>
          </Box>

          {activeOrdersCount === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                textAlign: "center",
                bgcolor: "var(--ui-bg-subtle)",
                borderStyle: "dashed",
              }}
            >
              <AlertCircle size={24} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
              <Typography variant="body2" sx={{ color: "var(--ui-text-muted)", fontWeight: 700 }}>
                Belum ada barang yang dipilih untuk diterbitkan Purchase Order.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: activeOrdersCount > 1 ? "1fr 1fr" : "1fr" },
                gap: 2,
              }}
            >
              {Object.entries(groupedOrders).map(([proposalId, group], gIdx) => (
                <Paper
                  key={proposalId}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "var(--ui-bg-card)",
                    border: "1.5px solid #86efac",
                    boxShadow: "0 2px 10px rgba(34, 197, 94, 0.06)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          bgcolor: "#dcfce7",
                          color: "#15803d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "0.8rem",
                        }}
                      >
                        #{gIdx + 1}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          {group.proposal.company?.name || "Vendor"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 700 }}>
                          {group.items.length} Barang Ditetapkan
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label="Akan Terbit PO"
                      size="small"
                      sx={{
                        fontWeight: 900,
                        fontSize: "0.65rem",
                        bgcolor: "#dcfce7",
                        color: "#15803d",
                      }}
                    />
                  </Box>

                  {/* Item badges */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                    {group.items.map((gi, idx) => (
                      <Chip
                        key={idx}
                        label={`${gi.item.item_name || gi.item.catalogue?.name || "Item"} (${gi.item.qty} ${gi.item.uom || "Pcs"})`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          bgcolor: "var(--ui-bg-subtle)",
                        }}
                      />
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* Amount Breakdown */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ui-text-muted)" }}>
                    <span>Subtotal:</span>
                    <span style={{ fontFamily: "monospace" }}>Rp {group.subtotal.toLocaleString("id-ID")}</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ui-text-muted)" }}>
                    <span>PPN 11%:</span>
                    <span style={{ fontFamily: "monospace" }}>Rp {group.vat.toLocaleString("id-ID")}</span>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 900, color: "#166534", mt: 0.5 }}>
                    <span>Total Nilai PO:</span>
                    <span style={{ fontFamily: "monospace" }}>Rp {group.grandTotal.toLocaleString("id-ID")}</span>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions
        sx={{
          p: 2.5,
          borderTop: "1px solid var(--ui-border)",
          bgcolor: "var(--ui-bg-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: "var(--ui-text-muted)", fontSize: "0.825rem" }}>
            Total Barang Tercover: <strong>{totalAssignedItems} / {items.length}</strong>
          </Typography>
          {activeOrdersCount > 0 && (
            <Chip
              label={`Total Gabungan: Rp ${totalSeparateAmount.toLocaleString("id-ID")}`}
              size="small"
              sx={{ fontWeight: 800, bgcolor: "rgba(239, 125, 0, 0.12)", color: "#ef7d00" }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: "none",
              color: "var(--ui-text-muted)",
            }}
          >
            Batal
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmSeparateOrder}
            disabled={isSubmitting || activeOrdersCount === 0}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircle2 size={16} />
              )
            }
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: "none",
              px: 3,
              py: 1,
              background: "linear-gradient(135deg, #ef7d00 0%, #d96d00 100%)",
              boxShadow: "0 4px 14px rgba(239, 125, 0, 0.25)",
              "&:hover": { background: "#d96d00" },
            }}
          >
            {isSubmitting
              ? "Menerbitkan PO..."
              : `Terbitkan ${activeOrdersCount} Separate Order`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>

    {/* Confirmation Dialog (Rendered with zIndex: 1400 so it appears directly in front) */}
    <Dialog
        open={showConfirmDialog}
        onClose={() => !isSubmitting && setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1400 }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              borderRadius: 3.5,
              p: 1,
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.25)",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "rgba(239, 125, 0, 0.12)",
                color: "#ef7d00",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Split size={22} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Konfirmasi Penerbitan Separate Order
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tender: {rfq?.title || "RFQ"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sistem akan menerbitkan <strong>{activeOrdersCount} Purchase Order (PO)</strong> terpisah sesuai alokasi item yang telah dipilih:
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 2.5 }}>
            {Object.entries(groupedOrders).map(([pId, g]) => (
              <Paper
                key={pId}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  borderColor: "divider",
                  bgcolor: "action.hover",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Building2 size={16} style={{ color: "#ef7d00" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {g.proposal.company?.name || "Vendor"}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${g.items.length} item`}
                    size="small"
                    sx={{ fontWeight: 700, height: 22, fontSize: "0.7rem", bgcolor: "#ef7d00", color: "#fff" }}
                  />
                </Box>

                <Box sx={{ pl: 3, mb: 1.5 }}>
                  {g.items.map((gi) => (
                    <Typography key={gi.item.id} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      &bull; {gi.item.item_name || gi.item.name} ({gi.item.qty}x @ Rp {Number(gi.unitPrice).toLocaleString("id-ID")})
                    </Typography>
                  ))}
                </Box>

                <Divider sx={{ my: 1, borderColor: "divider" }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Order (Termasuk PPN 11%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#ef7d00" }}>
                    Rp {g.grandTotal.toLocaleString("id-ID")}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderColor: "rgba(239, 125, 0, 0.3)",
              bgcolor: "rgba(239, 125, 0, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <AlertCircle size={18} style={{ color: "#ef7d00", flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              Setiap vendor hanya akan menerima PO untuk item-item yang dialokasikan di atas. Status tender akan berubah menjadi <strong>Awarded (Separate Order)</strong>.
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setShowConfirmDialog(false)}
            disabled={isSubmitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "divider",
              color: "text.secondary",
            }}
          >
            Periksa Kembali
          </Button>

          <Button
            variant="contained"
            onClick={handleExecutePublish}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircle2 size={16} />
              )
            }
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              bgcolor: "#ef7d00",
              "&:hover": { bgcolor: "#d66f00" },
              boxShadow: "0 4px 12px rgba(239, 125, 0, 0.3)",
              px: 3,
            }}
          >
            {isSubmitting ? "Menerbitkan PO..." : "Ya, Terbitkan PO Sekarang"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
