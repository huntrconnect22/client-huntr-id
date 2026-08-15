import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import Layout from "../components/Layout";
import { getRfq, apiGet, apiPost } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import {
  ArrowLeft, Package, Loader2, AlertCircle, RefreshCw, BarChart3,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAppShell } from "../routes/_app";
import { NegotiationModal } from "../components/pr-detail/NegotiationModal";
import { PRStatusCard } from "../components/pr-detail/PRStatusCard";
import { PRActions } from "../components/pr-detail/PRActions";
import { PRSummary } from "../components/pr-detail/PRSummary";
import { ProposalRankings } from "../components/pr-detail/ProposalRankings";

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

export default function MyPurchaseRequisitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, company: activeCompany } = useAppShell();

  const [request, setRequest] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNegModal, setShowNegModal] = useState(false);
  const [selectedNegProposal, setSelectedNegProposal] = useState<any>(null);
  const [awardingProposal, setAwardingProposal] = useState<string | number | null>(null);

  const fetchRankings = useCallback(async (rfqId: string | number) => {
    try {
      const response = await apiGet(`/api/rfqs/${rfqId}/rankings`);
      setRankings(response.rankings || (Array.isArray(response) ? response : []));
    } catch {
      setRankings([]);
    }
  }, []);

  const loadRequest = useCallback(async (rfqId: string) => {
    const response = await getRfq(rfqId);
    const rfq = response?.rfq ?? response?.data ?? response;
    setRequest(rfq);
    if (rfq?.id) fetchRankings(rfq.id);
    return rfq;
  }, [fetchRankings]);

  useEffect(() => {
    if (!id || id === "NaN" || id === "undefined") {
      setError("Invalid Purchase Requisition ID.");
      setLoading(false);
      return;
    }

    loadRequest(id)
      .then(() => setError(null))
      .catch(() => setError("Unable to load PR detail. Please try again."))
      .finally(() => setLoading(false));
  }, [id, loadRequest]);

  const handleAwardWinner = useCallback(
    async (proposalId: string | number, rfqId: string | number) => {
      if (!user) return;
      setAwardingProposal(proposalId);
      try {
        await apiPost(`/api/proposals/${proposalId}/award`, { rfq_id: rfqId, user_id: user.id });
        Swal.fire({
          icon: "success",
          title: "Winner Awarded!",
          text: "Notification sent to manager for final approval.",
          timer: 2000,
          showConfirmButton: false,
        });
        if (id) {
          await loadRequest(id);
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error!", text: "Failed to award winner." });
      } finally {
        setAwardingProposal(null);
      }
    },
    [user, id, loadRequest]
  );

  const handleRefresh = () => {
    if (!id) return;
    setLoading(true);
    loadRequest(id).finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <Layout title="Purchase Request" subtitle="Loading...">
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout title="Purchase Request" subtitle="Error">
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm font-semibold text-[var(--ui-text-primary)]">{error || "Request not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/my-pr")}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
          >
            Back to My PRs
          </button>
        </div>
      </Layout>
    );
  }

  const prShort = String(request.id).substring(0, 8).toUpperCase();
  const items = request.items || [];
  const lineItems = items.length;
  const totalQty = items.reduce((s: number, i: any) => s + (i.qty || 0), 0);
  const estimatedTotal = items.reduce((s: number, i: any) => {
    const price = i.catalogue?.estimated_price || i.estimated_price || 0;
    return s + price * (i.qty || 0);
  }, 0);
  const proposalCount = rankings.length;

  return (
    <Layout title={`PR #${prShort}`} subtitle={request.title}>
      <div className="w-full flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/my-pr")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors"
          >
            <ArrowLeft size={14} /> My PRs
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          {request.status === "active" && (
            <button
              type="button"
              onClick={() => navigate(`/rfq/${request.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors ml-auto"
            >
              Open RFQ View
            </button>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatCell label="Line Items" value={String(lineItems)} />
          <StatCell label="Total Qty" value={`${totalQty} units`} />
          <StatCell label="Est. Total" value={`Rp ${estimatedTotal.toLocaleString("id-ID")}`} accent />
          <StatCell label="Proposals" value={request.status === "active" ? String(proposalCount) : "—"} />
          <StatCell
            label="Created"
            value={new Date(request.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          />
          <StatCell label="Requester" value={request.user?.name || "Unknown"} />
        </div>

        {/* Description */}
        {request.description && (
          <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">Description</div>
            <p className="text-sm text-[var(--ui-text-primary)] leading-relaxed">{request.description}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">
          {/* Main column */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Items table */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-orange-500" />
                <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
                  Requested Items
                  <span className="text-[var(--ui-text-muted)] font-normal ml-1">({lineItems})</span>
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--ui-text-muted)] rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                  No items in this PR.
                </div>
              ) : (
                <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-10">#</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Product</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">Qty</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[100px]">Unit Est.</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[100px]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ui-border)]">
                      {items.map((item: any, index: number) => {
                        const cat = item.catalogue;
                        const unitPrice = item.estimated_price || cat?.estimated_price || 0;
                        const lineTotal = unitPrice * (item.qty || 0);
                        return (
                          <tr key={index} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                            <td className="px-3 py-2 text-xs text-[var(--ui-text-muted)]">{index + 1}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-center shrink-0 overflow-hidden">
                                  {cat?.image_path ? (
                                    <img
                                      src={getAssetUrl(cat.image_path)}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                  ) : (
                                    <Package size={12} className="text-[var(--ui-text-muted)] opacity-40" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  {cat?.category && (
                                    <div className="text-[10px] font-bold uppercase text-orange-400 truncate">{cat.category}</div>
                                  )}
                                  <div className="text-xs font-semibold text-[var(--ui-text-primary)] truncate">
                                    {cat?.name || "Unknown Item"}
                                  </div>
                                  {cat?.item_code && (
                                    <div className="text-[10px] text-[var(--ui-text-muted)]">{cat.item_code}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] whitespace-nowrap">
                              {item.qty} {cat?.uom || "pcs"}
                            </td>
                            <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)] whitespace-nowrap">
                              Rp {Number(unitPrice).toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-2 text-xs font-bold text-orange-400 text-right whitespace-nowrap">
                              Rp {Number(lineTotal).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                        <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-[var(--ui-text-muted)]">
                          {totalQty} units across {lineItems} SKU{lineItems !== 1 ? "s" : ""}
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-[var(--ui-text-primary)] text-right">
                          Rp {estimatedTotal.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            {/* Proposals */}
            {request.status === "active" && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-orange-500" />
                  <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
                    Vendor Proposals
                    <span className="text-[var(--ui-text-muted)] font-normal ml-1">({proposalCount})</span>
                  </h2>
                </div>
                <ProposalRankings
                  rankings={rankings}
                  onAwardWinner={handleAwardWinner}
                  onOpenNegotiation={(p) => {
                    setSelectedNegProposal(p);
                    setShowNegModal(true);
                  }}
                  awardingProposal={awardingProposal}
                  requestId={request.id}
                />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-2">
            <PRStatusCard status={request.status} />
            <PRSummary request={request} />
            <PRActions
              request={request}
              user={user}
              activeCompany={activeCompany}
              onUpdate={setRequest}
            />
          </aside>
        </div>
      </div>

      {showNegModal && selectedNegProposal && (
        <NegotiationModal
          proposal={selectedNegProposal}
          onClose={() => {
            setShowNegModal(false);
            setSelectedNegProposal(null);
          }}
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
