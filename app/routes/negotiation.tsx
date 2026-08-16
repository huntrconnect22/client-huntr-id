import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { 
  MessageSquare, Loader2, RefreshCw, Briefcase, 
  DollarSign, Clock, ShieldCheck, X, AlertCircle, 
  CheckCircle2, FileText, ChevronRight, Bot
} from "lucide-react";
import Swal from "sweetalert2";
import { isDemoMode } from "../lib/demo-mode";

// Negotiation Response Modal for Vendor
function NegotiationResponseModal({ negotiation, onClose, onSuccess }: { negotiation: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");

  const handleRespond = async (status: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      await apiPost(`/api/orders/negotiate/${negotiation.id}/respond`, {
        status,
        vendor_remarks: remarks
      });
      Swal.fire({
        icon: 'success',
        title: `Negotiation Responded!`,
        text: `Negotiation ${status} successfully!`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to respond to negotiation.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--ui-text-primary)]">Review Negotiation</h3>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">Proposed terms for RFQ: {negotiation.proposal?.rfq?.title}</p>
          </div>
          <button onClick={onClose} className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Terms Comparison */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[var(--ui-bg-input)] rounded-xl border border-[var(--ui-border)] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Original Offer</span>
              <p className="font-bold text-[var(--ui-text-primary)]">Rp {Number(negotiation.proposal?.price_offer).toLocaleString()}</p>
              <p className="text-[11px] text-[var(--ui-text-muted)]">Term: {negotiation.proposal?.payment_term}</p>
            </div>
            <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">Buyer's Counter</span>
              <p className="font-bold text-orange-500">Rp {negotiation.items?.reduce((acc: number, item: any) => acc + (Number(item.negotiated_price) * item.negotiated_qty), 0).toLocaleString()}</p>
              <p className="text-[11px] text-[var(--ui-text-muted)]">Term: {negotiation.payment_scheme}</p>
            </div>
          </div>

          {/* Negotiated Items */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Negotiated Items</span>
            <div className="space-y-2">
              {negotiation.items?.map((it: any, idx: number) => (
                <div key={idx} className="p-3 bg-[var(--ui-bg-input)] rounded-xl border border-[var(--ui-border)] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[var(--ui-text-primary)]">{it.proposal_item?.rfq_item?.catalogue?.name || "Item"}</p>
                    <p className="text-[11px] text-[var(--ui-text-muted)]">Qty: {it.negotiated_qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500">Rp {Number(it.negotiated_price).toLocaleString()}</p>
                    <p className="text-[10px] text-[var(--ui-text-muted)]">per Unit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Your Response Remarks</span>
            <textarea 
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any comments regarding your decision..."
              className="w-full bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded-xl p-3 text-xs text-[var(--ui-text-primary)] min-h-[80px] outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--ui-border)] flex items-center gap-2">
          <button 
            onClick={() => handleRespond('declined')}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border border-red-500 text-red-500 font-semibold text-xs hover:bg-red-500/5 transition-all"
          >
            Decline
          </button>
          <button 
            onClick={() => handleRespond('accepted')}
            disabled={loading}
            style={{ color: 'white' }}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Accept New Terms"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Negotiation() {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeg, setSelectedNeg] = useState<any>(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [triggeringBotId, setTriggeringBotId] = useState<string | null>(null);

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug = c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  useEffect(() => {
    const comp = localStorage.getItem("active_company");
    if (comp) {
      const parsed = JSON.parse(comp);
      setActiveCompany(parsed);
      fetchNegotiations(parsed.id);
    } else {
      navigate("/login");
    }
    
    const handleRefreshData = () => {
      const comp = localStorage.getItem("active_company");
      if (comp) {
        const parsed = JSON.parse(comp);
        fetchNegotiations(parsed.id);
      }
    };
    
    window.addEventListener('huntr:notification_received', handleRefreshData);
    return () => {
      window.removeEventListener('huntr:notification_received', handleRefreshData);
    };
  }, []);

  // Company slug redirect check
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/negotiation`, { replace: true });
    }
  }, [activeCompany]);

  const fetchNegotiations = async (companyId: string) => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/orders/negotiations?company_id=${companyId}`);
      setNegotiations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch negotiations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBotNegotiation = async (negotiationId: string) => {
    setTriggeringBotId(negotiationId);
    try {
      await apiPost(`/api/demo/negotiation/${negotiationId}/respond`, {});
      Swal.fire({
        icon: 'success',
        title: '🤖 AI Bot Merespons!',
        text: 'AI Bot vendor telah menyetujui negosiasi Anda.',
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      if (activeCompany) fetchNegotiations(activeCompany.id);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Gagal trigger AI Bot' });
    } finally {
      setTriggeringBotId(null);
    }
  };

  const isBuyer = activeCompany?.type === 'buyer';

  return (
    <Layout 
      title="Negotiations" 
      subtitle={isBuyer ? "Manage your counter-offers to vendors." : "Respond to buyer counter-offers and finalise terms."}
    >
      <div className="w-full space-y-4">
        {/* Header toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 px-4 rounded-xl">
          <div>
            <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
              {isBuyer ? "Sent Counter-Offers" : "Pending Counter-Offers"}
            </h2>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
              Track all ongoing price and term negotiations.
            </p>
          </div>
          <button
            onClick={() => fetchNegotiations(activeCompany.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500 transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <Loader2 className="animate-spin text-orange-500" size={28} />
            <span className="text-xs text-[var(--ui-text-muted)]">Loading negotiations...</span>
          </div>
        ) : negotiations.length === 0 ? (
          <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
            <MessageSquare size={36} className="text-[var(--ui-text-muted)] opacity-20" />
            <p className="text-sm font-semibold text-[var(--ui-text-primary)]">No Negotiations Found</p>
            <p className="text-xs text-[var(--ui-text-muted)]">You don't have any active negotiation records.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {negotiations.map(neg => (
              <div
                key={neg.id}
                className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)]">RFQ: {neg.proposal?.rfq?.title}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        neg.status === 'pending'
                          ? "bg-orange-500/10 text-orange-500"
                          : neg.status === 'accepted'
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {neg.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ui-text-muted)]">
                      {isBuyer ? `Vendor: ${neg.proposal?.company?.name}` : `Buyer: ${neg.proposal?.rfq?.company?.name || "Global Buyer"}`}
                    </p>
                  </div>

                  {!isBuyer && neg.status === 'pending' && (
                    <button 
                      onClick={() => {
                        setSelectedNeg(neg);
                        setShowRespondModal(true);
                      }}
                      style={{ color: 'white' }}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold transition-all"
                    >
                      Review & Respond
                    </button>
                  )}
                  {isBuyer && neg.status === 'pending' && isDemoMode() && (
                    <button
                      onClick={() => handleTriggerBotNegotiation(neg.id)}
                      disabled={triggeringBotId === neg.id}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white transition-all disabled:opacity-60"
                    >
                      {triggeringBotId === neg.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Bot size={12} />}
                      🤖 AI Bot Respond
                    </button>
                  )}
                  {isBuyer && neg.status === 'accepted' && (
                    <button 
                      onClick={() => navigate(`${getCompanyPrefix()}/my-pr/${neg.proposal?.rfq_id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-orange-500 hover:border-orange-400/50 transition-all"
                    >
                      Go to Award <ChevronRight size={13} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-t border-[var(--ui-border)] text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                    <DollarSign size={13} className="text-orange-500" /> Proposed: <span className="font-bold text-[var(--ui-text-primary)]">Rp {neg.items?.reduce((acc: number, item: any) => acc + (Number(item.negotiated_price) * item.negotiated_qty), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                    <Clock size={13} className="text-[var(--ui-text-muted)]" /> Lead Time: <span className="font-semibold text-[var(--ui-text-primary)]">{neg.delivery_terms} Days</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--ui-text-secondary)]">
                    <ShieldCheck size={13} className="text-[var(--ui-text-muted)]" /> Term: <span className="font-semibold text-[var(--ui-text-primary)]">{neg.payment_scheme}</span>
                  </div>
                </div>

                {(neg.buyer_remarks || neg.vendor_remarks) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {neg.buyer_remarks && (
                      <div className="p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Buyer's Note</span>
                        <p className="text-[var(--ui-text-secondary)] italic">"{neg.buyer_remarks}"</p>
                      </div>
                    )}
                    {neg.vendor_remarks && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 block">Vendor's Response</span>
                        <p className="text-[var(--ui-text-secondary)] italic">"{neg.vendor_remarks}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showRespondModal && selectedNeg && (
        <NegotiationResponseModal 
          negotiation={selectedNeg} 
          onClose={() => {
            setShowRespondModal(false);
            setSelectedNeg(null);
          }}
          onSuccess={() => {
            setShowRespondModal(false);
            setSelectedNeg(null);
            if (activeCompany) fetchNegotiations(activeCompany.id);
          }}
        />
      )}
    </Layout>
  );
}
