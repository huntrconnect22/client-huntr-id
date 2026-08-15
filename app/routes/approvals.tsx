import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import {
  CheckCircle2, XCircle, Clock, Package, Calendar, User,
  Loader2, Trophy, Building2, DollarSign, FileText, ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAppShell } from "../routes/_app";
import Swal from "sweetalert2";

const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors disabled:opacity-50";

const btnReject =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/25 bg-[var(--ui-bg-input)] text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50";

const btnApprove =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/25 bg-[var(--ui-bg-input)] text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50";

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50";

function SectionHeader({
  icon: Icon,
  iconClass,
  title,
  count,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className={iconClass} />
      <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">{title}</h2>
      {typeof count === "number" && (
        <span className="text-xs text-[var(--ui-text-muted)]">({count})</span>
      )}
    </div>
  );
}

function EmptyBlock({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
      <Icon size={24} className="text-[var(--ui-text-muted)] opacity-25" />
      <p className="text-xs text-[var(--ui-text-muted)]">{message}</p>
    </div>
  );
}

export default function Approvals() {
  const navigate = useNavigate();
  const { user, company: activeCompany } = useAppShell();
  const [requests, setRequests] = useState<any[]>([]);
  const [awardedProposals, setAwardedProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isOwner = activeCompany?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const isBuyerRole = user?.role === "buyer";
  const isBuyerComp = activeCompany?.type === "buyer";
  const canAct = isManager && !isBuyerRole;

  useEffect(() => {
    if (!user || !activeCompany) return;

    if (isBuyerRole || !isManager || !isBuyerComp) {
      navigate("/");
      return;
    }

    fetchPendingRequests(activeCompany.id);
    fetchAwardedProposals(activeCompany.id);
  }, [user, activeCompany, isManager, isBuyerRole, isBuyerComp, navigate]);

  const fetchAwardedProposals = async (companyId: string) => {
    try {
      const res = await apiGet(`/api/proposals/manager/awaiting-approval?company_id=${companyId}`);
      setAwardedProposals(res.proposals || []);
    } catch (err) {
      console.error("Failed to fetch awarded proposals", err);
    }
  };

  const fetchPendingRequests = async (companyId: string) => {
    try {
      const res = await apiGet(`/api/rfqs?status=pending_approval&company_id=${companyId}`);
      setRequests(res || []);
    } catch (err) {
      console.error("Failed to fetch pending PRs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWinner = async (proposalId: string) => {
    if (!user) return;
    setProcessingId(proposalId);
    try {
      await apiPost(`/api/proposals/${proposalId}/approve`, { user_id: user.id });
      setAwardedProposals((prev) => prev.filter((p) => p.id !== proposalId));
    } catch (err) {
      console.error("Failed to approve winner", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (rfqId: string) => {
    if (!user) return;
    setProcessingId(rfqId);
    try {
      await apiPost(`/api/rfqs/${rfqId}/approve`, {});
      setRequests((prev) => prev.filter((r) => r.id !== rfqId));
      Swal.fire({ icon: "success", title: "Success!", text: "PR has been approved and published." });
    } catch (err) {
      console.error("Failed to approve PR", err);
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to approve PR. Check console for details." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (rfqId: string) => {
    if (!user) return;

    const { value: reason } = await Swal.fire({
      title: "Reject Purchase Request",
      input: "textarea",
      inputLabel: "Reason for rejection",
      inputPlaceholder: "Please provide a reason for rejecting this PR...",
      inputAttributes: { "aria-label": "Type your rejection reason here" },
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value) return "You need to provide a reason for rejection!";
        if (value.length < 10) return "Reason must be at least 10 characters long";
      },
    });

    if (!reason) return;

    setProcessingId(rfqId);
    try {
      await apiPost(`/api/rfqs/${rfqId}/reject`, { reason });
      setRequests((prev) => prev.filter((r) => r.id !== rfqId));
      Swal.fire({ icon: "success", title: "Rejected!", text: "PR has been rejected." });
    } catch (err) {
      console.error("Failed to reject PR", err);
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to reject PR. Check console for details." });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Layout title="Manager Approvals" subtitle="Review purchase requisitions and awarded winners.">
      <div className="w-full flex flex-col gap-6">

        {/* Pending PRs */}
        <section>
          <SectionHeader
            icon={Clock}
            iconClass="text-orange-500"
            title="Pending Purchase Requisitions"
            count={requests.length}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin text-orange-500" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyBlock icon={CheckCircle2} message="No PRs awaiting approval." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[100px]">PR ID</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Title</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[130px]">Requester</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[70px]">Items</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">Date</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">File</th>
                      {canAct && (
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[220px]">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ui-border)]">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                            #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-[var(--ui-text-primary)] text-sm line-clamp-1">{req.title}</div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--ui-text-secondary)]">
                            <User size={12} className="text-[var(--ui-text-muted)]" />
                            {req.user?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--ui-text-secondary)]">
                            <Package size={12} className="text-[var(--ui-text-muted)]" />
                            {req.items?.length || 0}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[var(--ui-text-muted)]">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {(req.document_path || req.document_url) ? (
                            <a
                              href={req.document_url || getAssetUrl(req.document_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline"
                            >
                              <FileText size={12} /> View
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--ui-text-muted)]">—</span>
                          )}
                        </td>
                        {canAct && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button type="button" onClick={() => navigate(`/my-pr/${req.id}`)} className={btnSecondary}>
                                <Package size={12} /> Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(req.id)}
                                disabled={processingId === req.id}
                                className={btnReject}
                              >
                                <XCircle size={12} /> Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(req.id)}
                                disabled={processingId === req.id}
                                className={btnApprove}
                              >
                                {processingId === req.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={12} />
                                )}
                                Approve
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden flex flex-col gap-2">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                          #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                        </span>
                        <p className="text-sm font-semibold text-[var(--ui-text-primary)] mt-1.5 leading-snug">{req.title}</p>
                      </div>
                      <span className="text-[10px] text-[var(--ui-text-muted)] shrink-0">{formatDate(req.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <User size={11} /> {req.user?.name || "Unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Package size={11} /> {req.items?.length || 0} items
                      </span>
                      {(req.document_path || req.document_url) && (
                        <a
                          href={req.document_url || getAssetUrl(req.document_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-orange-500 font-semibold"
                        >
                          <FileText size={11} /> Attachment
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button type="button" onClick={() => navigate(`/my-pr/${req.id}`)} className={btnSecondary}>
                        Details
                      </button>
                      {canAct && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            disabled={processingId === req.id}
                            className={btnReject}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                            className={btnApprove}
                          >
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Awarded winners */}
        <section>
          <SectionHeader
            icon={Trophy}
            iconClass="text-emerald-500"
            title="Awarded Winners Awaiting PO"
            count={awardedProposals.length}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin text-orange-500" />
            </div>
          ) : awardedProposals.length === 0 ? (
            <EmptyBlock icon={Trophy} message="No winners awaiting PO approval." />
          ) : (
            <>
              <div className="hidden md:block rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">RFQ</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[140px]">Vendor</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[120px]">Amount</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[120px]">Terms</th>
                      {canAct && (
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] min-w-[240px]">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ui-border)]">
                    {awardedProposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            AWARDED
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-[var(--ui-text-primary)] text-sm line-clamp-1">{proposal.rfq_title}</div>
                          <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">{formatDate(proposal.awarded_at)}</div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--ui-text-secondary)]">
                            <Building2 size={12} className="text-[var(--ui-text-muted)]" />
                            {proposal.company_name}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-[var(--ui-text-brand)]">
                          IDR {Number(proposal.price_offer).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[var(--ui-text-secondary)]">
                          {proposal.delivery_days}d · {proposal.payment_term}
                        </td>
                        {canAct && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => navigate(`/compare-review/${proposal.rfq_id}`)}
                                className={btnSecondary}
                              >
                                <ExternalLink size={12} /> Compare
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/rfq/${proposal.rfq_id}`)}
                                className={btnSecondary}
                              >
                                <Package size={12} /> View PR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveWinner(proposal.id)}
                                disabled={processingId === proposal.id}
                                className={btnPrimary}
                              >
                                {processingId === proposal.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={12} />
                                )}
                                Generate PO
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col gap-2">
                {awardedProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          AWARDED
                        </span>
                        <p className="text-sm font-semibold text-[var(--ui-text-primary)] mt-1.5 leading-snug">{proposal.rfq_title}</p>
                      </div>
                      <span className="text-[10px] text-[var(--ui-text-muted)] shrink-0">{formatDate(proposal.awarded_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={11} /> {proposal.company_name}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--ui-text-brand)]">
                        <DollarSign size={11} /> IDR {Number(proposal.price_offer).toLocaleString("id-ID")}
                      </span>
                      <span>{proposal.delivery_days}d · {proposal.payment_term}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/compare-review/${proposal.rfq_id}`)}
                        className={btnSecondary}
                      >
                        Compare
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/rfq/${proposal.rfq_id}`)}
                        className={btnSecondary}
                      >
                        View PR
                      </button>
                      {canAct && (
                        <button
                          type="button"
                          onClick={() => handleApproveWinner(proposal.id)}
                          disabled={processingId === proposal.id}
                          className={btnPrimary}
                        >
                          Generate PO
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
