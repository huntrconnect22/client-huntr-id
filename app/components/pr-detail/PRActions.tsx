import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { apiPost, getRfq } from "../../lib/api";
import Swal from "sweetalert2";
import { RejectPRModal } from "../RejectPRModal";

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
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (request.status !== "pending_approval" || isBuyerRole || !isManager) {
    return null;
  }

  const handleRejectConfirm = async (reason: string) => {
    await apiPost(`/api/rfqs/${request.id}/reject`, { reason: reason || null });
    Swal.fire({ icon: "success", title: "PR Ditolak", timer: 2000, showConfirmButton: false });
    const updatedResponse = await getRfq(request.id);
    onUpdate(updatedResponse?.rfq ?? updatedResponse?.data ?? updatedResponse);
  };

  const handleApprove = async () => {
    if (!user) return;
    try {
      await apiPost(`/api/rfqs/${request.id}/approve`, {});
      Swal.fire({ icon: "success", title: "Disetujui!", text: "PR diterbitkan sebagai Global RFQ.", timer: 2000, showConfirmButton: false });
      const updatedResponse = await getRfq(request.id);
      onUpdate(updatedResponse?.rfq ?? updatedResponse?.data ?? updatedResponse);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Gagal menyetujui." });
    }
  };

  return (
    <>
      {showRejectModal && (
        <RejectPRModal
          prId={request.id}
          prTitle={request.title}
          onConfirm={handleRejectConfirm}
          onClose={() => setShowRejectModal(false)}
          minLength={5}
        />
      )}
      <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2">
          Manager Actions
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowRejectModal(true)} className={btnReject}>
            <XCircle size={13} /> Reject
          </button>
          <button type="button" onClick={handleApprove} className={btnApprove}>
            <CheckCircle2 size={13} /> Approve & Publish
          </button>
        </div>
      </div>
    </>
  );
}
