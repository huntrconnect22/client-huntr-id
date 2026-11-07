import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { ArrowLeft, FileText, Package, Printer } from "lucide-react";
import Layout from "~/components/Layout";
import { apiGet, createDirectPurchaseOrder } from "~/lib/api";
import { openAuthenticatedDocument } from "~/lib/open-auth-document";

export default function DirectPurchaseOrder() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [rfqId, setRfqId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdPo, setCreatedPo] = useState<any>(null);
  const [form, setForm] = useState({
    vendor_name: "",
    vendor_address: "",
    currency: "IDR",
    purchase_category: "Direct purchase",
    purchase_type: "Immediate",
    expected_receiving_date: "",
  });

  useEffect(() => {
    const rawCompany = localStorage.getItem("active_company");
    if (!rawCompany) {
      navigate("/login");
      return;
    }
    const activeCompany = JSON.parse(rawCompany);
    if (activeCompany.type !== "buyer") {
      navigate("/");
      return;
    }
    setCompany(activeCompany);

    apiGet(`/api/rfqs?company_id=${activeCompany.id}`)
      .then((response) => {
        const data = Array.isArray(response) ? response : response?.data || [];
        const directApproved = data.filter(
          (request: any) =>
            request.procurement_mode === "direct" &&
            request.status === "approved",
        );
        setRequests(directApproved);
        const requestedId = new URLSearchParams(window.location.search).get(
          "pr",
        );
        setRfqId(
          directApproved.some(
            (request: any) => String(request.id) === requestedId,
          )
            ? String(requestedId)
            : String(directApproved[0]?.id || ""),
        );
      })
      .catch(() => setError("Unable to load approved direct PRs."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === rfqId),
    [requests, rfqId],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company || !rfqId) return;
    setSaving(true);
    setError("");
    try {
      const response = await createDirectPurchaseOrder({
        company_id: company.id,
        rfq_id: rfqId,
        ...form,
      });
      setCreatedPo(response.po);
      setRequests((items) => items.filter((item) => String(item.id) !== rfqId));
    } catch (err: any) {
      setError(err?.message || "Unable to create the direct PO.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Create direct PO" subtitle="Loading approved PRs…">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      </Layout>
    );
  }

  if (createdPo) {
    return (
      <Layout
        title="Direct PO created"
        subtitle="The purchase order is ready to print."
      >
        <Paper variant="outlined" sx={{ maxWidth: 560, p: 3, borderRadius: 2 }}>
          <FileText className="text-orange-500" size={28} />
          <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700 }}>
            {createdPo.po_number}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            This PO is linked to the approved direct PR and cannot be created
            again from it.
          </Typography>
          <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => void openAuthenticatedDocument(`/api/orders/${createdPo.id}/print`)}
              startIcon={<Printer size={16} />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Print PO
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/orders")}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              View purchase orders
            </Button>
          </Box>
        </Paper>
      </Layout>
    );
  }

  return (
    <Layout
      title="Create direct PO"
      subtitle="Create an urgent PO from an approved direct PR."
    >
      <Box sx={{ maxWidth: 768, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Button
            size="small"
            onClick={() => navigate("/orders")}
            startIcon={<ArrowLeft size={14} />}
            sx={{ textTransform: "none", color: "text.secondary", fontWeight: 600 }}
          >
            Purchase orders
          </Button>
        </Box>

        <Paper
          component="form"
          variant="outlined"
          onSubmit={submit}
          sx={{ p: 3, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              PO details
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Choose one approved direct PR. A PR can only create one PO.
            </Typography>
          </Box>

          <TextField
            select
            fullWidth
            size="small"
            label="Approved direct PR"
            required
            value={rfqId}
            onChange={(event) => setRfqId(event.target.value)}
          >
            <MenuItem value="">Select PR</MenuItem>
            {requests.map((request) => (
              <MenuItem key={request.id} value={request.id}>
                {request.title} · #{String(request.id).slice(0, 8).toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          {selectedRequest && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption" sx={{ display: "block" }}>
                <strong>{selectedRequest.items?.length || 0} items</strong> will be copied from this approved PR. Total uses its approved estimated price.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Vendor name"
                required
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Expected receipt"
                type="date"
                value={form.expected_receiving_date}
                onChange={(e) => setForm({ ...form, expected_receiving_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Purchase category"
                value={form.purchase_category}
                onChange={(e) => setForm({ ...form, purchase_category: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Purchase type"
                value={form.purchase_type}
                onChange={(e) => setForm({ ...form, purchase_type: e.target.value })}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Vendor address"
            value={form.vendor_address}
            onChange={(event) =>
              setForm({ ...form, vendor_address: event.target.value })
            }
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, borderTop: 1, borderColor: "divider" }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving || !rfqId}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {saving ? "Creating…" : "Create PO"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}
