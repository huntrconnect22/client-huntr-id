import React from "react";
import Layout from "../../../components/Layout";
import { CheckCircle2 } from "lucide-react";

interface CheckoutSuccessProps {
  revisionRfqId: string | null;
  prTitle: string;
  onGoToRequests: () => void;
}

export function CheckoutSuccess({
  revisionRfqId,
  prTitle,
  onGoToRequests,
}: CheckoutSuccessProps) {
  return (
    <Layout
      title="Request Created"
      subtitle={
        revisionRfqId
          ? "Your revised purchase requisition has been submitted."
          : "Your purchase requisition has been submitted."
      }
    >
      <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-lg font-bold text-[var(--ui-text-primary)]">
          {revisionRfqId
            ? "Revised PR Submitted!"
            : "PR Successfully Submitted!"}
        </h2>
        <p className="text-xs text-[var(--ui-text-muted)] max-w-md">
          Your Purchase Request{" "}
          <strong className="text-[var(--ui-text-primary)]">
            "{prTitle}"
          </strong>{" "}
          is now waiting for manager approval. You will be redirected shortly.
        </p>
        <button
          onClick={onGoToRequests}
          className="mt-2 px-4 py-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all cursor-pointer"
        >
          Go to My Requests
        </button>
      </div>
    </Layout>
  );
}
