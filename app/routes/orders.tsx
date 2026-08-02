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
      <div style={{ maxWidth:"100%", width:"100%" }}>
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:16 }}>

          {/* Header Card */}
          <div className="huntr-action-card" style={{ background:"var(--ui-bg-card)", border:"1px solid var(--ui-border)", borderRadius:12, backdropFilter:"blur(20px)", transition:"all 0.3s ease", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:8, background:"linear-gradient(135deg,#f97316,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(249,115,22,0.2)" }}>
                <FileText size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize:16, fontWeight:700, color:"var(--ui-text-primary)", margin:0 }}>
                  {company.type==="buyer" ? "Purchase Orders" : "Catalogue Items"} ({totalOrders})
                </h2>
                <p style={{ fontSize:12, color:"var(--ui-text-secondary)", margin:"2px 0 0" }}>
                  Workspace: <strong style={{ color:"#fdba74" }}>{company.name}</strong>
                </p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginLeft:"auto" }}>
              <button onClick={() => setShowImportModal(true)} style={{ background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:8, padding:"7px 12px", display:"flex", alignItems:"center", gap:6, cursor:"pointer", color:"#fb923c", fontWeight:600, fontSize:12 }}>
                <UploadCloud size={14} /> Import {company.type==="buyer" ? "Historical PO" : "Catalogue"}
              </button>
              <button onClick={exportToExcel} disabled={orders.length===0} style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"7px 12px", display:"flex", alignItems:"center", gap:6, cursor:orders.length===0?"not-allowed":"pointer", color:"#22c55e", fontWeight:600, fontSize:12, opacity:orders.length===0?0.6:1 }}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button onClick={() => fetchOrders(company.id, currentPage, searchQuery, activeTab)} disabled={refreshing} style={{ background:"var(--ui-bg-input)", border:"1px solid var(--ui-border-input)", borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--ui-text-secondary)" }}>
                <RefreshCw size={15} className={refreshing?"animate-spin":""} />
              </button>
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

          {/* Tabs + Search */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:8, background:"var(--ui-bg-input)", padding:6, borderRadius:8, width:"fit-content" }}>
              {([{id:"all",label:"All POs"},{id:"operational",label:"Operational"},{id:"historical",label:"Historical"}] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding:"6px 12px", borderRadius:12, border:"none", background:activeTab===tab.id?"rgba(249,115,22,0.15)":"transparent", color:activeTab===tab.id?"#fdba74":"var(--ui-text-muted)", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.3s ease" }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ position:"relative", flex:1, maxWidth:400 }}>
              <Search size={18} color="var(--ui-text-muted)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
              <input type="text" placeholder="Search by PO number, vendor, or user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width:"100%", padding:"9px 12px 9px 40px", borderRadius:8, background:"var(--ui-bg-input)", border:"1px solid var(--ui-border-input)", color:"var(--ui-text-primary)", outline:"none", fontSize:14, boxSizing:"border-box" }} />
            </div>
          </div>

          {/* Feedback */}
          {successMessage && <div style={{ padding:12, borderRadius:8, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"#4ade80", fontSize:14, fontWeight:700 }}>{successMessage}</div>}
          {error && <div style={{ padding:12, borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", fontSize:14, fontWeight:700 }}>{error}</div>}

          {/* PO List */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {orders.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", background:"var(--ui-bg-input)", borderRadius:8, border:"1px dashed var(--ui-border-input)" }}>
                <FileText size={48} style={{ opacity:0.1, marginBottom:16 }} />
                <h3 style={{ color:"var(--ui-text-secondary)", margin:0, fontSize:16 }}>No purchase orders found</h3>
              </div>
            ) : orders.map(po => {
              const { label, bg, color, Icon: StatusIcon } = getStatusBadge(po.status);
              return (
                <div key={po.id} style={{ background:"var(--ui-bg-card)", borderRadius:12, border:"1px solid var(--ui-border)", padding:"10px 12px", display:"flex", flexDirection:"column", gap:16, transition:"all 0.3s ease" }}>
                  {/* PO Row */}
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:"#f59e0b", background:"rgba(249,115,22,0.1)", padding:"2px 8px", borderRadius:6 }}>{po.po_number}</span>
                        {po.is_historical && <span style={{ fontSize:10, fontWeight:600, color:"#f59e0b", background:"rgba(245,158,11,0.1)", padding:"2px 8px", borderRadius:6, textTransform:"uppercase" }}>Historical</span>}
                      </div>
                      <h3 style={{ margin:0, fontSize:18, fontWeight:600, color:"var(--ui-text-primary)" }}>{po.rfq?.title||"Purchase Order Document"}</h3>
                    </div>
                    <div style={{ width:200 }}>
                      <div style={{ fontSize:11, color:"var(--ui-text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Vendor</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Building size={14} color="var(--ui-text-secondary)" />
                        <span style={{ fontSize:14, fontWeight:700, color:"var(--ui-text-primary)" }}>{po.vendor_name||"N/A"}</span>
                      </div>
                    </div>
                    <div style={{ width:160 }}>
                      <div style={{ fontSize:11, color:"var(--ui-text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Date</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Calendar size={14} color="var(--ui-text-secondary)" />
                        <span style={{ fontSize:14, fontWeight:600, color:"var(--ui-text-primary)" }}>{po.order_date||new Date(po.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ width:140 }}>
                      <div style={{ fontSize:11, color:"var(--ui-text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Status</div>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:10, background:bg, color, fontSize:12, fontWeight:700, textTransform:"capitalize" }}>
                        <StatusIcon size={14} /> {label}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:12 }}>
                      {company.type==='vendor' && ['published','issued'].includes(po.status) && (
                        <button onClick={() => handleConfirmPo(po.id)} disabled={confirmingId===po.id}
                          style={{ background:"var(--huntr-orange)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 12px rgba(249,115,22,0.2)" }}>
                          {confirmingId===po.id ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} Confirm PO
                        </button>
                      )}
                      {company.type==='vendor' && po.status==='paid' && (
                        <button onClick={() => handleUpdateTrackingStatus(po.id,'packing',po.status)} disabled={processingId===po.id}
                          style={{ background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 12px rgba(139,92,246,0.2)" }}>
                          {processingId===po.id ? <Loader2 size={12} className="animate-spin"/> : <Package size={12}/>} Mark as Packing
                        </button>
                      )}
                      {company.type==='vendor' && po.status==='packing' && (
                        <button onClick={() => handleArrangeDelivery(po.id,po.buyer_address)} disabled={processingId===po.id}
                          style={{ background:"linear-gradient(135deg,#3b82f6,#2563eb)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 12px rgba(59,130,246,0.2)" }}>
                          {processingId===po.id ? <Loader2 size={12} className="animate-spin"/> : <Truck size={12}/>} Arrange Delivery
                        </button>
                      )}
                      {company.type==='vendor' && po.status==='in_transit' && (
                        <button onClick={() => handleUpdateTrackingStatus(po.id,'delivered',po.status)} disabled={processingId===po.id}
                          style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 12px rgba(34,197,94,0.2)" }}>
                          {processingId===po.id ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} Mark as Delivered
                        </button>
                      )}
                      {company.type==='buyer' && po.delivery_orders?.some((d: any) => ['shipped','delivered'].includes(d.status)) && (
                        <button onClick={() => navigate(`/receipts?po_id=${po.id}`)}
                          style={{ background:"var(--huntr-green)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 12px rgba(34,197,94,0.2)" }}>
                          <Package size={12}/> Receive Goods
                        </button>
                      )}
                      <button onClick={() => setExpandedPo(expandedPo===po.id ? null : po.id)}
                        style={{ width:40, height:40, borderRadius:12, background:"var(--ui-bg-input)", border:"1px solid var(--ui-border-input)", color:"var(--ui-text-secondary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s ease" }}>
                        {expandedPo===po.id ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                      </button>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {!po.is_historical && Number(po.total_amount) > 0 && (() => {
                    const base = Number(po.total_amount);
                    const { platFeeRate, platFee, ppnPlatform, adminBank, pph23, biayaLayanan, ppn, grandTotal } = calcFees(base);

                    const rows = [
                      { label: "Subtotal Barang",                                                  value: base,                  muted: false },
                      { label: `Platform Fee + PPN (${(platFeeRate*100).toFixed(0)}% + 11%)`,      value: platFee + ppnPlatform, muted: true  },
                      { label: "Admin Bank",                                                        value: adminBank,             muted: true  },
                      { label: "PPH 23 (2%)",                                                       value: pph23,                 muted: true  },
                      { label: "Biaya Layanan",                                                      value: biayaLayanan,          muted: true  },
                      { label: "PPN (11%)",                                                         value: ppn,                   muted: true  },
                    ] as Array<{ label: string; value: number; muted: boolean }>;

                    return (
                      <div style={{
                        background: "var(--ui-bg-input)",
                        border: "1px solid var(--ui-border-input)",
                        borderRadius: 12,
                        overflow: "hidden",
                      }}>
                        {/* Header */}
                        <div style={{
                          padding: "9px 14px",
                          borderBottom: "1px solid var(--ui-border-input)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                            Rincian Biaya
                          </span>
                        </div>

                        {/* Rows */}
                        <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
                          {rows.map((item, idx) => (
                            <div key={item.label} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "5px 0",
                              borderBottom: idx < rows.length - 1 ? "1px solid var(--ui-border-input)" : "none",
                            }}>
                              <span style={{ fontSize: 11, color: item.muted ? "var(--ui-text-muted)" : "var(--ui-text-secondary)", fontWeight: 500 }}>
                                {item.label}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: item.muted ? "var(--ui-text-muted)" : "var(--ui-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                                {fmt(Math.round(item.value))}
                              </span>
                            </div>
                          ))}

                          {/* Grand Total row */}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            marginTop: 6,
                            borderRadius: 8,
                            background: "rgba(249,115,22,0.08)",
                            border: "1px solid rgba(249,115,22,0.2)",
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ui-text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Total
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#f97316", fontVariantNumeric: "tabular-nums" }}>
                              IDR {fmt(Math.round(grandTotal))}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Expanded Details */}
                  {expandedPo===po.id && (
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {lastPage>1 && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, marginTop:20 }}>
              <button onClick={() => handlePageChange(currentPage-1)} disabled={currentPage===1}
                style={{ width:40, height:40, borderRadius:12, border:"1px solid var(--ui-border-input)", background:"var(--ui-bg-input)", color:"var(--ui-text-secondary)", cursor:currentPage===1?"not-allowed":"pointer" }}>
                <ChevronLeft size={20}/>
              </button>
              <span style={{ fontSize:14, color:"var(--ui-text-secondary)", fontWeight:600 }}>Page {currentPage} of {lastPage}</span>
              <button onClick={() => handlePageChange(currentPage+1)} disabled={currentPage===lastPage}
                style={{ width:40, height:40, borderRadius:12, border:"1px solid var(--ui-border-input)", background:"var(--ui-bg-input)", color:"var(--ui-text-secondary)", cursor:currentPage===lastPage?"not-allowed":"pointer" }}>
                <ChevronRight size={20}/>
              </button>
            </div>
          )}
        </div>

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
