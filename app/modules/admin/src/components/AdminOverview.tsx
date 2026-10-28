import { useEffect, useState } from "react";
import { ArrowRight, Building2, CreditCard, Package } from "lucide-react";
import {
  getEnterpriseMonitoring,
  type EnterpriseMonitoring,
} from "../../lib/api/admin-enterprise";
import { card, rupiah } from "./enterprise/shared";
import type { TabId } from "./AdminDashboard";

export default function AdminOverview({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void;
}) {
  const [data, setData] = useState<EnterpriseMonitoring | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    getEnterpriseMonitoring({ per_page: 5 })
      .then((result) => {
        if (!result?.summary) throw new Error();
        setData(result);
      })
      .catch(() => setError(true));
  }, []);
  const stats = data?.summary;
  const links = [
    {
      tab: "subscription" as TabId,
      Icon: CreditCard,
      title: "Subscription & pembayaran",
      note: "Pantau tagihan dan atur paket Enterprise.",
    },
    {
      tab: "companies" as TabId,
      Icon: Building2,
      title: "Perusahaan",
      note: "Kelola perusahaan dan proses audit.",
    },
    {
      tab: "catalogue" as TabId,
      Icon: Package,
      title: "Katalog",
      note: "Kelola produk katalog platform.",
    },
  ];
  return (
    <div className="space-y-5">
      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-orange-500">
          Huntr Admin
        </p>
        <h1 className="mb-1 mt-2 text-2xl font-bold">Ringkasan operasional</h1>
        <p className="m-0 text-sm text-[var(--ui-text-muted)]">
          Akses cepat untuk memantau aktivitas platform dan subscription.
        </p>
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-500">
          Ringkasan subscription belum dapat dimuat.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Subscription aktif", stats?.active_subscriptions],
          ["Tagihan menunggu", stats?.pending_count],
          ["Perlu pemeriksaan", stats?.needs_attention],
          [
            "Total tagihan lunas",
            stats ? rupiah(stats.paid_amount) : undefined,
          ],
        ].map(([label, value]) => (
          <div key={label} className={`${card} p-4`}>
            <p className="m-0 text-xs text-[var(--ui-text-muted)]">{label}</p>
            <p className="mb-0 mt-2 text-xl font-bold">{value ?? "—"}</p>
          </div>
        ))}
      </div>
      <div className={`${card} p-4`}>
        <h2 className="m-0 text-base font-bold">Pekerjaan admin</h2>
        <p className="mb-0 mt-1 text-xs text-[var(--ui-text-muted)]">
          Pilih area untuk melihat detail dan mengambil tindakan.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {links.map(({ tab, Icon, title, note }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className="flex items-start gap-3 border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-4 text-left rounded-md"
            >
              <Icon size={18} className="shrink-0 text-orange-500" />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs text-[var(--ui-text-muted)]">
                  {note}
                </span>
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-[var(--ui-text-muted)]">
        Nilai lunas adalah total tagihan subscription berstatus lunas
        berdasarkan data yang tersedia; transaksi PO ditampilkan terpisah.
      </p>
    </div>
  );
}
