import { Input as HuntrInput, Select as HuntrSelect } from "~/shared/ui/Fields";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, SlidersHorizontal, Store } from "lucide-react";
import Layout from "~/components/Layout";
import {
  CATEGORIES,
  FILTERS,
  MARKET_APPS,
  useAppMarket,
  type MarketApp,
} from "~/features/app-market/hooks/useAppMarket";
import AppIconTile from "~/features/app-market/components/AppIconTile";
import AppDetailDrawer from "~/features/app-market/components/AppDetailDrawer";

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
    isEligible,
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
      <div className="w-full space-y-8">
        <section className="grid gap-6 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 lg:grid-cols-[minmax(0,1fr)_minmax(520px,auto)] lg:items-center lg:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
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

          <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] lg:w-auto lg:min-w-[520px]">
            <label className="flex min-h-12 items-center gap-2 rounded-lg bg-[var(--ui-bg-input)] px-3 ring-1 ring-[var(--ui-border-input)] focus-within:ring-2 focus-within:ring-[var(--ui-text-brand)]/30">
              <Search size={17} className="text-[var(--ui-text-muted)]" />
              <HuntrInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari aplikasi…"
                data-field-chrome="none"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <HuntrSelect
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-12 rounded-lg bg-[var(--ui-bg-input)] px-3 text-sm outline-none ring-1 ring-[var(--ui-border-input)] focus:ring-2 focus:ring-[var(--ui-text-brand)]/30"
            >
              <option>All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </HuntrSelect>
            <label className="flex min-h-12 items-center gap-2 rounded-lg bg-[var(--ui-bg-input)] px-3 text-sm ring-1 ring-[var(--ui-border-input)]">
              <SlidersHorizontal
                size={16}
                className="text-[var(--ui-text-muted)]"
              />
              <HuntrSelect
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as (typeof FILTERS)[number])
                }
                className="bg-transparent py-2.5 outline-none"
              >
                {FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </HuntrSelect>
            </label>
          </div>
        </section>

        {visibleApps.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5 2xl:grid-cols-4">
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
        eligible={selected ? isEligible(selected) : true}
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
