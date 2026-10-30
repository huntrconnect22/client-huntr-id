import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "~/components/Layout";
import { getPayments } from "~/lib/api";
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (!activeComp) {
      navigate("/login");
      return;
    }
    const ac = JSON.parse(activeComp);
    setCompany(ac);
    fetchPayments(ac.id, 1);
  }, []);

  const fetchPayments = async (companyId: string, page: number) => {
    try {
      setRefreshing(true);
      const res = await getPayments(companyId, page);
      setPayments(res.data || []);
      setCurrentPage(res.current_page || 1);
      setLastPage(res.last_page || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage || !company) return;
    fetchPayments(company.id, newPage);
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'settlement' || s === 'capture' || s === 'paid') 
      return { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Success" };
    if (s === 'pending') 
      return { bg: "rgba(249,115,22,0.1)", color: "#fb923c", label: "Pending" };
    if (s === 'failure' || s === 'expire' || s === 'cancel') 
      return { bg: "rgba(239,68,68,0.1)", color: "#f87171", label: "Failed" };
    return { bg: "rgba(255,255,255,0.05)", color: "#94a3b8", label: status };
  };

  if (loading) {
    return (
      <Layout title="Payment History" subtitle="Loading your transactions...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 size={32} className="animate-spin text-orange-500" />
          <span className="text-sm text-gray-500">Fetching history...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payment History" subtitle="Monitor all your financial transactions.">
      <div className="flex flex-col gap-6 w-full">
        
        {/* Summary Card */}
        <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-[24px] p-6 flex flex-wrap items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <CreditCard size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--ui-text-primary)] leading-none">Transactions ({total})</h2>
              <p className="text-xs text-[var(--ui-text-secondary)] mt-2">Workspace: <span className="text-orange-400 font-bold">{company?.name}</span></p>
            </div>
          </div>
          
          <HuntrButton
            onClick={() => fetchPayments(company.id, currentPage)}
            disabled={refreshing}
            className="w-11 h-11 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] flex items-center justify-center text-[var(--ui-text-secondary)] hover:text-orange-500 transition-all active:scale-95"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </HuntrButton>
        </div>

        {/* Transaction List */}
        <div className="flex flex-col gap-4">
          {payments.length === 0 ? (
            <div className="py-20 text-center bg-[var(--ui-bg-input)] rounded-[32px] border border-dashed border-[var(--ui-border-input)]">
              <Clock size={48} className="mx-auto opacity-10 mb-4" />
              <p className="text-[var(--ui-text-secondary)] font-medium">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-[var(--ui-border)] bg-[var(--ui-bg-card)]">
              <HuntrTable className="w-full border-collapse">
                <HuntrTableHead>
                  <HuntrTableRow className="bg-[var(--ui-bg-input)]/50">
                    <HuntrTableHeaderCell className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Transaction</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Entity</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Amount</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Method</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Status</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--ui-text-muted)]">Date</HuntrTableHeaderCell>
                  </HuntrTableRow>
                </HuntrTableHead>
                <HuntrTableBody className="divide-y divide-[var(--ui-border-input)]">
                  {payments.map((p) => {
                    const status = getStatusStyle(p.status);
                    const isOut = company.id === p.invoice?.purchase_order?.buyer_company_id;
                    
                    return (
                      <HuntrTableRow key={p.id} className="hover:bg-white/5 transition-colors group">
                        <HuntrTableCell className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-[var(--ui-text-primary)] group-hover:text-orange-400 transition-colors">#{p.external_id}</span>
                            <span className="text-[10px] text-[var(--ui-text-muted)] font-mono uppercase tracking-tighter">PO: {p.invoice?.purchase_order?.po_number || 'N/A'}</span>
                          </div>
                        </HuntrTableCell>
                        <HuntrTableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOut ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {isOut ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                            </div>
                            <span className="text-xs font-bold text-[var(--ui-text-primary)]">
                              {isOut ? p.invoice?.purchase_order?.vendor_name : 'Direct Payment'}
                            </span>
                          </div>
                        </HuntrTableCell>
                        <HuntrTableCell className="px-6 py-5 text-xs font-black text-[var(--ui-text-primary)]">
                          IDR {Number(p.amount).toLocaleString()}
                        </HuntrTableCell>
                        <HuntrTableCell className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                              <CreditCard size={10} className="text-[var(--ui-text-muted)]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-[var(--ui-text-secondary)]">{p.payment_method.replace('_', ' ')}</span>
                          </div>
                        </HuntrTableCell>
                        <HuntrTableCell className="px-6 py-5">
                          <div className="flex justify-center">
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ background: status.bg, color: status.color }}>
                              {status.label === 'Success' ? <CheckCircle2 size={10} /> : status.label === 'Pending' ? <Clock size={10} /> : <XCircle size={10} />}
                              {status.label}
                            </span>
                          </div>
                        </HuntrTableCell>
                        <HuntrTableCell className="px-6 py-5 text-right">
                          <span className="text-[10px] font-medium text-[var(--ui-text-muted)]">
                            {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </HuntrTableCell>
                      </HuntrTableRow>
                    );
                  })}
                </HuntrTableBody>
              </HuntrTable>
            </div>
          )}
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex justify-center items-center gap-6 mt-4">
            <HuntrButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] flex items-center justify-center text-[var(--ui-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-orange-500/50 transition-all"
            >
              <ChevronLeft size={20} />
            </HuntrButton>
            <span className="text-xs font-bold text-[var(--ui-text-secondary)]">
              Page {currentPage} <span className="text-[var(--ui-text-muted)] font-medium">of</span> {lastPage}
            </span>
            <HuntrButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === lastPage}
              className="w-10 h-10 rounded-xl border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] flex items-center justify-center text-[var(--ui-text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-orange-500/50 transition-all"
            >
              <ChevronRight size={20} />
            </HuntrButton>
          </div>
        )}
      </div>
    </Layout>
  );
}
