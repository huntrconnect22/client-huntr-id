import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, SlidersHorizontal, Store } from "lucide-react";
import Layout from "../components/Layout";
import {
  CATEGORIES,
  FILTERS,
  MARKET_APPS,
  useAppMarket,
  type MarketApp,
} from "../features/app-market/hooks/useAppMarket";
import AppIconTile from "../features/app-market/components/AppIconTile";
import AppDetailDrawer from "../features/app-market/components/AppDetailDrawer";

export default function AppMarket() {
  const navigate = useNavigate();
  const {
    company,
    query,
    setQuery,
    category,
    setCategory,
    filter,
    setFilter,
    error,
    setError,
    visibleApps,
    isInstalled,
    isBusy,
    install,
    uninstall,
  } = useAppMarket();
  const [selected, setSelected] = useState<MarketApp | null>(null);

  const installedCount = MARKET_APPS.filter((a) => isInstalled(a)).length;

  const openApp = useCallback(
    (app: MarketApp) => {
      if (!app.route) return;
      navigate(company?.slug ? `/${company.slug}${app.route}` : app.route);
    },
    [company?.slug, navigate],
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    setError("");
  }, [setError]);

  const handleInstall = useCallback(() => {
    if (!selected) return;
    install(selected);
  }, [selected, install]);

  const handleUninstall = useCallback(() => {
    if (!selected) return;
    uninstall(selected);
  }, [selected, uninstall]);

  const handleOpen = useCallback(() => {
    if (!selected) return;
    openApp(selected);
  }, [selected, openApp]);

  return (
    <Layout
      title="App Market"
      subtitle="Add-on siap pakai untuk workspace perusahaan Anda."
    >
      <div className="w-full space-y-6">
        <section className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--huntr-gradient)] text-white shadow-lg shadow-indigo-500/30">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--ui-text-primary)]">
                Aplikasi untuk bisnis Anda
              </h2>
              <p className="mt-0.5 text-sm text-[var(--ui-text-secondary)]">
                Install per perusahaan · Data setiap workspace terisolasi ·{" "}
                <span className="font-semibold text-[var(--ui-text-brand)]">
                  {installedCount}
                </span>{" "}
                dari {MARKET_APPS.length} terpasang
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-stretch">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 focus-within:ring-2 focus-within:ring-[var(--ui-text-brand)]/30">
              <Search size={17} className="text-[var(--ui-text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari aplikasi…"
                className="w-full bg-transparent py-2.5 text-sm outline-none md:w-60"
              />
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ui-text-brand)]/30"
            >
              <option>All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-sm">
              <SlidersHorizontal size={16} className="text-[var(--ui-text-muted)]" />
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as (typeof FILTERS)[number])
                }
                className="bg-transparent py-2.5 outline-none"
              >
                {FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {visibleApps.length > 0 ? (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleApps.map((app) => (
              <AppIconTile
                key={app.key}
                app={app}
                installed={isInstalled(app)}
                busy={isBusy(app.key)}
                onClick={() => setSelected(app)}
              />
            ))}
          </section>
        ) : (
          <section className="border border-dashed border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg-card)] p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]">
              <Store size={28} />
            </div>
            <h3 className="text-base font-semibold text-[var(--ui-text-primary)]">
              Tidak ada aplikasi yang cocok
            </h3>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
              Coba ubah kata kunci pencarian, kategori, atau filter status
              instalasi.
            </p>
          </section>
        )}
      </div>

      <AppDetailDrawer
        app={selected}
        installed={selected ? isInstalled(selected) : false}
        busy={selected ? isBusy(selected.key) : false}
        error={error}
        onClose={handleClose}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        onOpen={handleOpen}
      />
    </Layout>
  );
}
