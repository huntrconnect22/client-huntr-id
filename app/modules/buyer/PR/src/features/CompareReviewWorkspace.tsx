import Button from "@mui/material/Button";
import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import Layout from "~/components/Layout";
import { apiPost } from "~/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAppShell } from "~/modules/shell/src/features/AppShell";
import { useCompareReviewData } from "~/features/rfq/hooks/useCompareReviewData";
import {
  CompareReviewHeader,
  CompareReviewSummary,
  CompareRequestedItems,
  CompareAiAnalysis,
  VendorRankingsList,
  ComparisonMatrixTable,
  SeparateOrderModal,
} from "../components/compare-review";
import { printComparisonForm } from "../utils/printComparisonForm";

export default function CompareReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppShell();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSeparateOrderModal, setShowSeparateOrderModal] = useState(false);

  const {
    request,
    rankings,
    overallAnalysis,
    recommendedWinnerId,
    awardedProposal,
    loading,
    error,
    refresh,
  } = useCompareReviewData(id);

  const handleApproveWinner = useCallback(
    async (proposalId: string | number) => {
      if (!user) return;
      setProcessingId(String(proposalId));
      try {
        await apiPost(`/api/proposals/${proposalId}/approve`, { user_id: user.id });
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Winner approved! PO has been generated.",
        });
        navigate("/approvals");
      } catch (err) {
        console.error("Failed to approve winner", err);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to approve winner. Check console for details.",
        });
      } finally {
        setProcessingId(null);
      }
    },
    [user, navigate]
  );

  const handlePrint = useCallback(() => {
    printComparisonForm({
      request,
      rankings,
      awardedProposal,
      overallAnalysis,
      companyName: user?.company?.name || request?.company?.name,
    });
  }, [request, rankings, awardedProposal, overallAnalysis, user]);

  // Loading state
  if (loading) {
    return (
      <Layout title="Compare & Review" subtitle="Loading details...">
        <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
          <Loader2 className="animate-spin" color="var(--huntr-orange)" size={40} />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <Layout title="Compare & Review" subtitle="Error loading details">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 100,
            textAlign: "center",
          }}
        >
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: 0 }}>
            {error || "Request not found"}
          </h3>
          <p style={{ color: "var(--ui-text-muted)", marginTop: 8 }}>
            Please check the URL or try again later.
          </p>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/approvals")}
            sx={{
              mt: 2.5,
              px: 2.5,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Back to Approvals
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`Compare & Review: ${request.title}`}
      subtitle={`PR #${String(request.id).substring(0, 8).toUpperCase()}`}
    >
      {/* Header Navigation */}
      <CompareReviewHeader
        title={request.title}
        onRefresh={refresh}
        onPrint={handlePrint}
      />

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* PR Summary & Approve Action */}
        <CompareReviewSummary
          request={request}
          awardedProposal={awardedProposal}
          processingId={processingId}
          onApproveWinner={handleApproveWinner}
          onOpenSeparateOrder={() => setShowSeparateOrderModal(true)}
        />

        {/* Overall AI Analysis */}
        <CompareAiAnalysis analysis={overallAnalysis} />

        {/* Full Comparison Matrix Table (Form Komparasi / 比较表) */}
        <ComparisonMatrixTable
          request={request}
          rankings={rankings}
          awardedProposal={awardedProposal}
          overallAnalysis={overallAnalysis}
          companyName={user?.company?.name || request?.company?.name}
          onOpenSeparateOrder={() => setShowSeparateOrderModal(true)}
        />

        {/* Requested Items List */}
        <CompareRequestedItems items={request.items || []} />

        {/* Detailed Vendor Rankings List */}
        <VendorRankingsList
          rankings={rankings}
          recommendedWinnerId={recommendedWinnerId}
        />
      </div>

      {/* Separate Order / Split PO Modal */}
      <SeparateOrderModal
        rfq={request}
        rankings={rankings}
        isOpen={showSeparateOrderModal}
        onClose={() => setShowSeparateOrderModal(false)}
        onSuccess={refresh}
        buyerUserId={user?.id || ""}
      />
    </Layout>
  );
}
