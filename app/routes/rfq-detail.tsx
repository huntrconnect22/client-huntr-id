import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { aiRankProposals } from "../lib/api/ai";
import { useEventBusListener } from "../lib/EventBus";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import { useAppShell } from "./_app";
import { AlertCircle, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { NegotiationModal } from "../components/rfq-detail/NegotiationModal";
import { RFQHeader } from "../components/rfq-detail/RFQHeader";
import { RFQDescription } from "../components/rfq-detail/RFQDescription";
import { RFQItemsTable } from "../components/rfq-detail/RFQItemsTable";
import { ProposalRankings } from "../components/rfq-detail/ProposalRankings";
import { AIAnalysisPanel } from "../components/rfq-detail/AIAnalysisPanel";
import { RFQSidebar } from "../components/rfq-detail/RFQSidebar";

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-2 min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] truncate">{label}</div>
      <div className={`text-sm font-bold tabular-nums truncate mt-0.5 ${accent ? "text-orange-400" : "text-[var(--ui-text-primary)]"}`}>
        {value}
      </div>
    </div>
  );
}

export default function RfqDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const { user, company } = useAppShell();
  const [rfq, setRfq] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [awardingProposal, setAwardingProposal] = useState<string | number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isProcessing = useRef(false);

  const isBuyer = company?.type === "buyer";
  const isVendor = company?.type === "vendor";
  const isOwner = company?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const canApproveOrAward = isBuyer && isManager;

  const [showNegModal, setShowNegModal] = useState(false);
  const [selectedNegProposal, setSelectedNegProposal] = useState<any>(null);
  const [aiRankings, setAiRankings] = useState<any>(null);
  const [aiRankLoading, setAiRankLoading] = useState(false);
  const [aiRankError, setAiRankError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [inviteWhatsapp, setInviteWhatsapp] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchRankings = useCallback(async (rfqId: string | number) => {
    try {
      const data = await apiGet(`/api/rfqs/${rfqId}/rankings`);
      setRankings(Array.isArray(data) ? data : data.rankings || []);
    } catch {
      setRankings([]);
    }
  }, []);

  const loadRfq = useCallback(async (rfqId: string) => {
    const response = await apiGet(`/api/rfqs/${rfqId}`);
    const data = response?.rfq ?? response?.data ?? response;
    setRfq(data);
    if (data?.id) fetchRankings(data.id);
    return data;
  }, [fetchRankings]);

  useEffect(() => {
    if (!id || id === "NaN" || id === "undefined") {
      setError("Invalid RFQ ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRfq(id)
      .then(() => setError(null))
      .catch(() => setError("Unable to load RFQ detail. Please try again."))
      .finally(() => setLoading(false));
  }, [id, loadRfq]);

  const handleRefresh = () => {
    if (!id) return;
    setLoading(true);
    loadRfq(id).finally(() => setLoading(false));
  };

  const handleInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteWhatsapp || !id) return;
    setInviting(true);
    try {
      const res = await apiPost(`/api/rfqs/${id}/invite-vendor`, { whatsapp: inviteWhatsapp });
      if (res.whatsapp_link) window.open(res.whatsapp_link, "_blank");
      Swal.fire({ icon: "success", title: "Invitation Sent!", timer: 2500, showConfirmButton: false });
      setInviteWhatsapp("");
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to send invitation." });
    } finally {
      setInviting(false);
    }
  };

  const handleAiRank = async () => {
    if (!rfq?.id) return;
    setAiRankLoading(true);
    setAiRankError(null);
    setShowAiPanel(true);
    try {
      const res = await aiRankProposals(rfq.id);
      if (res.success) setAiRankings(res.data);
      else setAiRankError(res.error || "AI ranking unavailable.");
    } catch {
      setAiRankError("Failed to reach AI service.");
    } finally {
      setAiRankLoading(false);
    }
  };

  const handleAwardWinner = async (proposalId: string | number, rfqId: string | number) => {
    if (isProcessing.current || !user) return;
    isProcessing.current = true;
    setAwardingProposal(proposalId);
    setError(null);
    try {
      await apiPost(`/api/proposals/${proposalId}/award`, { rfq_id: rfqId, user_id: user.id });
      setSuccessMessage("Proposal awarded — sent to manager for approval.");
      if (id) await loadRfq(id);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to award proposal");
    } finally {
      setAwardingProposal(null);
      setTimeout(() => { isProcessing.current = false; }, 500);
    }
  };

  useEventBusListener(["negotiation.responded"], () => {
    if (id) loadRfq(id);
  });

  const isTenderExpired = (): boolean => {
    if (!rfq || rfq.status !== "active" || !rfq.approved_at) return false;
    const duration = rfq.duration_days ?? 7;
    const endsAt = new Date(rfq.approved_at);
    endsAt.setDate(endsAt.getDate() + duration);
    return Date.now() > endsAt.getTime();
  };

  const getTenderSummary = (): string => {
    const duration = rfq?.duration_days ?? 7;
    if (rfq?.status === "active" && rfq.approved_at) {
      const endsAt = new Date(rfq.approved_at);
      endsAt.setDate(endsAt.getDate() + duration);
      const diffMs = endsAt.getTime() - Date.now();
      if (diffMs <= 0) return "Closed";
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
    }
    if (rfq?.status === "draft" || rfq?.status === "pending_approval") {
      return `${duration}d after approval`;
    }
    return `${duration} days`;
  };

  const canSubmitProposal = (): boolean =>
    Boolean(rfq && isVendor && rfq.status === "active" && rfq.approved_at && !isTenderExpired());

  const totalItems = rfq?.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) ?? 0;
  const lineItems = rfq?.items?.length ?? 0;
  const isRfqAlreadyAwarded = rankings.some(
    (r) => r.is_winner || r.proposal?.winner_status === "awarded" || r.proposal?.winner_status === "approved"
  );
  const prShort = rfq?.id ? String(rfq.id).substring(0, 8).toUpperCase() : "";

  if (loading && !rfq) {
    return (
      <Layout title="RFQ Detail" subtitle="Loading...">
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  if (error && !rfq) {
    return (
      <Layout title="RFQ Detail" subtitle="Error">
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm font-semibold text-[var(--ui-text-primary)]">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!rfq) {
    return (
      <Layout title="RFQ Detail" subtitle="Not found">
        <div className="py-16 text-center text-sm text-[var(--ui-text-muted)]">RFQ not found.</div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`RFQ #${prShort}`}
      subtitle={isMobile ? undefined : rfq.title}
    >
      <div className="w-full flex flex-col gap-4 pb-20 lg:pb-4">
        <RFQHeader rfq={rfq} isTenderExpired={isTenderExpired} onRefresh={handleRefresh} />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-semibold">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatCell label="Line Items" value={String(lineItems)} />
          <StatCell label="Total Qty" value={`${totalItems} units`} />
          <StatCell label="Proposals" value={String(rankings.length)} accent={rankings.length > 0} />
          <StatCell label="Duration" value={`${rfq.duration_days ?? 7} days`} />
          <StatCell label="Time Left" value={getTenderSummary()} />
        </div>

        <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            <RFQDescription rfq={rfq} successMessage={successMessage} />
            <RFQItemsTable rfq={rfq} />
            {rfq.status === "active" && (
              <>
                <ProposalRankings
                  rankings={rankings}
                  canApproveOrAward={canApproveOrAward}
                  isRfqAlreadyAwarded={isRfqAlreadyAwarded}
                  awardingProposal={awardingProposal}
                  isProcessing={isProcessing.current}
                  onNegotiate={(p) => { setSelectedNegProposal(p); setShowNegModal(true); }}
                  onAward={handleAwardWinner}
                  onAIRank={handleAiRank}
                  aiRankLoading={aiRankLoading}
                  showAiPanel={showAiPanel}
                />
                <AIAnalysisPanel
                  showAiPanel={showAiPanel}
                  aiRankLoading={aiRankLoading}
                  aiRankError={aiRankError}
                  aiRankings={aiRankings}
                />
              </>
            )}
          </div>

          <RFQSidebar
            rfq={rfq}
            canSubmitProposal={canSubmitProposal}
            canApproveOrAward={canApproveOrAward}
            isTenderExpired={isTenderExpired}
            isVendor={isVendor}
            getTenderSummary={getTenderSummary}
            totalItems={totalItems}
            onNavigateToProposals={() => navigate("/proposals", { state: { rfqId: rfq.id } })}
            onInviteVendor={handleInviteVendor}
            inviteWhatsapp={inviteWhatsapp}
            setInviteWhatsapp={setInviteWhatsapp}
            inviting={inviting}
          />
        </div>
      </div>

      {isMobile && canSubmitProposal() && (
        <button
          type="button"
          onClick={() => navigate("/proposals", { state: { rfqId: rfq.id } })}
          className="fixed z-[90] left-4 right-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] flex items-center justify-center gap-2 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold border border-[var(--ui-border)] lg:hidden"
        >
          Submit Proposal <ArrowRight size={16} />
        </button>
      )}

      {isMobile && isVendor && isTenderExpired() && (
        <div className="fixed z-[90] left-4 right-4 bottom-[calc(16px+env(safe-area-inset-bottom,0px))] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-red-500/25 bg-[var(--ui-bg-card)] text-red-400 text-xs font-semibold lg:hidden">
          <AlertTriangle size={14} />
          Tender period ended
        </div>
      )}

      {showNegModal && selectedNegProposal && (
        <NegotiationModal
          proposal={selectedNegProposal}
          onClose={() => { setShowNegModal(false); setSelectedNegProposal(null); }}
          onSuccess={() => {
            setShowNegModal(false);
            setSelectedNegProposal(null);
            if (id) fetchRankings(id);
          }}
        />
      )}
    </Layout>
  );
}
