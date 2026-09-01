import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import {
  Loader2,
  AlertCircle,
  FileText,
  Package,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  RefreshCw,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

interface Return {
  id: string;
  return_number: string;
  po_number: string;
  return_date: string;
  status: string;
  return_reason: string;
  inspection_status: string;
  total_return_value: number;
  items: any[];
}

export default function ReturnsPage() {
  const [company, setCompany] = useState<any>(null);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      setCompany(JSON.parse(activeComp));
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchReturns();
    }
  }, [company, filterStatus]);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const statusFilter = filterStatus !== "all" ? `&status=${filterStatus}` : "";
      const response = await fetch(
        getFullApiUrl(`/api/returns?company_id=${company.id}${statusFilter}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load returns data");

      const data = await response.json();
      setReturns(data.data || data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load returns data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (returnId: string) => {
    const printUrl = getFullApiUrl(`/api/returns/${returnId}/pdf`);
    window.open(printUrl, "_blank");
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          cls: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          dot: "bg-amber-500",
        };
      case "in_transit":
        return {
          label: "In Transit",
          cls: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          dot: "bg-blue-500",
        };
      case "received":
        return {
          label: "Received",
          cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-500",
        };
      case "processed":
        return {
          label: "Processed",
          cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          dot: "bg-emerald-500",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          cls: "text-red-500 bg-red-500/10 border-red-500/20",
          dot: "bg-red-500",
        };
      default:
        return {
          label: status,
          cls: "text-[var(--ui-text-muted)] bg-[var(--ui-bg-input)] border-[var(--ui-border)]",
          dot: "bg-gray-400",
        };
    }
  };

  const filteredReturns = returns.filter((r) => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      (r.return_number && r.return_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.po_number && r.po_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.return_reason && r.return_reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (isModuleDisabledInDemo("returns")) {
    return <DemoDisabledBanner module="returns" />;
  }

  return (
    <Layout title="Returns Management" subtitle="Manage and monitor returned goods & quality rejections">
      <div className="w-full space-y-4">
        {error && (
          <div className="p-3 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Toolbar Header ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 px-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ui-text-primary)] leading-tight">
                Returns List ({filteredReturns.length})
              </h2>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                Workspace: <span className="font-semibold text-orange-500">{company?.name || "..."}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => fetchReturns()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Filter Tabs & Search Bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[var(--ui-bg-input)] p-1 rounded-xl border border-[var(--ui-border)] overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Returns" },
              { id: "pending", label: "Pending" },
              { id: "in_transit", label: "In Transit" },
              { id: "received", label: "Received" },
              { id: "processed", label: "Processed" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={filterStatus === tab.id ? { color: "white" } : {}}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? "bg-orange-500 shadow-sm"
                    : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <input
              type="text"
              placeholder="Search by return no, PO, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs outline-none focus:border-orange-400/60 transition-all"
            />
          </div>
        </div>

        {/* ── List Content ── */}
        {loading ? (
          <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-orange-500" />
            <span className="text-xs font-medium text-[var(--ui-text-muted)]">Loading returns...</span>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-20 flex flex-col items-center justify-center gap-2 text-center bg-[var(--ui-bg-card)]">
            <Package size={32} className="text-[var(--ui-text-muted)] opacity-30 mb-1" />
            <p className="text-sm font-bold text-[var(--ui-text-primary)]">No Returns Found</p>
            <p className="text-xs text-[var(--ui-text-muted)]">
              No return records match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredReturns.map((ret: Return) => {
              const statusCfg = getStatusBadge(ret.status);
              const isApproved = ret.inspection_status === "approved";
              const isRejected = ret.inspection_status === "rejected";

              return (
                <div
                  key={ret.id}
                  className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] hover:border-orange-500/30 transition-all overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: ID + Metadata */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded font-mono">
                          {ret.return_number}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>

                        {ret.inspection_status && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              isApproved
                                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                                : isRejected
                                ? "text-red-500 bg-red-500/10 border-red-500/20"
                                : "text-[var(--ui-text-muted)] bg-[var(--ui-bg-input)] border-[var(--ui-border)]"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 size={11} className="text-emerald-500" />
                            ) : isRejected ? (
                              <XCircle size={11} className="text-red-500" />
                            ) : (
                              <Clock size={11} />
                            )}
                            <span className="capitalize">QC: {ret.inspection_status}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--ui-text-muted)] flex-wrap pt-0.5">
                        <span className="font-semibold text-[var(--ui-text-primary)]">
                          PO: <span className="font-mono">{ret.po_number || "—"}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Reason:{" "}
                          <span className="text-[var(--ui-text-secondary)] capitalize font-medium">
                            {(ret.return_reason || "Defect").replace(/_/g, " ")}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{ret.return_date || "—"}</span>
                        {ret.items && ret.items.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{ret.items.length} item(s)</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Value & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--ui-border-subtle)]">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-semibold text-[var(--ui-text-muted)] uppercase">
                          Return Value
                        </div>
                        <div className="text-sm font-bold text-[var(--ui-text-primary)] font-mono">
                          IDR {Number(ret.total_return_value || 0).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPdf(ret.id)}
                        disabled={downloadingId === ret.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-500/40 hover:text-orange-500 transition-all shrink-0"
                      >
                        {downloadingId === ret.id ? (
                          <Loader2 size={12} className="animate-spin text-orange-500" />
                        ) : (
                          <Download size={12} />
                        )}
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

