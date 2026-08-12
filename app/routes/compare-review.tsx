import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Layout from "../components/Layout";
import { getRfq, apiGet, apiPost } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import {
  ArrowLeft,
  Calendar,
  Package,
  MapPin,
  Loader2,
  Building2,
  Info,
  AlertCircle,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  Trophy,
  DollarSign,
  Clock,
  ShieldCheck,
  Lightbulb,
  FileText
} from "lucide-react";
import Swal from "sweetalert2";
import { useAppShell } from "../routes/_app";

// Import our ProposalRankings component
import { ProposalRankings } from "../components/pr-detail/ProposalRankings";

export default function CompareReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, company: activeCompany } = useAppShell();

  // State management
  const [request, setRequest] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [overallAnalysis, setOverallAnalysis] = useState<string>("");
  const [recommendedWinnerId, setRecommendedWinnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Data fetching for AI rankings
  const fetchAiRankings = React.useCallback(async (rfqId: string) => {
    try {
      const response = await apiPost("/api/ai/rank-proposals", { rfq_id: rfqId });
      if (response.success && response.data) {
        setRankings(response.data.rankings || []);
        setOverallAnalysis(response.data.overall_analysis || "");
        setRecommendedWinnerId(response.data.recommended_winner_id || null);
        return;
      }
    } catch (err) {
      console.warn("AI rankings failed, falling back to simple rankings", err);
    }

    // Fallback to simple rankings if AI fails
    try {
      const response = await apiGet(`/api/proposals/${rfqId}/rankings`);
      setRankings(response.rankings || []);
    } catch (err2) {
      console.error("Failed to fetch any rankings", err2);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (!id || id === "NaN" || id === "undefined") {
      setError("Invalid Purchase Requisition ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getRfq(id),
      fetchAiRankings(id)
    ])
      .then(([response]) => {
        const rfq = response?.rfq ?? response?.data ?? response;
        setRequest(rfq);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load PR detail. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, fetchAiRankings]);

  // Find the awarded proposal in the rankings
  const awardedProposal = rankings.find((r: any) => {
    const p = r.proposal;
    return p?.winner_status === "awarded" || p?.winner_status === "approved" || r.proposal_id === recommendedWinnerId;
  });

  const handleApproveWinner = React.useCallback(async (proposalId: string | number) => {
    if (!user) return;
    setProcessingId(String(proposalId));
    try {
      await apiPost(`/api/proposals/${proposalId}/approve`, { user_id: user.id });
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Winner approved! PO has been generated.',
      });
      // Navigate back to approvals page after success
      navigate("/approvals");
    } catch (err) {
      console.error("Failed to approve winner", err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: "Failed to approve winner. Check console for details."
      });
    } finally {
      setProcessingId(null);
    }
  }, [user, navigate]);

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
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 100,
          textAlign: "center"
        }}>
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
              cursor: "pointer"
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
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 32
      }}>
        <button
          onClick={() => navigate("/approvals")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            color: "var(--ui-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          aria-label="Back to Approvals"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--ui-text-brand)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4
          }}>
            Tender Winner Review
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 900,
            color: "var(--ui-text-primary)"
          }}>
            {request.title}
          </h1>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--ui-border-input)",
            color: "var(--ui-text-secondary)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 32
      }}>
        {/* PR Summary & Approve Button */}
        <div style={{
          padding: 24,
          borderRadius: 24,
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 32,
            flexWrap: "wrap"
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Deadline
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
                <Calendar size={16} style={{ display: "inline", marginRight: 6 }} />
                {new Date(request.deadline).toLocaleDateString()}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Delivery Location
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
                <MapPin size={16} style={{ display: "inline", marginRight: 6 }} />
                {request.delivery_location}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Items
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
                <Package size={16} style={{ display: "inline", marginRight: 6 }} />
                {request.items?.length || 0} Products
              </div>
            </div>

            {awardedProposal && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() => {
                    const proposalId = awardedProposal.proposal?.id || awardedProposal.proposal_id;
                    if (proposalId) handleApproveWinner(proposalId);
                  }}
                  disabled={processingId === String(awardedProposal.proposal?.id || awardedProposal.proposal_id)}
                  style={{
                    padding: "12px 28px",
                    borderRadius: 12,
                    background: "var(--huntr-orange)",
                    border: "none",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: processingId === String(awardedProposal.proposal?.id || awardedProposal.proposal_id) ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(249,115,22,0.2)"
                  }}
                >
                  {processingId === String(awardedProposal.proposal?.id || awardedProposal.proposal_id) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve & Generate PO
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overall AI Analysis */}
        {overallAnalysis && (
          <div style={{
            padding: 24,
            borderRadius: 24,
            background: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.2)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12
            }}>
              <BarChart3 size={24} color="#22c55e" />
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: "#22c55e"
              }}>
                Overall AI Analysis
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ui-text-primary)"
            }}>
              {overallAnalysis}
            </p>
          </div>
        )}

        {/* Items List */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)"
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#9ca3af",
            marginBottom: 16
          }}>
            Requested Items ({request.items?.length || 0})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {request.items?.map((item: any, index: number) => {
              const catalogue = item.catalogue;
              return (
                <div
                  key={index}
                  style={{
                    padding: 16,
                    background: "var(--ui-bg-input)",
                    borderRadius: 12,
                    border: "1px solid var(--ui-border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: catalogue?.image_path ? "transparent" : "var(--ui-bg-card)",
                      border: "1px solid var(--ui-border)"
                    }}>
                      {catalogue?.image_path ? (
                        <img
                          src={getAssetUrl(catalogue.image_url || catalogue.image_path)}
                          alt={catalogue?.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                          }}
                        />
                      ) : (
                        <Package size={22} className="text-[var(--ui-text-muted)] opacity-40" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {catalogue?.category && (
                        <div style={{
                          fontSize: 11,
                          color: "#f59e0b",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 4
                        }}>
                          {catalogue.category}
                        </div>
                      )}
                      <div style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--ui-text-primary)",
                        marginBottom: 2
                      }}>
                        {catalogue?.name || "Unknown Item"}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: "var(--ui-text-muted)",
                        marginBottom: 4
                      }}>
                        Qty: {item.qty} {catalogue?.uom || "pcs"}
                      </div>
                      {catalogue?.specifications && (
                        <div style={{
                          fontSize: 11,
                          color: "var(--ui-text-muted)",
                          lineHeight: 1.4,
                          maxWidth: 400,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {catalogue.specifications}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#f97316"
                    }}>
                      Rp {Number(item.estimated_price || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>per {catalogue?.uom || "pcs"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Rankings with Analysis */}
        {rankings.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                padding: 10,
                borderRadius: 12,
                background: "rgba(249,115,22,0.1)",
                color: "var(--huntr-orange)"
              }}>
                <Trophy size={20} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "var(--ui-text-primary)"
              }}>
                Vendor Proposals & Detailed Analysis
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {rankings.map((rankData: any, index: number) => {
                const proposal = rankData.proposal || {};
                const companyName = proposal.company?.name || rankData.vendor || "Unknown Vendor";
                const isWinner = rankData.is_winner || proposal.winner_status === "awarded" || proposal.winner_status === "approved" || rankData.proposal_id === recommendedWinnerId;

                return (
                  <div
                    key={rankData.proposal_id || proposal.id || index}
                    style={{
                      background: "var(--ui-bg-card)",
                      border: isWinner ? "2px solid #22c55e" : "1px solid var(--ui-border)",
                      borderRadius: 20,
                      padding: 24
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap"
                    }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: isWinner ? "rgba(34,197,94,0.1)" : "var(--ui-bg-badge)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isWinner ? "#22c55e" : "var(--ui-text-brand)",
                          fontSize: 20,
                          fontWeight: 900
                        }}>
                          {isWinner ? <Trophy size={24} /> : `#${rankData.rank}`}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)", margin: 0 }}>
                              {companyName}
                            </h4>
                            {isWinner && (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "#22c55e",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 800
                              }}>
                                WINNER
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",
                            fontSize: 13,
                            color: "var(--ui-text-secondary)",
                            marginTop: 8
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <DollarSign size={16} />
                              Rp {Number(proposal.price_offer || 0).toLocaleString('id-ID')}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock size={16} />
                              {proposal.delivery_days} days
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <ShieldCheck size={16} />
                              {proposal.warranty_months} months warranty
                            </div>
                          </div>
                          {(proposal.document_path || proposal.document_url) && (
                            <div style={{ marginTop: 12 }}>
                              <a
                                href={proposal.document_url || getAssetUrl(proposal.document_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color: isWinner ? "#22c55e" : "#f97316",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  textDecoration: "none"
                                }}
                              >
                                <FileText size={14} /> View Vendor Document
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score breakdown (if available) */}
                      {rankData.total_score && (
                        <div style={{
                          textAlign: "right",
                          background: isWinner ? "rgba(34,197,94,0.05)" : "var(--ui-bg-input)",
                          padding: "12px 20px",
                          borderRadius: 12
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                            Total Score
                          </div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: isWinner ? "#22c55e" : "var(--ui-text-primary)" }}>
                            {rankData.total_score}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed Analysis: Strengths, Weaknesses, Recommendation */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 16,
                      marginTop: 20
                    }}>
                      {rankData.strengths && rankData.strengths.length > 0 && (
                        <div style={{
                          background: "rgba(34,197,94,0.05)",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid rgba(34,197,94,0.2)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} /> Strengths
                          </div>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            {rankData.strengths.map((strength: string, i: number) => (
                              <li key={i} style={{ fontSize: 13, color: "var(--ui-text-primary)" }}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rankData.weaknesses && rankData.weaknesses.length > 0 && (
                        <div style={{
                          background: "rgba(239,68,68,0.05)",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid rgba(239,68,68,0.2)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                            <AlertCircle size={14} /> Weaknesses
                          </div>
                          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            {rankData.weaknesses.map((weakness: string, i: number) => (
                              <li key={i} style={{ fontSize: 13, color: "var(--ui-text-primary)" }}>• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rankData.recommendation && (
                        <div style={{
                          background: "var(--ui-bg-input)",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid var(--ui-border)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ui-text-brand)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                            <Lightbulb size={14} /> Recommendation
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-primary)" }}>
                            {rankData.recommendation}
                          </p>
                        </div>
                      )}

                      {rankData.detailed_reason?.summary && (
                        <div style={{
                          background: "var(--ui-bg-input)",
                          padding: 16,
                          borderRadius: 12,
                          border: "1px solid var(--ui-border)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ui-text-brand)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                            <BarChart3 size={14} /> Detailed Reason
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-primary)" }}>
                            {rankData.detailed_reason.summary}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Score breakdown */}
                    {rankData.score_breakdown && (
                      <div style={{
                        marginTop: 20,
                        padding: 16,
                        background: "var(--ui-bg-input)",
                        borderRadius: 12,
                        border: "1px solid var(--ui-border)"
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                          Score Breakdown
                        </div>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: 12
                        }}>
                          {rankData.score_breakdown.price_score !== undefined && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Price</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{rankData.score_breakdown.price_score}</div>
                            </div>
                          )}
                          {rankData.score_breakdown.delivery_score !== undefined && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Delivery</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6" }}>{rankData.score_breakdown.delivery_score}</div>
                            </div>
                          )}
                          {rankData.score_breakdown.warranty_score !== undefined && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Warranty</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: "#8b5cf6" }}>{rankData.score_breakdown.warranty_score}</div>
                            </div>
                          )}
                          {rankData.score_breakdown.completeness_score !== undefined && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Completeness</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{rankData.score_breakdown.completeness_score}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
