import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import React, { useEffect, useState, useRef } from "react";
import Layout from "~/components/Layout";
import { getCatalogues } from "~/lib/api";
import { aiSearch, aiGeneratePr, isAiQuery, aiCompareText } from "~/lib/api/ai";
import AiInsightCard from "~/components/AiInsightCard";
import AiCompareModal from "~/components/AiCompareModal";
import {
  ShoppingCart, Search, Plus, CheckCircle2, Loader2, Package,
  Sparkles, GitCompare, ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  LayoutGrid, Wrench, Monitor, Sofa, Paperclip, Handshake,
  Settings2, Zap, Building2, FlaskConical, HardHat, PenLine,
  Coffee, BoxIcon, Megaphone, Bookmark, X, Filter, type LucideIcon
} from "lucide-react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { getAssetUrl } from "~/lib/assets";
import {
  loadCart, addItemToCart as addItemToCartLib,
  type CartItem,
} from "~/lib/cart";
import { isAgenticProcurementEnabled } from "~/lib/features";

import { useMediaQuery, MOBILE_BREAKPOINT } from "~/hooks/useMediaQuery";
import Toast from "~/components/Toast";
import { useLanguage } from "~/context/LanguageContext";

const CATEGORY_CONFIG: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "all", label: "All", Icon: LayoutGrid },
  { key: "hardware", label: "Hardware", Icon: Wrench },
  { key: "software", label: "Software", Icon: Monitor },
  { key: "furniture", label: "Furniture", Icon: Sofa },
  { key: "officeSupplies", label: "Office Supplies", Icon: Paperclip },
  { key: "services", label: "Services", Icon: Handshake },
  { key: "spareparts", label: "Spareparts", Icon: Settings2 },
  { key: "electronics", label: "Electronics", Icon: Zap },
  { key: "mechanical", label: "Mechanical", Icon: Building2 },
  { key: "chemicals", label: "Chemicals", Icon: FlaskConical },
  { key: "construction", label: "Construction", Icon: HardHat },
  { key: "stationery", label: "Stationery", Icon: PenLine },
  { key: "pantry", label: "Pantry & F&B", Icon: Coffee },
  { key: "logistics", label: "Logistics", Icon: BoxIcon },
  { key: "marketing", label: "Marketing", Icon: Megaphone },
  { key: "other", label: "Other", Icon: Bookmark },
];

/* ── SSR Loader ────────────────────────────────────────────────────── */
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = Number(url.searchParams.get("page")) || 1;
  const category = url.searchParams.get("category") || undefined;

  try {
    const res = await getCatalogues({
      search: search || undefined,
      page,
      category: category === "All" ? undefined : category,
    });
    const items = res?.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    const totalPages = res?.last_page || 1;
    return { items, totalPages };
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export function meta({ params }: { params: Record<string, string | undefined> }) {
  const companySlug = params?.companySlug;
  const title = companySlug
    ? `Marketplace - ${companySlug.replace(/-/g, " ").toUpperCase()} | Huntr.id`
    : "Marketplace | Huntr.id";
  return [
    { title },
    { name: "description", content: "Explore verified B2B vendors and industrial products on Huntr Marketplace." },
  ];
}

export default function Marketplace() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [cartToast, setCartToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [items, setItems] = useState<any[]>(() => loaderData?.items || []);
  const [loading, setLoading] = useState<boolean>(() => !loaderData?.items || loaderData.items.length === 0);
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(() => loaderData?.totalPages || 1);
  const [isAgenticEnabled, setIsAgenticEnabled] = useState(false);
  const isInitialMount = useRef(true);

  // AI state
  const [aiMode, setAiMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiIntent, setAiIntent] = useState<any>(null);
  const [aiInsightDismissed, setAiInsightDismissed] = useState(false);
  const [isGeneratingPr, setIsGeneratingPr] = useState(false);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  // Compare state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const [cartPanelOpen, setCartPanelOpen] = useState(false);

  // Category dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Just-added item animation
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Close category dropdown on outside click ── */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node))
        setShowCategoryDropdown(false);
    };
    if (showCategoryDropdown) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showCategoryDropdown]);

  /* ── Helpers ── */
  const getCompanyPrefix = () => {
    if (!activeCompany) return "";
    const slug = activeCompany.slug || activeCompany.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  const getPaginationPages = (total: number, current: number): (number | string)[] => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("...");
    pages.push(total);
    return pages;
  };

  /* ── Init ── */
  useEffect(() => {
    setIsAgenticEnabled(isAgenticProcurementEnabled());
    const handleFeatureUpdate = () => {
      setIsAgenticEnabled(isAgenticProcurementEnabled());
    };
    window.addEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
    window.addEventListener("storage", handleFeatureUpdate);
    return () => {
      window.removeEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
      window.removeEventListener("storage", handleFeatureUpdate);
    };
  }, []);

  useEffect(() => {
    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      setActiveCompany(comp);
      if (comp.type === "vendor") navigate("/");
    }
  }, []);

  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setCart(Array.isArray(d) ? d : loadCart());
    };
    window.addEventListener("huntr-cart-updated", onUpdate);
    return () => window.removeEventListener("huntr-cart-updated", onUpdate);
  }, []);

  useEffect(() => {
    const onPanelChange = (e: Event) => {
      const open = (e as CustomEvent<{ open: boolean }>).detail?.open;
      if (typeof open === "boolean") setCartPanelOpen(open);
    };
    window.addEventListener("huntr-cart-panel-changed", onPanelChange);
    return () => window.removeEventListener("huntr-cart-panel-changed", onPanelChange);
  }, []);

  /* ── Fetch ── */
  const fetchItems = async (showLoader = true, pageNum = currentPage, cat = activeCategory, q = searchTerm) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getCatalogues({ search: q, page: pageNum, category: cat === "All" ? undefined : cat });
      if (res?.data && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.last_page || 1);
      } else {
        setItems(Array.isArray(res) ? res : []);
        setTotalPages(1);
      }
    } catch { /* silent */ }
    finally { if (showLoader) setLoading(false); }
  };

  const fetchItemsAi = async (query: string) => {
    try {
      setLoading(true); setAiMode(true); setAiInsightDismissed(false);
      setComparisonText(null); setIsLoadingComparison(false);
      const res = await aiSearch(query);
      if (res.success && res.data) {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setItems(data);
        setAiSummary(res.ai_summary || null);
        const intent = res.intent || null;
        setAiIntent(intent);
        if (intent?.is_comparison) {
          setIsLoadingComparison(true);
          aiCompareText(query)
            .then((r: any) => { if (r.success && r.markdown) setComparisonText(r.markdown); })
            .catch(() => { })
            .finally(() => setIsLoadingComparison(false));
        }
      } else {
        setAiMode(false); setAiSummary(null); setAiIntent(null);
        await fetchItems();
      }
    } catch { setAiMode(false); setAiSummary(null); setAiIntent(null); await fetchItems(); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm)
        setSearchParams(prev => { localSearch ? prev.set("search", localSearch) : prev.delete("search"); prev.set("page", "1"); return prev; });
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (loaderData?.items && loaderData.items.length > 0) {
        return;
      }
    }
    if (!searchTerm) {
      setAiMode(false); setAiSummary(null); setAiIntent(null);
      setComparisonText(null); setIsLoadingComparison(false);
      fetchItems(true, currentPage, activeCategory, "");
    } else if (isAiQuery(searchTerm)) {
      fetchItemsAi(searchTerm);
    } else {
      setAiMode(false); setAiSummary(null); setAiIntent(null);
      setComparisonText(null); setIsLoadingComparison(false);
      fetchItems(true, currentPage, activeCategory, searchTerm);
    }
  }, [searchTerm, activeCategory, currentPage]);

  /* ── Handlers ── */
  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setSearchParams(prev => { prev.set("page", String(p)); return prev; });
  };

  const handleCategoryChange = (cat: string) => {
    setSearchParams(prev => {
      cat && cat !== "All" ? prev.set("category", cat) : prev.delete("category");
      prev.set("page", "1"); return prev;
    });
  };

  const handleGeneratePr = async () => {
    setIsGeneratingPr(true);
    try {
      const ids = compareIds.length > 0 ? compareIds : items.slice(0, 10).map(i => i.id);
      const res = await aiGeneratePr(searchTerm, ids);
      if (res.success && res.draft) {
        localStorage.setItem("ai_pr_draft", JSON.stringify(res.draft));
        navigate(`${getCompanyPrefix()}/checkout?from=ai`);
      }
    } catch { /* silent */ }
    finally { setIsGeneratingPr(false); }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length >= 4 ? prev : [...prev, id]);
  };

  /** Add item directly */
  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = addItemToCartLib(item, 1);
    setCart(updated);
    if (isMobile) {
      setCartToast({ visible: true, message: t("marketplace.item.toastAdded", { name: item.name ?? "Item" }) });
    } else {
      window.dispatchEvent(new CustomEvent("huntr-open-cart"));
    }
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAddedId(item.id);
    addedTimerRef.current = setTimeout(() => setAddedId(null), 1200);
  };

  const PRIMARY_COUNT = 9;
  const primaryCats = CATEGORY_CONFIG.slice(0, PRIMARY_COUNT);
  const overflowCats = CATEGORY_CONFIG.slice(PRIMARY_COUNT);
  const activeInOverflow = overflowCats.some(c => c.label === activeCategory);

  return (
    <Layout title={t("marketplace.title")} subtitle={t("marketplace.subtitle")}>
      <div
        className="w-full space-y-6 transition-all duration-300 pb-12"
        style={{ paddingRight: cartPanelOpen && !isMobile ? 296 : 0 }}
      >
        {/* Agentic Procurement Quick Launch Banner */}
        {isAgenticEnabled && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                  <span>{t("marketplace.agenticBanner.title")}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20">
                    {t("marketplace.agenticBanner.badge")}
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
                  {t("marketplace.agenticBanner.description")}
                </p>
              </div>
            </div>
            <HuntrButton
              onClick={() => navigate(`${getCompanyPrefix()}/agentic-procurement`)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/20"
            >
              <span>{t("marketplace.agenticBanner.button")}</span>
              <ArrowRight size={14} />
            </HuntrButton>
          </div>
        )}

        {/* Search & Filter Header Container */}
        <div className="space-y-3.5">
          {/* Search Bar */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-xs transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
            {aiMode ? (
              <Sparkles size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
            ) : (
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            )}
            <HuntrInput
              type="text"
              placeholder={t("marketplace.searchPlaceholder")}
              data-field-chrome="none"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full bg-transparent text-[var(--ui-text-primary)] text-sm outline-none placeholder:text-[var(--ui-text-muted)]"
              style={{ minHeight: 50, paddingLeft: 46, paddingRight: localSearch ? 78 : (aiMode ? 104 : 20) }}
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--ui-bg-input)] hover:bg-[var(--ui-border)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
            {aiMode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {t("marketplace.aiModeBadge")}
              </span>
            )}
          </div>

          {/* Categories Filter Pills with Horizontal Scroll & More Dropdown */}
          <div className="flex items-center gap-2" ref={categoryDropdownRef}>
            <div className="flex-1 overflow-x-auto no-scrollbar py-1 flex items-center gap-2">
              {primaryCats.map(({ key, label, Icon }) => {
                const isActive = activeCategory === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { handleCategoryChange(label); setShowCategoryDropdown(false); }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      isActive
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25"
                        : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)] hover:border-orange-500/30"
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                    <span>{t(`marketplace.categories.${key}` as any)}</span>
                  </button>
                );
              })}

              {/* More Categories Dropdown Pill */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(p => !p)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    activeInOverflow
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25"
                      : showCategoryDropdown
                        ? "bg-[var(--ui-bg-input)] border-orange-500/40 text-[var(--ui-text-primary)]"
                        : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)] hover:border-orange-500/30"
                  }`}
                >
                  {activeInOverflow ? (
                    <>
                      {(() => { const c = overflowCats.find(c => c.label === activeCategory)!; return <c.Icon size={13} strokeWidth={2} />; })()}
                      <span>{t(`marketplace.categories.${overflowCats.find(c => c.label === activeCategory)?.key ?? "other"}` as any)}</span>
                    </>
                  ) : (
                    <>
                      <Filter size={13} />
                      <span>{t("marketplace.categories.more")}</span>
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`} />
                    </>
                  )}
                </button>

                {showCategoryDropdown && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-50 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl shadow-xl p-3.5 min-w-[320px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-2.5 px-1">
                      {t("marketplace.categories.moreCategories")}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {overflowCats.map(({ key, label, Icon }) => {
                        const isActive = activeCategory === label;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => { handleCategoryChange(label); setShowCategoryDropdown(false); }}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer border ${
                              isActive
                                ? "bg-orange-500 text-white border-orange-500 font-bold"
                                : "bg-[var(--ui-bg-input)] border-transparent text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:border-[var(--ui-border)]"
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span className="truncate">{t(`marketplace.categories.${key}` as any)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Status & Count */}
          <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)] px-1">
            <div className="flex items-center gap-2">
              <span>
                {loading ? "Memuat katalog..." : `Menampilkan ${items.length} produk katalog`}
              </span>
              {activeCategory !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-[11px] font-semibold">
                  {activeCategory}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("All")}
                    className="hover:text-red-500 ml-0.5 cursor-pointer"
                    title="Hapus filter kategori"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>

            {(activeCategory !== "All" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  handleCategoryChange("All");
                }}
                className="text-xs font-semibold text-orange-500 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* AI Insight */}
        {aiMode && aiSummary && !aiInsightDismissed && (
          <AiInsightCard
            summary={aiSummary}
            totalFound={items.length}
            query={searchTerm}
            catalogueIds={items.slice(0, 10).map(i => i.id)}
            onGeneratePr={handleGeneratePr}
            onDismiss={() => setAiInsightDismissed(true)}
            isGenerating={isGeneratingPr}
            comparisonAnalysis={comparisonText}
            isComparison={!!aiIntent?.is_comparison || isLoadingComparison}
            specs={aiIntent?.specs ?? []}
          />
        )}

        {/* Compare floating / docked bar */}
        {compareIds.length >= 2 && (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-primary)]">
              <GitCompare size={18} className="text-indigo-500" />
              <span><strong className="text-indigo-500">{t("marketplace.compareBar.itemsSelected", { count: compareIds.length })}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <HuntrButton onClick={() => setCompareIds([])} className="px-3 py-1.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]">
                {t("marketplace.compareBar.reset")}
              </HuntrButton>
              <HuntrButton onClick={() => setShowCompareModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-sm hover:opacity-95">
                <Sparkles size={14} /> {t("marketplace.compareBar.compareWithAi")}
              </HuntrButton>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            {aiMode ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center animate-pulse shadow-md">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--ui-text-primary)]">{t("marketplace.loading.analyzingSpecs")}</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">{t("marketplace.loading.aiScoring")}</p>
                </div>
              </>
            ) : (
              <Loader2 size={32} className="animate-spin text-orange-500" />
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-card)] gap-3 text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--ui-bg-input)] flex items-center justify-center text-[var(--ui-text-muted)]">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--ui-text-primary)]">{t("marketplace.empty")}</p>
              <p className="text-xs text-[var(--ui-text-muted)] mt-1 max-w-sm">
                Coba ubah kata kunci pencarian atau pilih kategori lain untuk menemukan produk yang diinginkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setLocalSearch(""); handleCategoryChange("All"); }}
              className="mt-2 text-xs font-bold text-orange-500 hover:underline cursor-pointer"
            >
              Tampilkan Semua Produk
            </button>
          </div>
        ) : (
          <div className={`grid gap-5 ${cartPanelOpen ? "grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}`}>
            {items.map(item => {
              const isSelected = compareIds.includes(item.id);
              const justAdded = addedId === item.id;
              const inCart = cart.some(c => c.id === String(item.id));
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`${getCompanyPrefix()}/marketplace/${item.id}`)}
                  className={`group rounded-2xl border bg-[var(--ui-bg-card)] flex flex-col transition-all duration-200 cursor-pointer hover:border-orange-500/40 hover:shadow-lg overflow-hidden ${
                    isSelected ? "border-indigo-500/70 ring-2 ring-indigo-500/25 shadow-md" : "border-[var(--ui-border)]"
                  }`}
                >
                  {/* Image Container with Floating Badges */}
                  <div className="relative h-44 sm:h-48 bg-[var(--ui-bg-input)] flex items-center justify-center p-4 overflow-hidden border-b border-[var(--ui-border)]/50">
                    {/* Floating Category Tag (Clean & Subtle, Replaces Orange Caption) */}
                    <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-[var(--ui-bg-card)]/90 backdrop-blur-md border border-[var(--ui-border)] text-[10px] font-semibold text-[var(--ui-text-secondary)] shadow-xs">
                      {item.category || "Umum"}
                    </span>

                    {/* Image Preview */}
                    {(item.image_url || item.image_path) ? (
                      <img
                        src={getAssetUrl(item.image_url || item.image_path)}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <Package size={32} className="text-[var(--ui-text-muted)] opacity-25" />
                    )}

                    {/* In-Cart Status Badge */}
                    {inCart && !justAdded && (
                      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={11} />
                        <span>Di PR</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                    {/* Top Info Section */}
                    <div className="space-y-1">
                      {/* Brand / Vendor Label (Fixed h-4 so title position never shifts) */}
                      <p className="text-[11px] font-medium text-[var(--ui-text-muted)] truncate h-4 leading-4">
                        {item.brand || "\u00A0"}
                      </p>

                      {/* Item Title (Fixed 2-line height h-10 so 1-line or 2-line titles are identical) */}
                      <h3
                        title={item.name}
                        className="text-sm font-bold text-[var(--ui-text-primary)] line-clamp-2 leading-snug h-10 group-hover:text-orange-500 transition-colors"
                      >
                        {item.name}
                      </h3>

                      {/* AI Score (if available) */}
                      {item.ai_score !== undefined && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                            <Sparkles size={10} /> {t("marketplace.item.match", { score: item.ai_score })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Fixed-Height Price Bar + Fixed-Position Action Buttons */}
                    <div className="mt-auto pt-2 space-y-2.5">
                      {/* Price Bar (Fixed h-8 with border-t: preserves identical row height even if price is missing) */}
                      <div className="h-8 border-t border-[var(--ui-border)]/50 flex items-center">
                        {item.price > 0 ? (
                          <span className="text-base sm:text-lg font-black text-[var(--ui-text-primary)] tabular-nums block">
                            Rp {Number(item.price).toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--ui-text-muted)] select-none block">
                            &nbsp;
                          </span>
                        )}
                      </div>

                      {/* Actions: Add to Cart & Compare (Fixed at the bottom of the card) */}
                      <div className="flex items-center gap-2">
                        <HuntrButton
                          type="button"
                          aria-label={t("marketplace.item.addToCart")}
                          onClick={e => handleAddToCart(item, e)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            justAdded
                              ? "bg-emerald-500 text-white"
                              : inCart
                                ? "bg-orange-600 hover:bg-orange-700 text-white"
                                : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                          } cursor-pointer active:scale-[0.98]`}
                        >
                          {justAdded ? (
                            <><CheckCircle2 size={14} /> {t("marketplace.item.added")}</>
                          ) : inCart ? (
                            <><Plus size={14} /> {t("marketplace.item.addMore")}</>
                          ) : (
                            <><ShoppingCart size={14} /> {t("marketplace.item.addToCart")}</>
                          )}
                        </HuntrButton>
                        <button
                          type="button"
                          aria-label={isSelected ? "Remove from comparison" : "Compare"}
                          title={isSelected ? "Hapus dari perbandingan" : "Bandingkan spesifikasi"}
                          onClick={e => { e.stopPropagation(); toggleCompare(item.id); }}
                          className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                              : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] hover:border-indigo-400 hover:text-indigo-500"
                          }`}
                        >
                          {isSelected ? <CheckCircle2 size={15} /> : <GitCompare size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <HuntrButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} />
            </HuntrButton>
            {getPaginationPages(totalPages, currentPage).map((page, idx) =>
              typeof page === "string" ? (
                <span key={`el-${idx}`} className="px-1 text-xs text-[var(--ui-text-muted)] font-medium">…</span>
              ) : (
                <button
                  key={`p-${page}`}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                      : "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <HuntrButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} />
            </HuntrButton>
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {showCompareModal && compareIds.length >= 2 && (
        <AiCompareModal
          catalogueIds={compareIds}
          onClose={() => setShowCompareModal(false)}
          onAddToCart={item => { handleAddToCart(item, { stopPropagation: () => { } } as any); setShowCompareModal(false); }}
        />
      )}
      {/* Mobile add-to-cart toast */}
      <Toast
        message={cartToast.message}
        type="success"
        isVisible={cartToast.visible}
        onClose={() => setCartToast(prev => ({ ...prev, visible: false }))}
        position="bottom-center"
        duration={2500}
      />
    </Layout>
  );
}
