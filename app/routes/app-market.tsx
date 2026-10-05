import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  Download,
  Package,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import Layout from "../components/Layout";
import { getWmsApps, installWms, uninstallWms } from "../lib/api/wms";

export default function AppMarket() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [filter, setFilter] = useState("All apps");
  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);
  useEffect(() => {
    if (!company?.id) return;
    getWmsApps(company.id)
      .then((r) =>
        setInstalled(
          Boolean(
            r?.apps?.find((a: any) => a.key === "wms-inventory")?.installed,
          ),
        ),
      )
      .catch((e) => setError(e.message));
  }, [company]);
  const install = async () => {
    if (!company?.id) {
      setError("Pilih perusahaan terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await installWms(company.id);
      setInstalled(true);
      window.dispatchEvent(new Event("huntr-app-installations-updated"));
    } catch (e: any) {
      setError(e.message || "Gagal menginstall aplikasi.");
    } finally {
      setBusy(false);
    }
  };
  const uninstall = async () => {
    if (!company?.id) return;
    setBusy(true);
    setError("");
    try {
      await uninstallWms(company.id);
      setInstalled(false);
      window.dispatchEvent(new Event("huntr-app-installations-updated"));
    } catch (e: any) {
      setError(e.message || "Gagal menghapus aplikasi.");
    } finally {
      setBusy(false);
    }
  };
  const app = {
    key: "wms-inventory",
    name: "WMS & Inventory",
    category: "Operations",
    description:
      "Multiwarehouse operations with receiving, put away, inventory allocation, fulfilment, and operational reporting.",
  };
  const visible =
    (category === "All categories" || category === app.category) &&
    (filter === "All apps" ||
      (filter === "Installed" && installed) ||
      (filter === "Available" && !installed)) &&
    `${app.name} ${app.description}`
      .toLowerCase()
      .includes(query.toLowerCase());
  return (
    <Layout
      title="App Market"
      subtitle="Add-on siap pakai untuk workspace perusahaan Anda."
    >
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <span className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2 text-[var(--ui-text-brand)]">
            <Store size={19} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--ui-text-primary)]">
              Aplikasi untuk bisnis Anda
            </h2>
            <p className="text-sm text-[var(--ui-text-secondary)]">
              Install per perusahaan. Data setiap workspace terisolasi.
            </p>
          </div>
        </div>
        <div className="grid gap-2 border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 md:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-2 border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3">
            <Search size={17} className="text-[var(--ui-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm"
          >
            <option>All categories</option>
            <option>Operations</option>
          </select>
          <label className="flex items-center gap-2 border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-sm">
            <SlidersHorizontal size={16} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent py-2.5 outline-none"
            >
              <option>All apps</option>
              <option>Available</option>
              <option>Installed</option>
            </select>
          </label>
        </div>
        {visible ? (
          <article className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <div className="bg-[var(--ui-bg-input)] p-3 text-[var(--ui-text-brand)]">
                  <Package size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--ui-text-primary)]">
                      WMS &amp; Inventory
                    </h3>
                    <span className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ui-text-brand)]">
                      Huntr Catalogue integrated
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-5 text-[var(--ui-text-secondary)]">
                    Kelola multiwarehouse, receiving dan put away, alokasi
                    order, packaging, pergerakan stok, serta laporan operasional
                    dari satu tempat.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      "Multiwarehouse",
                      "Receiving & Put Away",
                      "Order Allocation",
                      "Packaging & Dispatch",
                      "Stock Analysis",
                      "Tenant isolated",
                    ].map((x) => (
                      <span
                        key={x}
                        className="border border-[var(--ui-border)] px-2 py-1 text-[11px] text-[var(--ui-text-secondary)]"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                disabled={busy}
                onClick={
                  installed
                    ? () =>
                        navigate(
                          company?.slug ? `/${company.slug}/wms` : "/wms",
                        )
                    : install
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {installed ? (
                  <>
                    <Check size={16} /> Open app
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    {busy ? "Installing…" : "Install"}
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-4 text-sm text-[var(--ui-text-brand)]">
                {error}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-3 text-xs text-[var(--ui-text-muted)]">
              <span>
                {installed
                  ? "Installed for this company workspace."
                  : "Free installation · Activate instantly · Manage warehouse data by company."}
              </span>
              {installed && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={uninstall}
                  className="text-xs font-semibold text-[var(--ui-text-muted)] underline underline-offset-2 disabled:opacity-50"
                >
                  {busy ? "Removing…" : "Uninstall"}
                </button>
              )}
            </div>
          </article>
        ) : (
          <div className="border border-dashed border-[var(--ui-border)] p-8 text-center text-sm text-[var(--ui-text-muted)]">
            No apps match your search or filters.
          </div>
        )}
      </div>
    </Layout>
  );
}
