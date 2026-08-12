import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { 
  Trophy, TrendingUp, AlertCircle, Loader2, 
  Calendar, Package, CheckCircle2,
  Star, Users, Award, Clock
} from "lucide-react";

/**
 * MyRank Page
 * Displays vendor's competitive standing and statistics across all participated tenders.
 */
export default function MyRank() {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [awardingProposal, setAwardingProposal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isBuyer = activeCompany?.type === 'buyer';

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
      fetchRankings(comp.id);
    }
  }, []);

  // Company slug redirect check
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/my-rank`, { replace: true });
    }
  }, [activeCompany]);

  const fetchRankings = async (companyId: string) => {
    setLoading(true);
    try {
      const result = await apiGet(`/api/proposals/my-rank?company_id=${companyId}`);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch rankings");
    } finally {
      setLoading(false);
    }
  };

  const handleAwardWinner = async (proposalId: string, rfqId: string) => {
    const userSession = localStorage.getItem("user_session");
    const user = userSession ? JSON.parse(userSession) : null;

    setAwardingProposal(proposalId);
    setError(null);
    try {
      await apiPost(`/api/proposals/${proposalId}/award`, {
        proposal_id: proposalId,
        rfq_id: rfqId,
        user_id: user?.id,
      });
      setSuccessMessage("✓ Proposal awarded! Sent to manager for approval.");
      
      if (activeCompany) {
        setTimeout(() => {
          fetchRankings(activeCompany.id);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to award proposal");
    } finally {
      setAwardingProposal(null);
    }
  };

  if (loading) {
    return (
      <Layout title="My Rank" subtitle="Analyzing your competitive performance...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="animate-spin text-orange-500" size={28} />
          <span className="text-xs text-[var(--ui-text-muted)]">Fetching ranking data...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Rank" subtitle="Review your standing and win rate across all participated tenders.">
      <div className="w-full space-y-6">
        
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <span className="text-xl font-bold text-orange-500">{data?.total_wins || 0}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wider">Total Wins</p>
              <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">Tenders with lowest offer</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] flex items-center justify-center">
                <Package size={18} />
              </div>
              <span className="text-xl font-bold text-[var(--ui-text-primary)]">{data?.total_participations || 0}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wider">Participations</p>
              <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">Total unique RFQs bid</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <span className="text-xl font-bold text-emerald-500">
                {data?.total_participations ? `${((data.total_wins / data.total_participations) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wider">Win Rate</p>
              <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">Success ratio on bids</p>
            </div>
          </div>
        </div>

        {/* Feedback toasts */}
        {error && (
          <div className="flex items-center gap-2 p-3 px-4 rounded-xl border border-red-500/20 bg-red-500/8 text-red-500 text-xs font-semibold">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 px-4 rounded-xl border border-emerald-500/20 bg-emerald-500/8 text-emerald-500 text-xs font-semibold">
            <CheckCircle2 size={14} /> {successMessage}
          </div>
        )}

        {/* Detailed Rankings List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">Competitive Standings</h2>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">Your rank based on the lowest price offered for each tender.</p>
            </div>
          </div>

          {!data?.rankings || data.rankings.length === 0 ? (
            <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
              <Star size={36} className="text-[var(--ui-text-muted)] opacity-20" />
              <p className="text-sm font-semibold text-[var(--ui-text-primary)]">No Ranking Data Yet</p>
              <p className="text-xs text-[var(--ui-text-muted)]">Submit your first proposal to start tracking your rank.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.rankings.map((item: any, idx: number) => (
                <div key={idx} className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.is_winner ? "bg-orange-500 text-white" : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
                    }`}>
                      {item.is_winner ? <Trophy size={14} /> : `#${item.my_rank}`}
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block truncate">
                        {item.buyer_name}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] truncate">{item.rfq_title}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--ui-text-muted)]">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(item.submitted_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {item.total_participants} Vendors</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] block">Your Offer</span>
                      <span className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)]">Rp {Number(item.my_price).toLocaleString("id-ID")}</span>
                    </div>
                    
                    <div className="text-right min-w-[90px]">
                      {item.is_winner ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 size={11} /> Winner
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[var(--ui-text-muted)]">
                          Rank #{item.my_rank}
                        </span>
                      )}
                    </div>

                    {/* Award Button - Buyer only */}
                    {isBuyer && !item.is_winner && item.winner_status !== 'awarded' && (
                      <button
                        onClick={() => handleAwardWinner(item.proposal_id, item.rfq_id)}
                        disabled={awardingProposal === item.proposal_id}
                        style={{ color: 'white' }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold transition-all disabled:opacity-60"
                      >
                        {awardingProposal === item.proposal_id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Awarding...
                          </>
                        ) : (
                          <>
                            <Award size={12} /> Award
                          </>
                        )}
                      </button>
                    )}

                    {item.winner_status === 'awarded' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 uppercase">
                        <Clock size={11} /> Pending Approval
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
