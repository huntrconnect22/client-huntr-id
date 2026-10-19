import { AlertTriangle } from "lucide-react";
import { Link } from "react-router";

interface Props {
  overdueSince: string | null;
  companyPrefix: string;
  canManage: boolean;
  page?: boolean;
  isWms?: boolean;
}

export function SubscriptionOverdueNotice({
  overdueSince,
  companyPrefix,
  canManage,
  page = false,
  isWms = false,
}: Props) {
  const due = overdueSince ? new Date(overdueSince) : null;
  const date =
    due && !Number.isNaN(due.getTime())
      ? due.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <div
      role="alert"
      className={
        page
          ? "mx-auto mt-8 max-w-xl border border-red-500/25 bg-[var(--ui-bg-card)] p-5 text-sm"
          : "border-b border-red-500/25 bg-red-500/10 px-4 py-3 text-sm sm:px-6"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-2.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="m-0 font-semibold text-[var(--ui-text-primary)]">
              {page
                ? isWms
                  ? "WMS sementara tidak tersedia"
                  : "Pembuatan PR sementara tidak tersedia"
                : "Langganan Enterprise telah berakhir"}
            </p>
            <p className="mb-0 mt-1 text-xs leading-relaxed text-[var(--ui-text-secondary)]">
              {date ? `Paket berakhir pada ${date}. ` : ""}Akses WMS dan
              pembuatan PR dibatasi hingga paket diperpanjang.{" "}
              {canManage
                ? "Perbarui paket di pengaturan langganan."
                : "Hubungi owner atau manager perusahaan untuk memperpanjang paket."}
            </p>
          </div>
        </div>
        <Link
          to={`${companyPrefix}/account?tab=subscription`}
          className="shrink-0 self-start rounded bg-red-600 px-3 py-2 text-xs font-semibold !text-white hover:bg-red-700"
        >
          {canManage ? "Perpanjang paket" : "Lihat langganan"}
        </Link>
      </div>
    </div>
  );
}
