import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, FileText, Loader2, Package, Printer } from "lucide-react";
import Layout from "../components/Layout";
import { apiGet, createDirectPurchaseOrder, getFullApiUrl } from "../lib/api";

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
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  if (createdPo) {
    return (
      <Layout
        title="Direct PO created"
        subtitle="The purchase order is ready to print."
      >
        <div className="max-w-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5">
          <FileText className="text-orange-500" size={28} />
          <h2 className="mt-3 text-lg font-bold">{createdPo.po_number}</h2>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
            This PO is linked to the approved direct PR and cannot be created
            again from it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={getFullApiUrl(`/api/orders/${createdPo.id}/print`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            >
              <Printer size={15} /> Print PO
            </a>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-4 py-2 text-sm font-semibold"
            >
              View purchase orders
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Create direct PO"
      subtitle="Create an urgent PO from an approved direct PR."
    >
      <div className="max-w-3xl space-y-4">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-text-secondary)]"
        >
          <ArrowLeft size={14} /> Purchase orders
        </button>
        <form
          onSubmit={submit}
          className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 space-y-4"
        >
          <div>
            <h2 className="font-bold">PO details</h2>
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Choose one approved direct PR. A PR can only create one PO.
            </p>
          </div>
          <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
            Approved direct PR
            <select
              required
              value={rfqId}
              onChange={(event) => setRfqId(event.target.value)}
              className="mt-1 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)]"
            >
              <option value="">Select PR</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>
                  {request.title} · #
                  {String(request.id).slice(0, 8).toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          {selectedRequest && (
            <div className="border-l-2 border-orange-500 bg-orange-500/5 px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
              <span className="font-semibold">
                {selectedRequest.items?.length || 0} items
              </span>{" "}
              will be copied from this approved PR. Total uses its approved
              estimated price.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Vendor name *"
              value={form.vendor_name}
              onChange={(vendor_name) => setForm({ ...form, vendor_name })}
              required
            />
            <Field
              label="Expected receipt"
              type="date"
              value={form.expected_receiving_date}
              onChange={(expected_receiving_date) =>
                setForm({ ...form, expected_receiving_date })
              }
            />
            <Field
              label="Purchase category"
              value={form.purchase_category}
              onChange={(purchase_category) =>
                setForm({ ...form, purchase_category })
              }
            />
            <Field
              label="Purchase type"
              value={form.purchase_type}
              onChange={(purchase_type) => setForm({ ...form, purchase_type })}
            />
          </div>
          <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
            Vendor address
            <textarea
              value={form.vendor_address}
              onChange={(event) =>
                setForm({ ...form, vendor_address: event.target.value })
              }
              rows={2}
              className="mt-1 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)]"
            />
          </label>
          {error && (
            <p className="border-l-2 border-red-500 bg-red-500/5 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end border-t border-[var(--ui-border)] pt-3">
            <button
              disabled={saving || !rfqId}
              className="inline-flex items-center gap-2 bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />} Create
              PO
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)]"
      />
    </label>
  );
}
