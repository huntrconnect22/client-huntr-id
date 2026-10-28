import React, { useState, useEffect, useRef } from "react";
import { submitProposal, apiGet } from "~/lib/api";
import { useLocation, useNavigate } from "react-router";
import { ProposalsView } from "../components/ProposalsView";

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
        const requestedRfq = location.state?.rfq;
        if (requestedRfq?.id) {
          handleSelectRfq(requestedRfq);
          fetchOpenTenders(comp.id);
        } else {
          fetchOpenTenders(comp.id).then((rfqs) => {
            if (location.state?.rfqId && rfqs) {
            const rfq = rfqs.find(
              (item: any) => String(item.id) === String(location.state.rfqId),
            );
            if (rfq) handleSelectRfq(rfq);
            }
          });
        }
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
          fetchOpenTenders(comp.id);
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
      const { apiPost } = await import("~/lib/api");
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

  const fetchOpenTenders = async (companyId = activeCompany?.id) => {
    setRfqsLoading(true);
    try {
      const query = new URLSearchParams({ status: "active" });
      if (companyId) query.set("company_id", String(companyId));
      const data = await apiGet(`/api/rfqs?${query.toString()}`);
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
    
    const alreadySubmitted = vendorSubmittedRfqIds.includes(String(rfq.id));
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
    
    const participatingItems = form.items.filter((it: any) => it.is_participating !== false);
    if (participatingItems.length === 0) {
      setError("Silakan pilih minimal 1 barang yang ingin Anda ikuti tendernya.");
      return;
    }
    
    const missingPrices = participatingItems.some((it: any) => !it.price_offer || parseFloat(it.price_offer) <= 0);
    if (missingPrices) {
      setError("Silakan masukkan harga penawaran yang valid untuk semua barang yang Anda pilih.");
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

      participatingItems.forEach((it: any, idx: number) => {
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

  return <ProposalsView {...{
    activeCompany, isBuyer, isVendor, selectedRfq, receivedProposals,
    proposalsLoading, awardingId, openRfqs, rfqsLoading, vendorSubmittedRfqIds,
    vendorSubmissions, form, loading, error, hasSubmittedForSelectedRfq,
    isProcessing, isDragging, fileInputRef, result, showNegModal,
    selectedNegProposal, fetchReceivedProposals, fetchOpenTenders, handleAward,
    handleSelectRfq, isTenderExpired, updateForm, handleDrag, handleDrop,
    handleSubmit, setSelectedRfq, setHasSubmittedForSelectedRfq, setError,
    setResult, setShowNegModal, setSelectedNegProposal,
  }} />;
}
