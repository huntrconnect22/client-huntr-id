import { Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import Layout from "~/shared/components/Layout";
import { NegotiationModal } from "~/features/proposals/components/NegotiationModal";
import { BuyerProposalsView } from "~/features/proposals/components/BuyerProposalsView";
import { VendorTendersView } from "~/features/proposals/components/VendorTendersView";
import { VendorSubmissionsList } from "~/features/proposals/components/VendorSubmissionsList";
import { VendorProposalForm } from "~/features/proposals/components/VendorProposalForm";

type ProposalsViewProps = Record<string, any>;

/** Presentational boundary: renders only; actions and state belong to the controller hook. */
export function ProposalsView(props: ProposalsViewProps) {
  const {
    activeCompany, isBuyer, isVendor, selectedRfq, receivedProposals,
    proposalsLoading, awardingId, openRfqs, rfqsLoading, vendorSubmittedRfqIds,
    vendorSubmissions, form, loading, error, hasSubmittedForSelectedRfq,
    isProcessing, isDragging, fileInputRef, result, showNegModal,
    selectedNegProposal, fetchReceivedProposals, fetchOpenTenders,
    handleAward, handleSelectRfq, isTenderExpired, updateForm, handleDrag,
    handleDrop, handleSubmit, setSelectedRfq, setHasSubmittedForSelectedRfq,
    setError, setResult, setShowNegModal, setSelectedNegProposal,
  } = props;

  if (!activeCompany) {
    return <Layout title="Proposals" subtitle="Loading your workspace..."><div className="flex min-h-[50vh] flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-orange-500" size={28} /><span className="text-xs text-[var(--ui-text-muted)]">Loading workspace...</span></div></Layout>;
  }

  return (
    <Layout title="Proposals" subtitle={isBuyer ? "Review, negotiate, and award vendor proposals for your RFQs." : "Manage your bids, submit quotations, and review active tender opportunities."}>
      <div className="w-full space-y-6"><div className="w-full">
        {isBuyer ? <BuyerProposalsView receivedProposals={receivedProposals} proposalsLoading={proposalsLoading} activeCompany={activeCompany} awardingId={awardingId} onRefresh={fetchReceivedProposals} onNegotiate={(proposal: any) => { setSelectedNegProposal(proposal); setShowNegModal(true); }} onAward={handleAward} /> : isVendor && !selectedRfq ? <div className="space-y-6"><VendorTendersView openRfqs={openRfqs} rfqsLoading={rfqsLoading} vendorSubmittedRfqIds={vendorSubmittedRfqIds} isTenderExpired={isTenderExpired} onRefresh={fetchOpenTenders} onSelectRfq={handleSelectRfq} /><VendorSubmissionsList vendorSubmissions={vendorSubmissions} /></div> : isVendor ? <VendorProposalForm selectedRfq={selectedRfq} form={form} loading={loading} error={error} hasSubmittedForSelectedRfq={hasSubmittedForSelectedRfq} isProcessing={isProcessing} isDragging={isDragging} fileInputRef={fileInputRef} updateForm={updateForm} handleDrag={handleDrag} handleDrop={handleDrop} handleSubmit={handleSubmit} onCancel={() => { setSelectedRfq(null); setHasSubmittedForSelectedRfq(false); setError(null); }} /> : <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--ui-border)] py-16 text-center"><Briefcase size={40} className="text-[var(--ui-text-muted)] opacity-20" /><p className="text-sm font-semibold text-[var(--ui-text-primary)]">Workspace Not Found</p><p className="text-xs text-[var(--ui-text-muted)]">Please ensure you are logged in correctly.</p></div>}
      </div>{result && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-emerald-500 p-4 text-xs font-semibold text-white shadow-xl"><CheckCircle2 size={18} /><div><p className="font-bold">Quotation Submitted!</p><p className="text-[11px] opacity-90">Your offer is now active in the tender system.</p></div><button onClick={() => setResult(null)} className="ml-2 text-sm font-bold text-white/80 hover:text-white">×</button></div>}</div>
      {showNegModal && selectedNegProposal && <NegotiationModal proposal={selectedNegProposal} onClose={() => { setShowNegModal(false); setSelectedNegProposal(null); }} onSuccess={() => { setShowNegModal(false); setSelectedNegProposal(null); fetchReceivedProposals(activeCompany.id); }} />}
    </Layout>
  );
}
