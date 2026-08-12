import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { submitProposal, apiGet } from "../lib/api";
import { Loader2, Briefcase, CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { NegotiationModal } from "../features/proposals/components/NegotiationModal";
import { BuyerProposalsView } from "../features/proposals/components/BuyerProposalsView";
import { VendorTendersView } from "../features/proposals/components/VendorTendersView";
import { VendorSubmissionsList } from "../features/proposals/components/VendorSubmissionsList";
import { VendorProposalForm } from "../features/proposals/components/VendorProposalForm";

export default function Proposals() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<any>(null);

  // Buyer state
  const [receivedProposals, setReceivedProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [showNegModal, setShowNegModal] = useState(false);
  const [selectedNegProposal, setSelectedNegProposal] = useState<any>(null);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  // Vendor/Tenders state
  const [openRfqs, setOpenRfqs] = useState<any[]>([]);
  const [vendorSubmissions, setVendorSubmissions] = useState<any[]>([]);
  const [rfqsLoading, setRfqsLoading] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [vendorSubmittedRfqIds, setVendorSubmittedRfqIds] = useState<string[]>([]);
  const [hasSubmittedForSelectedRfq, setHasSubmittedForSelectedRfq] = useState(false);

  // Proposal form state
  const [form, setForm] = useState<any>({
    delivery_days: "7", 
    warranty_months: "12",
    payment_term: "30 days",
    document: null as File | null,
    items: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = useRef(false);

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug = c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      const comp = JSON.parse(activeComp);
      setActiveCompany(comp);
      if (comp.type === 'vendor') {
        fetchOpenTenders().then((rfqs) => {
          if (location.state?.rfqId && rfqs) {
            const rfq = rfqs.find((r: any) => r.id === location.state.rfqId);
            if (rfq) handleSelectRfq(rfq);
          }
        });
        fetchVendorSubmissions(comp.id);
      } else {
        fetchReceivedProposals(comp.id);
      }
    }
    
    const handleRefreshData = () => {
      const activeComp = localStorage.getItem("active_company");
      if (activeComp) {
        const comp = JSON.parse(activeComp);
        if (comp.type === 'vendor') {
          fetchOpenTenders();
          fetchVendorSubmissions(comp.id);
        } else {
          fetchReceivedProposals(comp.id);
        }
      }
    };
    
    window.addEventListener('huntr:notification_received', handleRefreshData);
    return () => {
      window.removeEventListener('huntr:notification_received', handleRefreshData);
    };
  }, [location.state]);

  // Company slug redirect check
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/proposals`, { replace: true });
    }
  }, [activeCompany]);

  const fetchReceivedProposals = async (companyId: string | number) => {
    setProposalsLoading(true);
    try {
      const data = await apiGet(`/api/proposals?company_id=${companyId}`);
      setReceivedProposals(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch received proposals", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleAward = async (proposalId: string) => {
    if (!activeCompany) return;
    const userSession = localStorage.getItem("user_session");
    const user = userSession ? JSON.parse(userSession) : null;
    
    setAwardingId(proposalId);
    try {
      const { apiPost } = await import("../lib/api");
      await apiPost(`/api/proposals/${proposalId}/award`, {
        rfq_id: receivedProposals.find(p => p.id === proposalId)?.rfq_id,
        user_id: user?.id,
      });
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: 'success',
        title: 'Winner Awarded!',
        text: '✓ Winner awarded! Notification sent to manager for final approval.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      fetchReceivedProposals(activeCompany.id);
    } catch (err) {
      console.error(err);
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to award winner.'
      });
    } finally {
      setAwardingId(null);
    }
  };

  const fetchOpenTenders = async () => {
    setRfqsLoading(true);
    try {
      const data = await apiGet("/api/rfqs?status=active");
      const rfqs = Array.isArray(data) ? data : data.data || [];
      setOpenRfqs(rfqs);
      return rfqs;
    } catch (err) {
      console.error("Failed to fetch tenders", err);
    } finally {
      setRfqsLoading(false);
    }
  };

  const fetchVendorSubmissions = async (companyId: string | number) => {
    try {
      const data = await apiGet(`/api/proposals/my-rank?company_id=${companyId}`);
      const rankings = data.rankings || [];
      
      const submissions = rankings.map((ranking: any) => ({
        id: `ranking-${ranking.rfq_id}`,
        rfq_id: ranking.rfq_id,
        rfq: { title: ranking.rfq_title },
        price_offer: ranking.my_price,
        delivery_days: "N/A",
        payment_term: "N/A",
        created_at: ranking.submitted_at,
        rank: ranking.my_rank,
        total_participants: ranking.total_participants,
        is_winner: ranking.is_winner,
        buyer_name: ranking.buyer_name
      }));
      
      setVendorSubmissions(submissions);
      setVendorSubmittedRfqIds(rankings.map((item: any) => String(item.rfq_id)));
    } catch (err) {
      console.error("Failed to fetch vendor submissions", err);
    }
  };

  const updateForm = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const isTenderExpired = (rfq: any): boolean => {
    if (!rfq || !rfq.approved_at) return false;
    const duration = rfq?.duration_days ?? 7;
    const endDate = new Date(rfq.approved_at);
    endDate.setDate(endDate.getDate() + duration);
    const now = new Date();
    return now > endDate;
  };

  const handleSelectRfq = (rfq: any) => {
    if (isTenderExpired(rfq)) {
      setError("This tender period has expired. No more proposals can be submitted.");
      return;
    }
    
    const alreadySubmitted = vendorSubmittedRfqIds.includes(rfq.id);
    setSelectedRfq(rfq);
    setHasSubmittedForSelectedRfq(alreadySubmitted);
    setError(alreadySubmitted ? "Your company already submitted an offer for this tender." : null);
    if (rfq) {
      setForm((p: any) => ({
        ...p,
        items: rfq.items?.map((item: any) => ({
          rfq_item_id: item.id,
          price_offer: "",
          catalogue: item.catalogue
        })) || []
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      updateForm("document", e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !selectedRfq) return;

    if (isTenderExpired(selectedRfq)) {
      setError("This tender period has expired. No more proposals can be submitted.");
      return;
    }

    if (isProcessing.current || loading) {
      console.warn("Request already in progress");
      return;
    }
    
    const missingPrices = form.items.some((it: any) => !it.price_offer || parseFloat(it.price_offer) <= 0);
    if (missingPrices) {
      setError("Please provide a valid price offer for all items.");
      return;
    }

    isProcessing.current = true;
    setLoading(true); 
    setError(null);
    try {
      const formData = new FormData();
      formData.append("company_id", activeCompany.id.toString());
      formData.append("rfq_id", selectedRfq.id.toString());
      formData.append("delivery_days", form.delivery_days);
      formData.append("warranty_months", form.warranty_months);
      formData.append("payment_term", form.payment_term);
      
      if (form.document) formData.append("document", form.document);

      form.items.forEach((it: any, idx: number) => {
        formData.append(`items[${idx}][rfq_item_id]`, it.rfq_item_id.toString());
        formData.append(`items[${idx}][price_offer]`, it.price_offer.toString());
      });

      const data = await submitProposal(formData);
      setResult(data.proposal);
      setVendorSubmittedRfqIds(prev => selectedRfq ? [...new Set([...prev, selectedRfq.id])] : prev);
      setSelectedRfq(null);
      setHasSubmittedForSelectedRfq(false);
      setForm({ delivery_days: "7", warranty_months: "12", payment_term: "30 days", document: null, items: [] });
      setTimeout(() => setResult(null), 5000);
      fetchOpenTenders();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal");
      isProcessing.current = false;
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessing.current = false;
      }, 1000);
    }
  };

  const isVendor = activeCompany?.type === 'vendor';
  const isBuyer = activeCompany?.type === 'buyer';

  if (!activeCompany) {
    return (
      <Layout title="Proposals" subtitle="Loading your workspace...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="animate-spin text-orange-500" size={28} />
          <span className="text-xs text-[var(--ui-text-muted)]">Loading workspace...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Proposals" subtitle={isBuyer ? "Review, negotiate, and award vendor proposals for your RFQs." : "Manage your bids, submit quotations, and review active tender opportunities."}>
      <div className="w-full space-y-6">
        
        <div className="w-full">
          {isBuyer ? (
            <BuyerProposalsView
              receivedProposals={receivedProposals}
              proposalsLoading={proposalsLoading}
              activeCompany={activeCompany}
              awardingId={awardingId}
              onRefresh={fetchReceivedProposals}
              onNegotiate={(p) => { setSelectedNegProposal(p); setShowNegModal(true); }}
              onAward={handleAward}
            />
          ) : isVendor && !selectedRfq ? (
            <div className="space-y-6">
              <VendorTendersView 
                openRfqs={openRfqs}
                rfqsLoading={rfqsLoading}
                vendorSubmittedRfqIds={vendorSubmittedRfqIds}
                isTenderExpired={isTenderExpired}
                onRefresh={fetchOpenTenders}
                onSelectRfq={handleSelectRfq}
              />
              <VendorSubmissionsList 
                vendorSubmissions={vendorSubmissions}
              />
            </div>
          ) : isVendor && selectedRfq ? (
            <VendorProposalForm 
              selectedRfq={selectedRfq}
              form={form}
              loading={loading}
              error={error}
              hasSubmittedForSelectedRfq={hasSubmittedForSelectedRfq}
              isProcessing={isProcessing}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              updateForm={updateForm}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              handleSubmit={handleSubmit}
              onCancel={() => { setSelectedRfq(null); setHasSubmittedForSelectedRfq(false); setError(null); }}
            />
          ) : (
            <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-2 text-center">
              <Briefcase size={40} className="text-[var(--ui-text-muted)] opacity-20" />
              <p className="text-sm font-semibold text-[var(--ui-text-primary)]">Workspace Not Found</p>
              <p className="text-xs text-[var(--ui-text-muted)]">Please ensure you are logged in correctly.</p>
            </div>
          )}
        </div>

        {/* Floating Success Notification */}
        {result && (
          <div className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-xl shadow-xl flex items-center gap-3 z-50 text-xs font-semibold">
            <CheckCircle2 size={18} />
            <div>
              <p className="font-bold">Quotation Submitted!</p>
              <p className="text-[11px] opacity-90">Your offer is now active in the tender system.</p>
            </div>
            <button onClick={() => setResult(null)} className="ml-2 text-white/80 hover:text-white font-bold text-sm">×</button>
          </div>
        )}
      </div>

      {showNegModal && selectedNegProposal && (
        <NegotiationModal 
          proposal={selectedNegProposal} 
          onClose={() => { setShowNegModal(false); setSelectedNegProposal(null); }}
          onSuccess={() => { setShowNegModal(false); setSelectedNegProposal(null); fetchReceivedProposals(activeCompany.id); }}
        />
      )}
    </Layout>
  );
}
