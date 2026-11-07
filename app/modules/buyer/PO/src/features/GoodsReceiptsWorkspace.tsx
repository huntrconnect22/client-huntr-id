import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import {
  Package,
  Calendar,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  Truck,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import Layout from "~/components/Layout";
import { createReceipt, getOrders } from "~/lib/api";

export default function Receipts() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionData, setInspectionData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedPo) {
      const initial: Record<string, any> = {};
      selectedPo.items?.forEach((item: any) => {
        initial[item.id] = {
          po_item_id: item.id,
          inventory_name: item.inventory_name,
          ordered_qty: Number(item.qty),
          received_qty: Number(item.qty),
          rejected_qty: 0,
          condition: "Good",
          rejection_reason: "",
        };
      });
      setInspectionData(initial);
    } else {
      setInspectionData({});
    }
  }, [selectedPo]);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) setCompany(JSON.parse(activeComp));
  }, []);

  useEffect(() => {
    if (company) fetchOrders();
  }, [company]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrders(company.id, 1, 100, "", "operational");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const isBuyer = company?.type === "buyer";

  const pendingReceipts = isBuyer
    ? orders.filter(
        (po) =>
          po.status !== "completed" &&
          po.delivery_orders?.some(
            (d: any) => d.status === "shipped" || d.status === "delivered",
          ),
      )
    : [];

  const isGrAllowed = (expectedDate: string | null) => {
    if (import.meta.env.VITE_DEBUG_GR_DATE === "true") return true;
    if (!expectedDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expectedDate);
    exp.setHours(0, 0, 0, 0);
    return today >= exp;
  };

  const handleConfirm = async () => {
    if (!selectedPo || !company) return;
    setError(null);

    // Validate: rejection reason required for any rejected items
    const itemsInspectionArray = Object.values(inspectionData);
    const missingReason = itemsInspectionArray.find(
      (item: any) =>
        (item.rejected_qty ?? 0) > 0 && !(item.rejection_reason ?? "").trim(),
    );
    if (missingReason) {
      setError(
        `Please provide a rejection reason for "${(missingReason as any).inventory_name}" before confirming.`,
      );
      return;
    }

    setConfirming(true);
    try {
      const totalReceived = itemsInspectionArray.reduce(
        (sum: number, item: any) => sum + item.received_qty,
        0,
      );

      const data = await createReceipt({
        po_id: selectedPo.id,
        company_id: company.id,
        received_qty: totalReceived > 0 ? totalReceived : 1,
        handover_document_path: "system/auto",
        items_inspection: itemsInspectionArray,
      });
      setConfirmed(data.receipt);
      fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedPo) {
    const do_ = selectedPo.delivery_orders?.[0];
    const allowed = isGrAllowed(selectedPo.expected_receiving_date);

    return (
      <Layout
        title="Konfirmasi Penerimaan Barang"
        subtitle={`PO ${selectedPo.po_number} · ${selectedPo.vendor_name}`}
      >
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Back */}
          <Box>
            <Button
              onClick={() => {
                setSelectedPo(null);
                setConfirmed(null);
                setError(null);
              }}
              startIcon={<ArrowLeft size={18} />}
              sx={{ color: "text.secondary", fontWeight: 600, textTransform: "none", p: 0 }}
            >
              Back to list
            </Button>
          </Box>

          {/* Success state */}
          {confirmed ? (
            <Paper
              variant="outlined"
              sx={{
                bgcolor: "success.50",
                borderColor: "success.light",
                borderRadius: 4,
                p: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2.5,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: 3,
                }}
              >
                <CheckCircle2 size={36} color="#fff" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  Goods Received Successfully!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                  Vendor has been notified. They will issue the final invoice shortly.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/orders")}
                sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: "none" }}
              >
                View All Orders
              </Button>
            </Paper>
          ) : (
            <>
              {/* Delivery Info */}
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 2.5,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "info.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Truck size={22} className="text-blue-500" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Delivery Information
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {selectedPo.vendor_name}
                  </Typography>
                  {do_?.tracking_number && (
                    <Typography variant="body2" sx={{ color: "info.main", fontWeight: 600, mt: 0.25 }}>
                      Tracking: {do_.tracking_number}
                    </Typography>
                  )}
                </Box>
                {selectedPo.expected_receiving_date && (
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                      Est. Arrival
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: allowed ? "text.primary" : "error.main", fontWeight: 700, mt: 0.5 }}>
                      <Calendar size={14} /> {selectedPo.expected_receiving_date}
                    </Box>
                  </Box>
                )}
              </Paper>

              {/* Date restriction warning */}
              {!allowed && (
                <Alert severity="warning">
                  Goods cannot be received yet. Expected arrival date is <strong>{selectedPo.expected_receiving_date}</strong>.
                </Alert>
              )}

              {/* Items to receive */}
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                  }}
                >
                  <ShoppingBag size={18} className="text-amber-500" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Received Items
                  </Typography>
                  <Typography variant="caption" sx={{ ml: "auto", color: "text.secondary", fontWeight: 600 }}>
                    {selectedPo.items?.length || 0} item
                  </Typography>
                </Box>
                <Box>
                  {selectedPo.items?.map((item: any, idx: number) => {
                    const idata = inspectionData[item.id] || {};
                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 2.5,
                          borderBottom:
                            idx < selectedPo.items.length - 1 ? 1 : 0,
                          borderColor: "divider",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: "warning.50",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Package size={18} className="text-orange-500" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {item.inventory_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", mt: 0.25, display: "block" }}>
                              {item.inventory_code}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: "warning.main", lineHeight: 1 }}>
                              {item.qty}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {item.uom}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Inspection Form for this item */}
                        {allowed && (
                          <Paper
                            variant="outlined"
                            sx={{
                              mt: 2,
                              p: 2,
                              borderRadius: 2,
                              borderStyle: "dashed",
                              bgcolor: "action.hover",
                            }}
                          >
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Accepted Qty"
                                  type="number"
                                  slotProps={{
                                    htmlInput: { min: 0, max: item.qty },
                                  }}
                                  value={idata.received_qty ?? item.qty}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        received_qty: val,
                                        rejected_qty: Number(item.qty) - val,
                                      },
                                    }));
                                  }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label="Rejected Qty"
                                  type="number"
                                  slotProps={{
                                    htmlInput: { min: 0, max: item.qty },
                                  }}
                                  value={idata.rejected_qty ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        rejected_qty: val,
                                        received_qty: Number(item.qty) - val,
                                      },
                                    }));
                                  }}
                                />
                              </Grid>
                            </Grid>

                            <TextField
                              fullWidth
                              size="small"
                              label="Condition / Notes"
                              placeholder="E.g., Good, Box damaged, Missing parts"
                              value={idata.condition ?? "Good"}
                              onChange={(e) => {
                                setInspectionData((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    condition: e.target.value,
                                  },
                                }));
                              }}
                            />

                            {/* Rejection reason — appears only when there are rejected items */}
                            {(idata.rejected_qty ?? 0) > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  multiline
                                  rows={2}
                                  error
                                  label="Rejection Reason *"
                                  placeholder="Explain why these items are being rejected (e.g., wrong spec, damaged, expired)"
                                  value={idata.rejection_reason ?? ""}
                                  onChange={(e) => {
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...prev[item.id],
                                        rejection_reason: e.target.value,
                                      },
                                    }));
                                  }}
                                  helperText={`${idata.rejected_qty} unit will be sent to Return — reason required.`}
                                />
                              </Box>
                            )}
                          </Paper>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Error */}
              {error && <Alert severity="error">{error}</Alert>}

              {/* Confirm button */}
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirm}
                disabled={!allowed || confirming}
                fullWidth
                size="large"
                startIcon={
                  confirming ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircle2 size={20} />
                  )
                }
                sx={{
                  py: 1.75,
                  borderRadius: 3,
                  fontWeight: 900,
                  fontSize: "1.05rem",
                  textTransform: "none",
                }}
              >
                {confirming ? "Processing…" : "Confirm Goods Received"}
              </Button>
              <Typography
                variant="caption"
                sx={{ textAlign: "center", display: "block", color: "text.secondary" }}
              >
                By clicking the button above, you confirm that all goods above have been received in good condition.
              </Typography>
            </>
          )}
        </Box>
      </Layout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <Layout title="Goods Receipt" subtitle="Konfirmasi penerimaan barang dari vendor">
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "success.50",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={20} className="text-emerald-500" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Awaiting Confirmation
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Select a delivery that has arrived to confirm receipt.
            </Typography>
          </Box>
        </Box>

        {loadingOrders ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : !isBuyer ? (
          <Paper
            variant="outlined"
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 4,
              borderStyle: "dashed",
            }}
          >
            <Package size={40} style={{ opacity: 0.15, display: "block", margin: "0 auto 12px" }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Halaman ini hanya tersedia untuk Buyer.
            </Typography>
          </Paper>
        ) : pendingReceipts.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              textAlign: "center",
              py: 8,
              borderRadius: 4,
              borderStyle: "dashed",
            }}
          >
            <FileCheck2 size={40} style={{ opacity: 0.15, display: "block", margin: "0 auto 12px" }} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No deliveries awaiting confirmation.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pendingReceipts.map((po) => {
              const allowed = isGrAllowed(po.expected_receiving_date);
              const do_ = po.delivery_orders?.[0];
              return (
                <Paper
                  key={po.id}
                  variant="outlined"
                  onClick={() => allowed && setSelectedPo(po)}
                  sx={{
                    borderRadius: 3,
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2.5,
                    cursor: allowed ? "pointer" : "default",
                    opacity: allowed ? 1 : 0.6,
                    borderColor: allowed ? "divider" : "error.light",
                    transition: "all 0.2s ease",
                    "&:hover": allowed ? { boxShadow: 1, borderColor: "primary.main" } : {},
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: allowed ? "success.50" : "error.50",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Truck size={22} className={allowed ? "text-emerald-500" : "text-rose-500"} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Chip
                        size="small"
                        label={po.po_number}
                        sx={{ fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                      />
                      <Chip
                        size="small"
                        color={allowed ? "success" : "error"}
                        label={allowed ? "Siap Diterima" : `Tiba ${po.expected_receiving_date}`}
                        sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
                      />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {po.vendor_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                      {po.items?.length || 0} jenis barang
                      {do_?.tracking_number && (
                        <span>
                          {" "}· Resi: <strong>{do_.tracking_number}</strong>
                        </span>
                      )}
                    </Typography>
                  </Box>
                  {allowed && <ChevronRight size={20} className="text-gray-400" />}
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
