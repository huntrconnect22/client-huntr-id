import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import { getCatalogues } from "../lib/api";
import { aiSearch, aiGeneratePr, isAiQuery, aiCompareText } from "../lib/api/ai";
import AiInsightCard from "../components/AiInsightCard";
import AiCompareModal from "../components/AiCompareModal";
import {
  ShoppingCart, Search, Plus, CheckCircle2, Loader2, Package,
  Sparkles, GitCompare, ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  LayoutGrid, Wrench, Monitor, Sofa, Paperclip, Handshake,
  Settings2, Zap, Building2, FlaskConical, HardHat, PenLine,
  Coffee, BoxIcon, Megaphone, Bookmark, type LucideIcon
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { getAssetUrl } from "../lib/assets";
import {
  loadCart, addItemToCart as addItemToCartLib,
  type CartItem,
} from "../lib/cart";
import { isAgenticProcurementEnabled } from "../lib/features";

import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import Toast from "../components/Toast";

const CATEGORY_CONFIG: { label: string; Icon: LucideIcon }[] = [
  { label: "All", Icon: LayoutGrid },
  { label: "Hardware", Icon: Wrench },
  { label: "Software", Icon: Monitor },
  { label: "Furniture", Icon: Sofa },
  { label: "Office Supplies", Icon: Paperclip },
  { label: "Services", Icon: Handshake },
  { label: "Spareparts", Icon: Settings2 },
  { label: "Electronics", Icon: Zap },
  { label: "Mechanical", Icon: Building2 },
  { label: "Chemicals", Icon: FlaskConical },
  { label: "Construction", Icon: HardHat },
  { label: "Stationery", Icon: PenLine },
  { label: "Pantry & F&B", Icon: Coffee },
  { label: "Logistics", Icon: BoxIcon },
  { label: "Marketing", Icon: Megaphone },
  { label: "Other", Icon: Bookmark },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [cartToast, setCartToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(1);

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
    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      setActiveCompany(comp);
      // Marketplace is accessible from buyer workspaces.
      // Vendors who want to shop should switch to their buyer workspace.
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

  /** Add item directly — no qty modal */
  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = addItemToCartLib(item, 1);
    setCart(updated);
    if (isMobile) {
      // On mobile: only show a toast — don't open the cart panel
      setCartToast({ visible: true, message: `${item.name ?? "Item"} ditambahkan ke keranjang` });
    } else {
      window.dispatchEvent(new CustomEvent("huntr-open-cart"));
    }
    // Flash animation on button
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAddedId(item.id);
    addedTimerRef.current = setTimeout(() => setAddedId(null), 1200);
  };

  const PRIMARY_COUNT = 8;
  const primaryCats = CATEGORY_CONFIG.slice(0, PRIMARY_COUNT);
  const overflowCats = CATEGORY_CONFIG.slice(PRIMARY_COUNT);
  const activeInOverflow = overflowCats.some(c => c.label === activeCategory);

  return (
    <Layout title="Huntr Catalog" subtitle="Standardized corporate procurement catalog">
      {/* ── Product area — padding-right when cart is open to avoid overlap on desktop only ── */}
      <div
        className="w-full space-y-4 transition-all duration-300"
        style={{ paddingRight: cartPanelOpen && !isMobile ? 296 : 0 }}
      >
        {/* Agentic Procurement Quick Launch Banner (Only visible when feature is enabled in Settings) */}
        {isAgenticProcurementEnabled() && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-2.5 rounded-xl sm:rounded-lg bg-[var(--ui-bg-card)] border border-orange-500/30">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg sm:rounded-md bg-orange-500 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                <Sparkles size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--ui-text-primary)] flex items-center gap-1.5 flex-wrap">
                  <span>Butuh pengadaan otomatis dari deskripsi kebutuhan?</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20">Baru</span>
                </div>
                <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
                  Gunakan <b>AI Agentic Procurement</b> untuk mencari katalog, komparasi produk, dan menyusun PR otomatis.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`${getCompanyPrefix()}/agentic-procurement`)}
              className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1 rounded-lg sm:rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <span>Buka Procurement Agent</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {aiMode
              ? <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
              : <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            }
            <input
              type="text"
              placeholder="Search products or describe your need (AI-enabled)…"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className={`w-full pl-9 pr-24 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border text-[var(--ui-text-primary)] text-sm outline-none transition-all ${aiMode ? "border-purple-500/50 ring-2 ring-purple-500/10" : "border-[var(--ui-border-input)] focus:border-orange-500/50"
                }`}
            />
            {aiMode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                ✦ AI Mode
              </span>
            )}
          </div>

        </div>

        {/* Categories — single row, overflow into "More" */}
        <div className="relative" ref={categoryDropdownRef}>
          <div className="flex gap-1.5 items-center overflow-hidden" style={{ flexWrap: "nowrap" }}>
            {primaryCats.map(({ label, Icon }) => {
              const isActive = activeCategory === label;
              return (
                <button
                  key={label}
                  onClick={() => { handleCategoryChange(label); setShowCategoryDropdown(false); }}
                  style={isActive ? { color: "white" } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${isActive
                      ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/30"
                      : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                    }`}
                >
                  <Icon size={12} strokeWidth={2} /> {label}
                </button>
              );
            })}
            <button
              onClick={() => setShowCategoryDropdown(p => !p)}
              style={activeInOverflow ? { color: "white" } : {}}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${activeInOverflow
                  ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/30"
                  : showCategoryDropdown
                    ? "bg-[var(--ui-bg-input)] border-orange-400/50 text-orange-500"
                    : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                }`}
            >
              {activeInOverflow ? (
                <>
                  {(() => { const c = overflowCats.find(c => c.label === activeCategory)!; return <c.Icon size={12} strokeWidth={2} />; })()}
                  {activeCategory}
                </>
              ) : (
                <>More <ChevronDown size={11} className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} /></>
              )}
            </button>
          </div>
          {showCategoryDropdown && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-xl shadow-xl p-3 min-w-[320px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ui-text-muted)] mb-2.5 px-1">More Categories</p>
              <div className="grid grid-cols-4 gap-1.5">
                {overflowCats.map(({ label, Icon }) => {
                  const isActive = activeCategory === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { handleCategoryChange(label); setShowCategoryDropdown(false); }}
                      style={isActive ? { color: "white" } : {}}
                      className={`flex flex-col items-center gap-1 px-2 pt-2.5 pb-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border ${isActive
                          ? "bg-orange-500 border-orange-500 shadow-sm"
                          : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                        }`}
                    >
                      <Icon size={14} strokeWidth={1.75} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

        {/* Compare bar */}
        {compareIds.length >= 2 && (
          <div className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-primary)]">
              <GitCompare size={16} className="text-indigo-500" />
              <span><strong className="text-indigo-500">{compareIds.length} items</strong> selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCompareIds([])} className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-muted)]">Reset</button>
              <button onClick={() => setShowCompareModal(true)} style={{ color: "white" }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold shadow-sm">
                <Sparkles size={13} /> Compare with AI
              </button>
            </div>
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            {aiMode ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--ui-text-primary)]">Analyzing specifications…</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">Huntr AI is scoring the best matches</p>
                </div>
              </>
            ) : (
              <Loader2 size={28} className="animate-spin text-orange-500" />
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)] gap-3">
            <Package size={32} className="text-[var(--ui-text-muted)] opacity-25" />
            <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">No catalog items found</p>
          </div>
        ) : (
          <div className={`grid gap-3 sm:gap-4 ${cartPanelOpen ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
            {items.map(item => {
              const isSelected = compareIds.includes(item.id);
              const justAdded = addedId === item.id;
              const inCart = cart.some(c => c.id === String(item.id));
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`${getCompanyPrefix()}/marketplace/${item.id}`)}
                  className={`group rounded-xl border bg-[var(--ui-bg-card)] overflow-hidden flex flex-col transition-all cursor-pointer hover:border-orange-400/50 hover:shadow-md ${isSelected ? "border-indigo-500/60 ring-2 ring-indigo-500/20" : "border-[var(--ui-border)]"
                    }`}
                >
                  {/* Image */}
                  <div className="relative h-32 sm:h-40 bg-[var(--ui-bg-input)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(item.image_url || item.image_path) ? (
                      <img
                        src={getAssetUrl(item.image_url || item.image_path)}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <Package size={28} className="text-[var(--ui-text-muted)] opacity-20" />
                    )}
                    {/* Compare toggle */}
                    <button
                      type="button"
                      aria-label="Compare"
                      onClick={e => { e.stopPropagation(); toggleCompare(item.id); }}
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-black/40 text-white/80 hover:bg-black/60"
                        }`}
                    >
                      {isSelected ? <CheckCircle2 size={13} /> : <GitCompare size={12} />}
                    </button>
                    {/* In-cart indicator */}
                    {inCart && !justAdded && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={11} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 truncate">
                      {item.category || "General"}
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--ui-text-primary)] line-clamp-2 leading-snug flex-1">
                      {item.name}
                    </h3>
                    {item.brand && (
                      <p className="text-[10px] text-[var(--ui-text-muted)] truncate">
                        <span className="font-medium">Brand:</span> {item.brand}
                      </p>
                    )}
                    {item.price > 0 && (
                      <div className="text-xs font-bold text-orange-500">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </div>
                    )}
                    {item.ai_score !== undefined && (
                      <div className="pt-1 border-t border-[var(--ui-border)]">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">
                          <Sparkles size={10} /> {item.ai_score}% Match
                        </span>
                        {item.ai_explanation && (
                          <p className="text-[10px] text-[var(--ui-text-muted)] italic line-clamp-2 mt-0.5">{item.ai_explanation}</p>
                        )}
                      </div>
                    )}

                    {/* Add to cart — 1 click, no modal */}
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        aria-label="Add to cart"
                        onClick={e => handleAddToCart(item, e)}
                        style={{ color: "white" }}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${justAdded
                            ? "bg-emerald-500"
                            : inCart
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "bg-orange-500 hover:bg-orange-600"
                          }`}
                      >
                        {justAdded ? (
                          <><CheckCircle2 size={13} /> Added!</>
                        ) : inCart ? (
                          <><Plus size={13} /> Add More</>
                        ) : (
                          <><ShoppingCart size={13} /> Add to Cart</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            {getPaginationPages(totalPages, currentPage).map((page, idx) =>
              typeof page === "string" ? (
                <span key={`el-${idx}`} className="px-1 text-xs text-[var(--ui-text-muted)]">…</span>
              ) : (
                <button key={`p-${page}`} onClick={() => handlePageChange(page)} style={currentPage === page ? { color: "white" } : {}} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === page ? "bg-orange-500" : "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)]"}`}>
                  {page}
                </button>
              )
            )}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
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
