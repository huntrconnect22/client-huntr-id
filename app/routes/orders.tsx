import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import Layout from "../components/Layout";
import QRCode from "qrcode";
import {
  FileText, RefreshCw, ChevronDown, ChevronRight, Loader2,
  Calendar, Building, CheckCircle2, ChevronLeft, Package, Clock,
  UploadCloud, FileSpreadsheet, Search, Truck
} from "lucide-react";
import {
  getOrders, importHistoricalPo, importCatalogue,
  getCsrfCookie, apiPost, getFullApiUrl, arrangeDelivery,
  publishInvoice, updatePoTrackingStatus
} from "../lib/api";
import PaymentModal from "../components/PaymentModal";
import { ImportModal } from "../features/orders/components/ImportModal";
import { PoExpandedDetails } from "../features/orders/components/PoExpandedDetails";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':  return { label: 'Confirmed',  bg: "rgba(249,115,22,0.1)",  color: "#f97316",  Icon: CheckCircle2 };
    case 'paid':       return { label: 'Paid',        bg: "rgba(59,130,246,0.1)",  color: "#3b82f6",  Icon: CheckCircle2 };
    case 'completed':
    case 'done':       return { label: 'Completed',   bg: "rgba(34,197,94,0.1)",   color: "#22c55e",  Icon: CheckCircle2 };
    case 'shipped':
    case 'delivered':  return { label: 'Delivering',  bg: "rgba(236,72,153,0.1)",  color: "#ec4899",  Icon: Package };
    default:           return { label: 'Issued',      bg: "rgba(249,115,22,0.1)",  color: "#fb923c",  Icon: Clock };
  }
};

// ─── Fee Calculator ───────────────────────────────────────────────────────────
const getPlatFeeRate = (base: number) => {
  if (base <= 100_000_000) return 0.05;
  if (base <= 250_000_000) return 0.03;
  return 0.02;
};

const calcFees = (base: number) => {
  const platFeeRate  = getPlatFeeRate(base);
  const platFee      = base * platFeeRate;
  const ppnPlatform  = platFee * 0.11;
  const adminBank    = 4400;
  const pph23        = platFee * 0.02;
  const biayaLayanan = (platFee + ppnPlatform) + adminBank - pph23;
  const ppn          = base * 0.11;
  const grandTotal   = base + biayaLayanan + ppn;
  return { platFeeRate, platFee, ppnPlatform, adminBank, pph23, biayaLayanan, ppn, grandTotal };
};

const fmt = (n: number) => n.toLocaleString('id-ID');

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth & company
  const [company, setCompany] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Orders list
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "operational" | "historical">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPo, setExpandedPo] = useState<string | null>(null);

  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [issuingBastId, setIssuingBastId] = useState<string | null>(null);

  // Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const activeComp = localStorage.getItem("active_company");
    if (!userSession || !activeComp) { navigate("/login"); return; }
    setUser(JSON.parse(userSession));
    setCompany(JSON.parse(activeComp));
    setLoading(false);
    const params = new URLSearchParams(location.search);
    const sp = params.get("search");
    if (sp) setSearchQuery(sp);
    getCsrfCookie().catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (company) fetchOrders(company.id, 1, searchQuery, activeTab);
  }, [location.pathname, location.search, company, activeTab]);

  useEffect(() => {
    if (!company) return;
    const timer = setTimeout(() => fetchOrders(company.id, 1, searchQuery, activeTab), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Data ────────────────────────────────────────────────────────────────
  const fetchOrders = async (companyId: string | number, page: number, search = "", type = "all") => {
    try {
      setRefreshing(true);
      const res = await getOrders(companyId, page, 10, search, type);
      setOrders(res.data || []);
      setCurrentPage(res.current_page || 1);
      setLastPage(res.last_page || 1);
      setTotalOrders(res.total || 0);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage || !company) return;
    fetchOrders(company.id, newPage, searchQuery, activeTab);
  };

  const generateQRCode = useCallback(async (text: string) => {
    try { return await QRCode.toDataURL(text, { width: 128 }); }
    catch { return null; }
  }, []);

  // ─── Excel Export ────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (orders.length === 0) return;
    const headers = [
      "PO Number","Tender Title","Vendor Name","Order Date","PO Status","PO Currency",
      "PO Total Amount","PO Created By","PO Approved By","DO Handed By","DO Received By",
      "BAST Handed By","BAST Received By","Item Name","Item Code","Item Qty","Item UOM",
      "Item Unit Price","Item Tax","Item Subtotal"
    ];
    const rows: any[] = [];
    orders.forEach(po => {
      const doHBy  = po.delivery_orders?.map((d: any) => d.handed_by_name   || "").filter(Boolean).join("; ") || "";
      const doRBy  = po.delivery_orders?.map((d: any) => d.received_by_name || "").filter(Boolean).join("; ") || "";
      const bHBy   = po.basts?.map((b: any) => b.handed_by_name   || "").filter(Boolean).join("; ") || "";
      const bRBy   = po.basts?.map((b: any) => b.received_by_name || "").filter(Boolean).join("; ") || "";
      const base   = [po.po_number||"",po.rfq?.title||"Purchase Order",po.vendor_name||"",po.order_date||new Date(po.created_at).toLocaleDateString(),po.status||"issued",po.currency||"IDR",po.total_amount||0,po.created_by||"System",po.approved_by||"",doHBy,doRBy,bHBy,bRBy];
      if (po.items?.length > 0) {
        po.items.forEach((item: any) => rows.push([...base,item.inventory_name||"",item.inventory_code||"",item.qty||0,item.uom||"",item.unit_price||0,item.tax_amount||0,item.total_amount||0]));
      } else {
        rows.push([...base,"","",0,"",0,0,0]);
      }
    });
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
    const a = document.createElement("a");
    a.href = url; a.download = `purchase_orders_detailed_${new Date().toISOString().slice(0,10)}.csv`;
    a.style.visibility = "hidden"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ─── Actions ────────────────────────────────────────────────────────────
  const showSuccess = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(null), 3000); };

  const handleSignDocument = async (type: 'bast'|'do', id: string, role: 'handed-by'|'received-by') => {
    if (!user || !company) return;
    setProcessingId(id); setError(null);
    try {
      const endpoint = type === 'bast' ? `/api/basts/${id}/sign-${role}` : `/api/do/${id}/sign-${role}`;
      const data = role === 'handed-by'
        ? { handed_by_user_id: user.id, handed_by_name: user.name, handed_by_position: "Manager" }
        : { received_by_user_id: user.id, received_by_name: user.name, received_by_position: "Manager" };
      const res = await apiPost(endpoint, data);
      if (res?.do || res?.bast) {
        const signed = res.do || res.bast;
        setOrders(prev => prev.map(po => ({
          ...po,
          delivery_orders: type==='do' ? po.delivery_orders?.map((d: any) => d.id===id ? signed : d) : po.delivery_orders,
          basts: type==='bast' ? po.basts?.map((b: any) => b.id===id ? signed : b) : po.basts,
        })));
      }
      showSuccess(`✓ Signed successfully as ${role}!`);
      if (company) await fetchOrders(company.id, currentPage, searchQuery, activeTab);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to sign document");
    } finally { setProcessingId(null); }
  };

  const handleConfirmPo = async (poId: string) => {
    if (!company) return;
    setConfirmingId(poId); setError(null);
    try {
      await apiPost(`/api/orders/${poId}/confirm`, { company_id: company.id });
      showSuccess("✓ PO confirmed! Proforma invoice has been published to buyer.");
      fetchOrders(company.id, currentPage);
    } catch (err: any) { setError(err.message || "Failed to confirm PO"); }
    finally { setConfirmingId(null); }
  };

  const handleArrangeDelivery = async (poId: string, buyerAddress?: string) => {
    if (!company) return;
    const tracking = window.prompt(`Enter Tracking Number / Resi (Optional)\nDelivery point: ${buyerAddress||"Buyer company address"}`);
    if (tracking === null) return;
    setProcessingId(poId); setError(null);
    try {
      await arrangeDelivery(poId, company.id, tracking);
      showSuccess("✓ Delivery arranged! Delivery Order published to buyer.");
      fetchOrders(company.id, currentPage);
    } catch (err: any) { setError(err.message || "Failed to arrange delivery"); }
    finally { setProcessingId(null); }
  };

  const handleUpdateTrackingStatus = async (poId: string, status: 'packing'|'in_transit'|'delivered', currentPoStatus: string) => {
    if (!company) return;
    let note: string|undefined;
    if (status === 'in_transit') {
      const resi = window.prompt('Enter Tracking Number / Resi (optional):');
      if (resi === null) return;
      if (resi) note = resi;
    }
    setProcessingId(poId); setError(null);
    try {
      await updatePoTrackingStatus(poId, company.id, status, note);
      const labels: Record<string,string> = {packing:'Goods Being Packed',in_transit:'In Transit',delivered:'Goods Delivered'};
      showSuccess(`✓ Status updated: ${labels[status]}! Buyer has been notified.`);
      fetchOrders(company.id, currentPage, searchQuery, activeTab);
    } catch (err: any) { setError(err.message||'Failed to update tracking status'); }
    finally { setProcessingId(null); }
  };

  const handlePublishInvoice = async (invoiceId: string) => {
    if (!company) return;
    setProcessingId(invoiceId); setError(null);
    try {
      await publishInvoice(invoiceId, company.id);
      showSuccess("✓ Invoice published successfully! Sent to buyer finance.");
      fetchOrders(company.id, currentPage);
    } catch (err: any) { setError(err.message||"Failed to publish invoice"); }
    finally { setProcessingId(null); }
  };

  const handleIssueBast = async (poId: string) => {
    if (!company || !user) return;
    setIssuingBastId(poId); setError(null);
    try {
      const token = JSON.parse(localStorage.getItem("user_session")||"{}").token;
      if (!token) { setError("Authentication token not found"); return; }
      const po = orders.find(p => p.id === poId);
      if (!po) { setError("Purchase order not found"); return; }
      const payload = {
        po_id: poId, handed_by_name: user.name||company.name,
        handed_by_position: user.role||"Manager", handed_by_user_id: user.id,
        received_by_name: "Buyer Representative", received_by_position: "Procurement Manager",
        items: po.items||[], handover_notes: `BAST for PO ${po.po_number}`, created_by: user.id,
      };
      const res = await fetch(getFullApiUrl("/api/basts"), {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`}, body:JSON.stringify(payload)
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Failed (${res.status})`); }
      const data = await res.json();
      showSuccess(`✓ BAST ${data.bast.bast_number} issued! Notification sent to buyer.`);
      fetchOrders(company.id, currentPage);
    } catch (err: any) { setError(err.message||"Failed to issue BAST"); }
    finally { setIssuingBastId(null); }
  };

  const handleImport = async () => {
    if (!importFile || !company) return;
    setIsImporting(true); setImportError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", String(company.id));
      fd.append("csv", importFile);
      if (company.type==="buyer") await importHistoricalPo(fd); else await importCatalogue(fd);
      setImportSuccess(true);
      setTimeout(() => { setShowImportModal(false); setImportSuccess(false); setImportFile(null); fetchOrders(company.id,1); }, 3000);
    } catch (err: any) { setImportError(err.message||"Import failed."); }
    finally { setIsImporting(false); }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Purchase Order" subtitle="Loading your Purchase Orders...">
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"50vh", gap:14 }}>
          <Loader2 size={32} className="animate-spin" color="#f59e0b" />
          <span style={{ fontSize:13, color:"#6b7280" }}>Fetching PO data...</span>
        </div>
      </Layout>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Layout title="Purchase Order" subtitle="View and manage all purchase order documents.">
      <div className="w-full space-y-4">

        {/* Header & Controls Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 px-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ui-text-primary)] leading-tight">
                {company?.type === "buyer" ? "Purchase Orders" : "Catalogue Items"} ({totalOrders})
              </h2>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                Workspace: <span className="font-semibold text-orange-500">{company?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
            >
              <UploadCloud size={13} /> Import {company?.type === "buyer" ? "Historical PO" : "Catalogue"}
            </button>
            <button
              onClick={exportToExcel}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={13} /> Export Excel
            </button>
            <button
              onClick={() => fetchOrders(company.id, currentPage, searchQuery, activeTab)}
              disabled={refreshing}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[var(--ui-bg-input)] p-1 rounded-xl border border-[var(--ui-border)]">
            {([{ id: "all", label: "All POs" }, { id: "operational", label: "Operational" }, { id: "historical", label: "Historical" }] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? { color: 'white' } : {}}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-500 shadow-sm"
                    : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <input
              type="text"
              placeholder="Search by PO number, vendor, or user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs outline-none focus:border-orange-400/60 transition-all"
            />
          </div>
        </div>

          {/* Import Modal */}
          {showImportModal && (
            <ImportModal
              companyType={company.type}
              importFile={importFile}
              isImporting={isImporting}
              importError={importError}
              importSuccess={importSuccess}
              onFileChange={setImportFile}
              onClose={() => setShowImportModal(false)}
              onImport={handleImport}
            />
          )}



        {/* ── PO List ── */}
        {orders.length === 0 ? (
          <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-20 flex flex-col items-center justify-center gap-3">
            <FileText size={36} className="text-[var(--ui-text-muted)] opacity-20" />
            <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">No purchase orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(po => {
              const { label, bg, color, Icon: StatusIcon } = getStatusBadge(po.status);
              const isExpanded = expandedPo === po.id;
              const base = Number(po.total_amount);

              return (
                <div
                  key={po.id}
                  className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] overflow-hidden transition-all"
                >
                  {/* PO Row — main info */}
                  <div className="p-4 flex items-start gap-4 flex-wrap">

                    {/* Left: PO identity */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                          {po.po_number}
                        </span>
                        {po.is_historical && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                            Historical
                          </span>
                        )}
                        {/* Status badge inline with PO number on mobile */}
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: bg, color }}
                        >
                          <StatusIcon size={10} /> {label}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--ui-text-primary)] leading-snug truncate">
                        {po.rfq?.title || "Purchase Order Document"}
                      </h3>
                    </div>

                    {/* Meta chips */}
                    <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">Vendor</p>
                        <p className="text-xs font-bold text-[var(--ui-text-primary)] flex items-center gap-1">
                          <Building size={11} className="text-[var(--ui-text-muted)]" />
                          {po.vendor_name || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">Date</p>
                        <p className="text-xs font-bold text-[var(--ui-text-primary)] flex items-center gap-1">
                          <Calendar size={11} className="text-[var(--ui-text-muted)]" />
                          {po.order_date || new Date(po.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {base > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">Amount</p>
                          <p className="text-xs font-bold text-orange-500">IDR {fmt(base)}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {company.type === 'vendor' && ['published','issued'].includes(po.status) && (
                        <button
                          onClick={() => handleConfirmPo(po.id)}
                          disabled={confirmingId === po.id}
                          style={{ color: 'white' }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-[11px] font-bold transition-all disabled:opacity-60"
                        >
                          {confirmingId === po.id ? <Loader2 size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>} Confirm
                        </button>
                      )}
                      {company.type === 'vendor' && po.status === 'paid' && (
                        <button
                          onClick={() => handleUpdateTrackingStatus(po.id,'packing',po.status)}
                          disabled={processingId === po.id}
                          style={{ color: 'white' }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-[11px] font-bold transition-all disabled:opacity-60"
                        >
                          {processingId === po.id ? <Loader2 size={11} className="animate-spin"/> : <Package size={11}/>} Packing
                        </button>
                      )}
                      {company.type === 'vendor' && po.status === 'packing' && (
                        <button
                          onClick={() => handleArrangeDelivery(po.id, po.buyer_address)}
                          disabled={processingId === po.id}
                          style={{ color: 'white' }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-[11px] font-bold transition-all disabled:opacity-60"
                        >
                          {processingId === po.id ? <Loader2 size={11} className="animate-spin"/> : <Truck size={11}/>} Deliver
                        </button>
                      )}
                      {company.type === 'vendor' && po.status === 'in_transit' && (
                        <button
                          onClick={() => handleUpdateTrackingStatus(po.id,'delivered',po.status)}
                          disabled={processingId === po.id}
                          style={{ color: 'white' }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[11px] font-bold transition-all disabled:opacity-60"
                        >
                          {processingId === po.id ? <Loader2 size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>} Delivered
                        </button>
                      )}
                      {company.type === 'buyer' && po.delivery_orders?.some((d: any) => ['shipped','delivered'].includes(d.status)) && (
                        <button
                          onClick={() => navigate(`/receipts?po_id=${po.id}`)}
                          style={{ color: 'white' }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[11px] font-bold transition-all"
                        >
                          <Package size={11}/> Receive
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedPo(isExpanded ? null : po.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 transition-all"
                      >
                        {isExpanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                      </button>
                    </div>
                  </div>

                  {/* Fee Breakdown — inset */}
                  {!po.is_historical && base > 0 && (() => {
                    const { platFeeRate, platFee, ppnPlatform, adminBank, pph23, biayaLayanan, ppn, grandTotal } = calcFees(base);
                    const feeRows = [
                      { label: "Subtotal Barang", value: base },
                      { label: `Platform Fee + PPN (${(platFeeRate*100).toFixed(0)}% + 11%)`, value: platFee + ppnPlatform },
                      { label: "Admin Bank", value: adminBank },
                      { label: "PPH 23 (2%)", value: pph23 },
                      { label: "Biaya Layanan", value: biayaLayanan },
                      { label: "PPN (11%)", value: ppn },
                    ];
                    return (
                      <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                        <div className="px-4 py-2 border-b border-[var(--ui-border)]">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--ui-text-muted)]">Rincian Biaya</span>
                        </div>
                        <div className="divide-y divide-[var(--ui-border)]">
                          {feeRows.map(row => (
                            <div key={row.label} className="flex items-center justify-between px-4 py-1.5 text-xs">
                              <span className="text-[var(--ui-text-muted)]">{row.label}</span>
                              <span className="font-semibold text-[var(--ui-text-secondary)] tabular-nums">{fmt(Math.round(row.value))}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wide">Total</span>
                            <span className="text-sm font-bold text-orange-500 tabular-nums">IDR {fmt(Math.round(grandTotal))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--ui-border)]">
                      <PoExpandedDetails
                        po={po} company={company} user={user}
                        processingId={processingId} issuingBastId={issuingBastId}
                        generateQRCode={generateQRCode}
                        onSign={handleSignDocument}
                        onArrangeDelivery={handleArrangeDelivery}
                        onUpdateTrackingStatus={handleUpdateTrackingStatus}
                        onIssueBast={handleIssueBast}
                        onPayInvoice={(inv) => { setSelectedInvoice(inv); setShowPaymentModal(true); }}
                        onPublishInvoice={handlePublishInvoice}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <PaymentModal
            invoice={selectedInvoice}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => { setShowPaymentModal(false); fetchOrders(company.id, currentPage, searchQuery, activeTab); }}
          />
        )}
      </div>
    </Layout>
  );
}
