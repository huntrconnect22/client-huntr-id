import { getFullApiUrl } from "../../lib/api";

export type SignatureMeta = {
  name?: string;
  position?: string;
  signed_at?: string;
};

export const buildSignatureQrPayload = (
  docType: 'bast' | 'do',
  docId: string,
  role: 'handed-by' | 'received-by',
  meta?: SignatureMeta
) => {
  const verifyPath = docType === 'do'
    ? `/api/do/${docId}/print`
    : `/api/basts/${docId}/pdf`;

  return JSON.stringify({
    platform: 'huntr.id',
    doc_type: docType,
    doc_id: docId,
    role,
    signer: meta?.name,
    signed_at: meta?.signed_at,
    verify_url: getFullApiUrl(verifyPath),
  });
};


