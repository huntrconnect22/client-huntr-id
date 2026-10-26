import { getFullApiUrl } from "./api";
import { SessionManager } from "./session";

/** Opens a protected printable document without exposing an unauthenticated URL. */
export async function openAuthenticatedDocument(path: string): Promise<void> {
  const token = SessionManager.getToken();
  if (!token) throw new Error("Sesi login tidak tersedia. Silakan masuk kembali.");

  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;

  try {
    const response = await fetch(getFullApiUrl(path), {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/html,application/pdf" },
    });
    if (!response.ok) throw new Error("Dokumen tidak dapat dibuka.");

    const url = URL.createObjectURL(await response.blob());
    if (tab) tab.location.href = url;
    else window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}
