import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import { getCatalogues } from "../lib/api";
import { aiSearch, aiGeneratePr, isAiQuery, aiCompareText } from "../lib/api/ai";
import AiInsightCard from "../components/AiInsightCard";
import AiCompareModal from "../components/AiCompareModal";
import {
  ShoppingCart, Search, Filter, Plus, Minus, Trash2,
  CheckCircle2, Loader2, Package, X, Sparkles, GitCompare, ArrowRight,
  SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown,
  LayoutGrid, Wrench, Monitor, Sofa, Paperclip, Handshake,
  Settings2, Zap, Building2, FlaskConical, HardHat, PenLine,
  Coffee, BoxIcon, Megaphone, Bookmark, type LucideIcon
} from "lucide-react";

const CATEGORY_CONFIG: { label: string; Icon: LucideIcon }[] = [
  { label: "All",            Icon: LayoutGrid   },
  { label: "Hardware",       Icon: Wrench        },
  { label: "Software",       Icon: Monitor       },
  { label: "Furniture",      Icon: Sofa          },
  { label: "Office Supplies",Icon: Paperclip     },
  { label: "Services",       Icon: Handshake     },
  { label: "Spareparts",     Icon: Settings2     },
  { label: "Electronics",    Icon: Zap           },
  { label: "Mechanical",     Icon: Building2     },
  { label: "Chemicals",      Icon: FlaskConical  },
  { label: "Construction",   Icon: HardHat       },
  { label: "Stationery",     Icon: PenLine       },
  { label: "Pantry & F&B",   Icon: Coffee        },
  { label: "Logistics",      Icon: BoxIcon       },
  { label: "Marketing",      Icon: Megaphone     },
  { label: "Other",          Icon: Bookmark      },
];
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import { useNavigate, useSearchParams } from "react-router";
import { getAssetUrl } from "../lib/assets";
import {
  loadCart,
  saveCart,
  addItemToCart as addItemToCartLib,
  getCartItemCount,
} from "../lib/cart";

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>(() => loadCart());
  const skipCartPersist = useRef(true);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  
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

  // Qty modal & toast state
  const [qtyModalItem, setQtyModalItem] = useState<any | null>(null);
  const [qtyValue, setQtyValue] = useState(1);
  const [toast, setToast] = useState<{ name: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    if (showCategoryDropdown) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showCategoryDropdown]);

  const getCompanyPrefix = () => {
    if (!activeCompany) return "";
    const slug = activeCompany.slug || activeCompany.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug ? `/${slug}` : "";
  };

  const getPaginationPages = (total: number, current: number): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const startPage = Math.max(2, current - 1);
    const endPage = Math.min(total - 1, current + 1);

    if (startPage > 2) pages.push("...");
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < total - 1) pages.push("...");
    pages.push(total);
    return pages;
  };

  useEffect(() => {
    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      setActiveCompany(comp);
      if (comp.type === "vendor") navigate("/");
    }
  }, []);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (skipCartPersist.current) {
      skipCartPersist.current = false;
      return;
    }
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    const onCartUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setCart(detail);
      else setCart(loadCart());
    };
    window.addEventListener("huntr-cart-updated", onCartUpdate);
    return () => window.removeEventListener("huntr-cart-updated", onCartUpdate);
  }, []);

  const fetchItems = async (showLoader = true, pageNum = currentPage, categoryName = activeCategory, query = searchTerm) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getCatalogues({ 
        search: query, 
        page: pageNum,
        category: categoryName === "All" ? undefined : categoryName
      });
      const data = res.data || res || [];
      if (res && res.data && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.last_page || 1);
      } else {
        setItems(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch marketplace items", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams(prev => {
      prev.set("page", String(newPage));
      return prev;
    });
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      if (category && category !== "All") prev.set("category", category);
      else prev.delete("category");
      prev.set("page", "1");
      return prev;
    });
  };

  const fetchItemsAi = async (query: string) => {
    try {
      setLoading(true);
      setAiMode(true);
      setAiInsightDismissed(false);
      setComparisonText(null);
      setIsLoadingComparison(false);
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
            .then((r: any) => {
              if (r.success && r.markdown) {
                setComparisonText(r.markdown);
              }
            })
            .catch(() => {})
            .finally(() => setIsLoadingComparison(false));
        }
      } else {
        setAiMode(false);
        setAiSummary(null);
        setAiIntent(null);
        await fetchItems();
      }
    } catch {
      setAiMode(false);
      setAiSummary(null);
      setAiIntent(null);
      await fetchItems();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchParams(prev => {
          if (localSearch) prev.set("search", localSearch);
          else prev.delete("search");
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm]);

  useEffect(() => {
    if (!searchTerm) {
      setAiMode(false);
      setAiSummary(null);
      setAiIntent(null);
      setComparisonText(null);
      setIsLoadingComparison(false);
      fetchItems(true, currentPage, activeCategory, "");
      return;
    }

    if (isAiQuery(searchTerm)) {
      fetchItemsAi(searchTerm);
    } else {
      setAiMode(false);
      setAiSummary(null);
      setAiIntent(null);
      setComparisonText(null);
      setIsLoadingComparison(false);
      fetchItems(true, currentPage, activeCategory, searchTerm);
    }
  }, [searchTerm, activeCategory, currentPage]);

  const handleGeneratePr = async () => {
    setIsGeneratingPr(true);
    try {
      const ids = compareIds.length > 0 ? compareIds : items.slice(0, 10).map((i) => i.id);
      const res = await aiGeneratePr(searchTerm, ids);
      if (res.success && res.draft) {
        localStorage.setItem("ai_pr_draft", JSON.stringify(res.draft));
        navigate(`${getCompanyPrefix()}/checkout?from=ai`);
      }
    } catch (e) {
      console.error("Failed to generate PR", e);
    } finally {
      setIsGeneratingPr(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const addToCart = (item: any) => {
    setQtyModalItem(item);
    setQtyValue(1);
  };

  const confirmAddToCart = () => {
    if (!qtyModalItem) return;
    const updated = addItemToCartLib(qtyModalItem, qtyValue);
    setCart(updated);
    showToast(qtyModalItem.name);
    setQtyModalItem(null);
  };

  const showToast = (name: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ name });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  return (
    <Layout title="Huntr Catalog" subtitle="Standardized corporate procurement catalog">
      <div className="w-full space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {aiMode ? (
              <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
            ) : (
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            )}
            <input
              type="text"
              placeholder="Search products or describe your procurement need (AI-enabled)..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`w-full pl-9 pr-24 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border text-[var(--ui-text-primary)] text-sm outline-none transition-all ${
                aiMode ? "border-purple-500/50 ring-2 ring-purple-500/10" : "border-[var(--ui-border-input)] focus:border-orange-500/50"
              }`}
            />
            {aiMode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                ✦ AI Mode
              </span>
            )}
          </div>
        </div>

        {/* ── Category Selector ── */}
        {(() => {
          const PRIMARY_COUNT = 8; // show first N (incl. "All") as inline chips
          const primaryCats = CATEGORY_CONFIG.slice(0, PRIMARY_COUNT);
          const overflowCats = CATEGORY_CONFIG.slice(PRIMARY_COUNT);
          const activeInOverflow = overflowCats.some(c => c.label === activeCategory);
          return (
            <div className="relative" ref={categoryDropdownRef}>
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* Primary inline chips */}
                {primaryCats.map(({ label, Icon }) => {
                  const isActive = activeCategory === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { handleCategoryChange(label); setShowCategoryDropdown(false); }}
                      style={isActive ? { color: 'white' } : {}}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/30"
                          : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                      }`}
                    >
                      <Icon size={12} strokeWidth={2} />
                      {label}
                    </button>
                  );
                })}

                {/* More button */}
                <button
                  onClick={() => setShowCategoryDropdown(prev => !prev)}
                  style={activeInOverflow ? { color: 'white' } : {}}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    activeInOverflow
                      ? "bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/30"
                      : showCategoryDropdown
                        ? "bg-[var(--ui-bg-input)] border-orange-400/50 text-orange-500"
                        : "bg-[var(--ui-bg-card)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                  }`}
                >
                  {activeInOverflow
                    ? (
                      <>
                        {(() => { const c = overflowCats.find(c => c.label === activeCategory)!; return <c.Icon size={12} strokeWidth={2} />; })()}
                        {activeCategory}
                      </>
                    )
                    : (
                      <>
                        More <ChevronDown size={11} className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
                      </>
                    )
                  }
                </button>
              </div>

              {/* Overflow dropdown panel */}
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
                          style={isActive ? { color: 'white' } : {}}
                          className={`flex flex-col items-center gap-1 px-2 pt-2.5 pb-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all border ${
                            isActive
                              ? "bg-orange-500 border-orange-500 shadow-sm"
                              : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:border-orange-400/50 hover:text-orange-500"
                          }`}
                        >
                          <Icon size={14} strokeWidth={1.75} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* AI Insight Card */}
        {aiMode && aiSummary && !aiInsightDismissed && (
          <AiInsightCard
            summary={aiSummary}
            totalFound={items.length}
            query={searchTerm}
            catalogueIds={items.slice(0, 10).map((i) => i.id)}
            onGeneratePr={handleGeneratePr}
            onDismiss={() => setAiInsightDismissed(true)}
            isGenerating={isGeneratingPr}
            comparisonAnalysis={comparisonText}
            isComparison={!!aiIntent?.is_comparison || isLoadingComparison}
            specs={aiIntent?.specs ?? []}
          />
        )}

        {/* Compare Floating Bar */}
        {compareIds.length >= 2 && (
          <div className="flex items-center justify-between p-3.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-primary)]">
              <GitCompare size={16} className="text-indigo-500" />
              <span><strong className="text-indigo-500">{compareIds.length} items</strong> selected to compare</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCompareIds([])} className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]">
                Reset
              </button>
              <button onClick={() => setShowCompareModal(true)} style={{ color: 'white' }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold shadow-sm">
                <Sparkles size={13} /> Compare with AI
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            {aiMode ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--ui-text-primary)]">Analyzing specifications...</p>
                  <p className="text-xs text-[var(--ui-text-muted)]">Huntr AI is scoring the best matches for you</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {items.map((item) => {
              const isSelected = compareIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`${getCompanyPrefix()}/marketplace/${item.id}`)}
                  className={`group rounded-2xl border bg-[var(--ui-bg-card)] overflow-hidden flex flex-col transition-all cursor-pointer hover:shadow-lg hover:shadow-black/5 ${
                    isSelected ? "border-indigo-500/60 ring-2 ring-indigo-500/20" : "border-[var(--ui-border)]"
                  }`}
                >
                  {/* Image Area — matches landing h-36 sm:h-44 */}
                  <div className="relative h-36 sm:h-44 bg-[var(--ui-bg-input)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(item.image_url || item.image_path) ? (
                      <img
                        src={getAssetUrl(item.image_url || item.image_path)}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    ) : (
                      <Package size={32} className="text-[var(--ui-text-muted)] opacity-30" />
                    )}

                    {/* Compare toggle button */}
                    <button
                      type="button"
                      aria-label="Compare"
                      onClick={(e) => { e.stopPropagation(); toggleCompare(item.id); }}
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isSelected ? "bg-indigo-600 text-white shadow-sm" : "bg-black/40 text-white/80 hover:bg-black/60"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 size={13} /> : <GitCompare size={12} />}
                    </button>
                  </div>

                  {/* Content — matches landing p-3 sm:p-4 */}
                  <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 truncate">
                      {item.category || "General"}
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--ui-text-primary)] line-clamp-2 leading-snug flex-1">
                      {item.name}
                    </h3>
                    
                    {item.brand && (
                      <p className="text-[10px] sm:text-xs text-[var(--ui-text-muted)] truncate">
                        <span className="font-medium">Brand:</span> {item.brand}
                      </p>
                    )}

                    {/* Price */}
                    {item.price > 0 && (
                      <div className="text-xs font-bold text-orange-500 mt-0.5">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </div>
                    )}

                    {/* AI Score */}
                    {item.ai_score !== undefined && (
                      <div className="pt-1 border-t border-[var(--ui-border)]">
                        <span className="inline-block text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">
                          🤖 {item.ai_score}% Match
                        </span>
                        {item.ai_explanation && (
                          <p className="text-[10px] text-[var(--ui-text-muted)] italic line-clamp-2 mt-0.5">
                            {item.ai_explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Add to Cart button */}
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        aria-label="Add to cart"
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        style={{ color: 'white' }}
                        className="w-full py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <ShoppingCart size={13} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {getPaginationPages(totalPages, currentPage).map((page, idx) => (
              typeof page === "string" ? (
                <span key={`el-${idx}`} className="px-1 text-xs text-[var(--ui-text-muted)]">...</span>
              ) : (
                <button
                  key={`p-${page}`}
                  onClick={() => handlePageChange(page)}
                  style={currentPage === page ? { color: 'white' } : {}}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page ? "bg-orange-500" : "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)]"
                  }`}
                >
                  {page}
                </button>
              )
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-xs font-semibold text-[var(--ui-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
          onAddToCart={(item) => { addToCart(item); setShowCompareModal(false); }}
        />
      )}

      {/* Modern Quantity Modal */}
      {qtyModalItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[999] p-4"
          onClick={() => setQtyModalItem(null)}
        >
          <div
            className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--ui-text-primary)] leading-snug">Set Quantity</h3>
                <p className="text-xs text-[var(--ui-text-muted)] line-clamp-1 mt-0.5">{qtyModalItem.name}</p>
              </div>
              <button onClick={() => setQtyModalItem(null)} className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]">
                <X size={16} />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg-input)] p-1">
              <button
                onClick={() => setQtyValue(Math.max(1, qtyValue - 1))}
                className="w-9 h-9 rounded-md bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-primary)] hover:border-orange-500/40"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={qtyValue}
                onChange={(e) => setQtyValue(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-20 text-center font-bold text-base bg-transparent border-none text-[var(--ui-text-primary)] outline-none"
              />
              <button
                onClick={() => setQtyValue(qtyValue + 1)}
                className="w-9 h-9 rounded-md bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-primary)] hover:border-orange-500/40"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="text-[11px] text-center text-[var(--ui-text-muted)]">
              Unit of measure: <span className="font-semibold text-[var(--ui-text-secondary)]">{qtyModalItem.uom || "unit"}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setQtyModalItem(null)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                style={{ color: 'white' }}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[var(--ui-bg-card)] border border-emerald-500/30 p-3.5 px-4 rounded-xl shadow-xl flex items-center gap-3 z-50 text-xs font-semibold text-[var(--ui-text-primary)]">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <span className="truncate max-w-[200px]">Added <strong>{toast.name}</strong></span>
          <button
            onClick={() => navigate(`${getCompanyPrefix()}/cart`)}
            className="text-orange-500 font-bold hover:underline ml-1"
          >
            View Cart
          </button>
        </div>
      )}
    </Layout>
  );
}
