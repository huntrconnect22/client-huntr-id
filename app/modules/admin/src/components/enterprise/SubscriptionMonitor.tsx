import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Select as HuntrSelect } from "~/shared/ui/Fields";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  getEnterpriseMonitoring,
  refreshEnterpriseTransaction,
  type EnterpriseMonitoring,
} from "../../../lib/api/admin-enterprise";
import { button, card, dateTime, field, rupiah } from "./shared";

const states: Record<string, string> = {
  paid: "Lunas",
  pending: "Menunggu",
  initiating: "Diproses",
  unknown: "Perlu pemeriksaan",
  deny: "Ditolak",
  cancel: "Dibatalkan",
  expire: "Kedaluwarsa",
  failure: "Gagal",
};
const label = (value: string) =>
  value.replace(/^enterprise_/, "Enterprise ").replaceAll("_", " ");

export function SubscriptionMonitor() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    purchase_type: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EnterpriseMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    const timeout = setTimeout(() => {
      setLoading(true);
      setError("");
      getEnterpriseMonitoring({ ...filters, page })
        .then((result) => {
          if (!result?.summary || !result.transactions)
            throw new Error("Data monitoring belum tersedia.");
          if (current) setData(result);
        })
        .catch((err) => {
          if (current) setError(err.message || "Data tidak dapat dimuat.");
        })
        .finally(() => {
          if (current) setLoading(false);
        });
    }, 300);
    return () => {
      current = false;
      clearTimeout(timeout);
    };
  }, [filters, page, revision]);

  const change = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((previous) => ({ ...previous, [key]: value }));
  };
  const refresh = async (id: string) => {
    setRefreshing(id);
    setError("");
    try {
      const result = await refreshEnterpriseTransaction(id);
      if (!result?.status)
        throw new Error("Status Midtrans belum dapat diperbarui.");
      setRevision((value) => value + 1);
    } catch (err: any) {
      setError(err.message || "Status Midtrans belum dapat diperbarui.");
    } finally {
      setRefreshing(null);
    }
  };
  const metrics = data?.summary;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Nilai lunas",
            rupiah(metrics?.paid_amount ?? 0),
            "Dari tagihan pada filter",
          ],
          [
            "Tagihan lunas",
            metrics?.paid_count ?? 0,
            "Pembayaran terkonfirmasi",
          ],
          [
            "Menunggu pembayaran",
            metrics?.pending_count ?? 0,
            "Sedang diproses atau menunggu",
          ],
          [
            "Perlu pemeriksaan",
            metrics?.needs_attention ?? 0,
            "Status Midtrans belum pasti",
          ],
        ].map(([title, value, note]) => (
          <div className={`${card} p-4`} key={title}>
            <p className="m-0 text-xs text-[var(--ui-text-muted)]">{title}</p>
            <p className="mb-1 mt-2 text-xl font-bold text-[var(--ui-text-primary)]">
              {value}
            </p>
            <p className="m-0 text-xs text-[var(--ui-text-muted)]">{note}</p>
          </div>
        ))}
      </div>
      <div className={`${card} p-4`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="m-0 text-base font-bold">Tagihan subscription</h3>
            <p className="mb-0 mt-1 text-xs text-[var(--ui-text-muted)]">
              Filter berdasarkan tanggal pembuatan tagihan (WIB).{" "}
              {metrics?.active_subscriptions ?? 0} subscription aktif secara
              keseluruhan.
            </p>
          </div>
          <HuntrButton
            className={button}
            onClick={() => setRevision((value) => value + 1)}
          >
            <RefreshCw size={14} className="inline mr-1" />
            Muat ulang
          </HuntrButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <HuntrInput
            className={field}
            aria-label="Cari perusahaan atau referensi"
            placeholder="Cari perusahaan / referensi"
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
          />
          <HuntrSelect
            className={field}
            aria-label="Status pembayaran"
            value={filters.status}
            onChange={(e) => change("status", e.target.value)}
          >
            <option value="">Semua status</option>
            {Object.entries(states).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </HuntrSelect>
          <HuntrSelect
            className={field}
            aria-label="Jenis tagihan"
            value={filters.purchase_type}
            onChange={(e) => change("purchase_type", e.target.value)}
          >
            <option value="">Semua jenis</option>
            <option value="plan">Paket</option>
            <option value="addon">Add-on (lama)</option>
            <option value="addons">Add-on</option>
          </HuntrSelect>
          <label className="text-xs text-[var(--ui-text-muted)]">
            Dari
            <HuntrInput
              className={field}
              type="date"
              value={filters.from}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label className="text-xs text-[var(--ui-text-muted)]">
            Sampai
            <HuntrInput
              className={field}
              type="date"
              value={filters.to}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <HuntrTable className="w-full min-w-[820px] text-left text-sm">
            <HuntrTableHead className="border-b border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
              <HuntrTableRow>
                {[
                  "Referensi / tanggal",
                  "Perusahaan",
                  "Paket / jenis",
                  "Jumlah",
                  "Status",
                  "Email",
                  "Aksi",
                ].map((title) => (
                  <HuntrTableHeaderCell className="px-2 py-3 font-semibold" key={title}>
                    {title}
                  </HuntrTableHeaderCell>
                ))}
              </HuntrTableRow>
            </HuntrTableHead>
            <HuntrTableBody>
              {data?.transactions.data.map((row) => (
                <HuntrTableRow className="border-b border-[var(--ui-border)]" key={row.id}>
                  <HuntrTableCell className="px-2 py-3">
                    <div className="font-semibold">{row.order_id}</div>
                    <div className="text-xs text-[var(--ui-text-muted)]">
                      {dateTime(row.created_at)}
                    </div>
                  </HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3">{row.company_name}</HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3 capitalize">
                    {row.purchase_type === "addons"
                      ? "Add-on Enterprise"
                      : label(row.addon_key || row.enterprise_plan)}
                    <div className="text-xs text-[var(--ui-text-muted)]">
                      {row.purchase_type === "addons"
                        ? "Add-on"
                        : row.purchase_type === "addon"
                          ? `Add-on × ${row.quantity}`
                          : row.billing_cycle === "annual"
                            ? "Tahunan"
                            : "Bulanan"}
                    </div>
                    {row.addons_snapshot?.map((addon) => (
                      <div
                        key={addon.key}
                        className="text-xs text-[var(--ui-text-muted)]"
                      >
                        {addon.name} × {addon.quantity}
                      </div>
                    ))}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3 whitespace-nowrap font-semibold">
                    {rupiah(row.amount)}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${row.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : row.status === "unknown" ? "bg-amber-500/10 text-amber-600" : "bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)]"}`}
                    >
                      {states[row.status] || row.status}
                    </span>
                  </HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3 text-xs">
                    {row.billing_email_sent_at ? "Terkirim" : "Belum terkirim"}
                  </HuntrTableCell>
                  <HuntrTableCell className="px-2 py-3">
                    {["pending", "unknown", "initiating"].includes(
                      row.status,
                    ) && (
                      <HuntrButton
                        disabled={refreshing === row.id}
                        className={button}
                        onClick={() => refresh(row.id)}
                      >
                        Cek Midtrans
                      </HuntrButton>
                    )}
                  </HuntrTableCell>
                </HuntrTableRow>
              ))}
            </HuntrTableBody>
          </HuntrTable>
          {!loading && !data?.transactions.data.length && (
            <p className="py-8 text-center text-sm text-[var(--ui-text-muted)]">
              Tidak ada tagihan yang sesuai.
            </p>
          )}
          {loading && (
            <p className="py-4 text-center text-sm text-[var(--ui-text-muted)]">
              Memuat data...
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
          <span>{data?.transactions.total ?? 0} tagihan</span>
          <div className="flex items-center gap-2">
            <HuntrButton
              className={button}
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              Sebelumnya
            </HuntrButton>
            <span>
              {data?.transactions.current_page ?? 1} /{" "}
              {data?.transactions.last_page ?? 1}
            </span>
            <HuntrButton
              className={button}
              disabled={page >= (data?.transactions.last_page ?? 1) || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Berikutnya
            </HuntrButton>
          </div>
        </div>
      </div>
    </div>
  );
}
