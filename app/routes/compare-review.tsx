import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import Layout from "../components/Layout";
import { apiPost } from "../lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAppShell } from "../routes/_app";
import { useCompareReviewData } from "../features/rfq/hooks/useCompareReviewData";
import {
  CompareReviewHeader,
  CompareReviewSummary,
  CompareRequestedItems,
  CompareAiAnalysis,
  VendorRankingsList,
} from "../components/compare-review";

export default function CompareReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppShell();
  const [processingId, setProcessingId] = useState<string | null>(null);

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
          <button
            onClick={() => navigate("/approvals")}
            style={{
              marginTop: 20,
              padding: "12px 20px",
              borderRadius: 12,
              background: "var(--huntr-gradient)",
              border: "none",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Back to Approvals
          </button>
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
      <CompareReviewHeader title={request.title} onRefresh={refresh} />

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* PR Summary & Approve Action */}
        <CompareReviewSummary
          request={request}
          awardedProposal={awardedProposal}
          processingId={processingId}
          onApproveWinner={handleApproveWinner}
        />

        {/* Overall AI Analysis */}
        <CompareAiAnalysis analysis={overallAnalysis} />

        {/* Requested Items List */}
        <CompareRequestedItems items={request.items || []} />

        {/* Detailed Vendor Rankings List */}
        <VendorRankingsList
          rankings={rankings}
          recommendedWinnerId={recommendedWinnerId}
        />
      </div>
    </Layout>
  );
}
