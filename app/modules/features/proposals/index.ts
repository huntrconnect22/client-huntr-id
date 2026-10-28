// Hooks
export { useProposalForm, useSubmitProposal } from "./hooks";

// Services
export { proposalService } from "./services";
export type { ProposalSubmitRequest, RfqItem, OpenRfq } from "./services";

// Re-export hooks/services index for barrel imports
export * from "./hooks";
export * from "./services";


