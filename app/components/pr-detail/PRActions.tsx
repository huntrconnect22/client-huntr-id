import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { apiPost, getRfq } from "../../lib/api";
import Swal from "sweetalert2";

const btnReject =
  "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-red-500/25 bg-[var(--ui-bg-input)] text-red-500 hover:bg-red-500/10 transition-colors";

const btnApprove =
  "flex-[2] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors";

interface PRActionsProps {
  request: any;
  user: any;
  activeCompany: any;
  onUpdate: (updatedRequest: any) => void;
}

export function PRActions({ request, user, activeCompany, onUpdate }: PRActionsProps) {
  const isOwner = activeCompany?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const isBuyerRole = user?.role === "buyer";

  if (request.status !== "pending_approval" || isBuyerRole || !isManager) {
    return null;
  }

  const handleReject = async () => {
    if (!user) {
      Swal.fire({ icon: "error", title: "Authentication Error", text: "Please log in again." });
      return;
    }

    const { value: reason, isConfirmed } = await Swal.fire({
      title: "Reject Purchase Request",
      html: `
        <p style="margin-bottom: 12px; color: #6b7280; font-size: 13px;">Reason for rejection:</p>
        <textarea id="rejection-reason" class="swal2-textarea" placeholder="Enter reason..." style="min-height: 72px; width: 100%;"></textarea>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject PR",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const textarea = document.getElementById("rejection-reason") as HTMLTextAreaElement;
        return textarea?.value || "";
      },
    });

    if (!isConfirmed) return;

    try {
      await apiPost(`/api/rfqs/${request.id}/reject`, { reason: reason || null });
      Swal.fire({ icon: "success", title: "PR Rejected", timer: 2000, showConfirmButton: false });
      const updatedResponse = await getRfq(request.id);
      onUpdate(updatedResponse?.rfq ?? updatedResponse?.data ?? updatedResponse);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to reject PR." });
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    try {
      await apiPost(`/api/rfqs/${request.id}/approve`, {});
      Swal.fire({ icon: "success", title: "Approved!", text: "PR published as Global RFQ.", timer: 2000, showConfirmButton: false });
      const updatedResponse = await getRfq(request.id);
      onUpdate(updatedResponse?.rfq ?? updatedResponse?.data ?? updatedResponse);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to approve." });
    }
  };

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2">
        Manager Actions
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleReject} className={btnReject}>
          <XCircle size={13} /> Reject
        </button>
        <button type="button" onClick={handleApprove} className={btnApprove}>
          <CheckCircle2 size={13} /> Approve & Publish
        </button>
      </div>
    </div>
  );
}
