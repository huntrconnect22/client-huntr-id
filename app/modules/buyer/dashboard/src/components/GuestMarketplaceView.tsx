import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useNavigation } from "react-router";
import { Search, Package, Loader2, ChevronDown, ShieldCheck, Truck, ChevronLeft, ChevronRight as ChevronRightIcon, Menu, X, CreditCard, Briefcase, Tag, TrendingUp, Utensils, Sparkles } from "lucide-react";
import { getCatalogues, aiSearch, isAiQuery } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useLanguage } from "../../context/LanguageContext";

const CATEGORIES = [
  "All", "Hardware", "Software", "Furniture", "Office Supplies",
  "Services", "Spareparts", "Electronics", "Mechanical",
  "Chemicals", "Construction", "Stationery", "Pantry & F&B",
  "Logistics", "Marketing", "Other"
];

const FEATURE_CARDS = [
  { icon: <TrendingUp size={20} />, title: "Huntr Crowd Buy", sub: "Kelola distribusi online dan offline" },
  { icon: <CreditCard size={20} />, title: "Huntr Pay", sub: "Akses modal & pembayaran fleksibel" },
  { icon: <Utensils size={20} />, title: "HuntrFood", sub: "Solusi F&B untuk kebutuhan kantor" },
];

export function GuestMarketplaceView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const activeCategory = searchParams.get("category") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ summary: string; category?: string; keywords?: string[]; products?: any[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);

  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  // Reset local clicked product loader once navigation completes
  useEffect(() => {
    if (!isNavigating) {
      setClickedProductId(null);
    }
  }, [isNavigating]);

  // Sync local search input when URL query changes (e.g. back navigation)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounce search input changes to the URL parameter
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchParams(prev => {
          if (localSearch) prev.set("search", localSearch);
          else prev.delete("search");
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [localSearch, searchTerm]);

  // Main data fetching effect
  useEffect(() => {
    fetchItems(currentPage);
  }, [searchTerm, activeCategory, currentPage]);

  // AI-powered search: fires only for descriptive queries
  useEffect(() => {
    if (!isAiQuery(searchTerm)) {
      setAiResult(null);
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    const t = setTimeout(async () => {
      try {
        const res = await aiSearch(searchTerm);
        if (res?.success && res?.ai_summary) {
          setAiResult({
            summary: res.ai_summary,
            category: res.intent?.category ?? undefined,
            keywords: res.intent?.keywords ?? [],
            products: Array.isArray(res.data) ? res.data : [],
          });
          // Override product list with AI-ranked results
          if (Array.isArray(res.data) && res.data.length > 0) {
            setItems(res.data);
          }
        }
      } catch (e) {
        console.warn("[AI Search] failed, falling back to normal search", e);
      } finally {
        setAiLoading(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchItems = async (page = 1) => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    try {
      setLoading(true);
      const res = await getCatalogues({
        search: searchTerm,
        category: activeCategory === "All" ? undefined : activeCategory,
        page,
        per_page: isDesktop ? 24 : undefined,
      });
      if (res?.data && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.last_page || 1);
      } else {
        const d = res?.data || res || [];
        setItems(Array.isArray(d) ? d : []);
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setSearchParams(prev => {
      prev.set("page", String(p));
      return prev;
    });
  };

  const setActiveCategory = (val: string) => {
    setSearchParams(prev => {
      prev.set("category", val);
      prev.set("page", "1");
      return prev;
    });
  };

  /* ─── inline styles (no Tailwind, no heavy CSS) ─── */
  const s = {
    /* layout */
    page: { minHeight: "100vh", background: "#f4f4f4", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#222" } as React.CSSProperties,
    logo: { height: "36px", width: "auto", objectFit: "contain" as const, flexShrink: 0 },
    searchInput: {
      flex: 1, border: "none", outline: "none", padding: "0 16px",
      fontSize: "14px", background: "transparent", color: "#111", height: "40px",
    },
    searchBtn: {
      background: "#f97316", border: "none", cursor: "pointer",
      padding: "0 20px", display: "flex", alignItems: "center", gap: "8px",
      color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0,
    },
    topLink: {
      fontSize: "12px", color: "#ccc", textDecoration: "none",
      display: "flex", alignItems: "center", gap: "4px", cursor: "pointer",
      whiteSpace: "nowrap" as const,
    },
    divider: { width: "1px", height: "18px", background: "#444" },
    btnOutline: {
      padding: "5px 14px", border: "1px solid #f97316", borderRadius: "3px",
      color: "#f97316", background: "transparent", cursor: "pointer",
      fontSize: "12px", fontWeight: 700, textDecoration: "none",
    },
    btnFill: {
      padding: "5px 14px", border: "none", borderRadius: "3px",
      background: "#f97316", color: "#fff", cursor: "pointer",
      fontSize: "12px", fontWeight: 700, textDecoration: "none",
    },
    /* category chips */
    catChip: (active: boolean): React.CSSProperties => ({
      padding: "7px 14px", fontSize: "12px", cursor: "pointer",
      color: active ? "#f97316" : "#444", fontWeight: active ? 700 : 500,
      borderRight: "1px solid #e5e5e5", whiteSpace: "nowrap",
      background: active ? "#fff4eb" : "transparent",
      transition: "all 0.15s",
    }),
    /* product grid */
    productCard: {
      background: "#fff", border: "1px solid #e5e5e5", borderRadius: "3px",
      cursor: "pointer", overflow: "hidden", transition: "box-shadow 0.15s",
    },
    productImg: {
      width: "100%", aspectRatio: "1/1", background: "#f8f8f8",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    },
    productBody: { padding: "10px" },
    /* section header */
    sectionHead: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: "2px solid #f97316", paddingBottom: "8px",
    },
    inner: { maxWidth: "1200px", margin: "0 auto", padding: "0 20px" },
  };

  return (
    <div style={s.page}>
      {/* ── TOP HEADER (dark, Ralali-style) ───────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.5)] px-4 sm:px-6 md:px-7 py-3 md:py-0 md:h-[62px] flex flex-col md:flex-row md:items-center gap-3 md:gap-5 justify-between">
        {/* Row 1: Logo & Hamburger */}
        <div className="flex items-center justify-between w-full md:w-auto flex-shrink-0">
          <Link to="/">
            <img src="/assets/img/logo/sidebar.png" alt="Huntr Logo" style={s.logo} />
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher
              buttonStyle={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#f3f4f6",
                height: 32,
                padding: "3px 8px",
              }}
            />
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="text-white hover:text-[#f97316] transition-colors p-1"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Bar - Full width on mobile, centered on desktop */}
        <div className="w-full md:flex-1 md:max-w-[600px] flex items-stretch bg-white rounded overflow-hidden shadow-[0_0_0_2px_#f97316] h-[38px] md:h-[40px]">
          <input
            type="text"
            placeholder={t("guestMarketplace.searchPlaceholder")}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            style={s.searchInput}
            className="flex-1 border-none outline-none px-4 text-sm bg-transparent text-[#111] h-full"
          />
          <button
            onClick={() => fetchItems(1)}
            style={s.searchBtn}
            className="bg-[#f97316] border-none cursor-pointer px-5 flex items-center gap-2 text-white text-xs md:text-sm font-bold flex-shrink-0"
          >
            <Search size={15} />
            <span className="hidden sm:inline">{t("guestMarketplace.searchBtn")}</span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 ml-auto flex-shrink-0">
          <Link to="/track" style={s.topLink}>
            <Truck size={13} /> {t("guestMarketplace.trackOrder")}
          </Link>
          <Link to="/verify" style={s.topLink}>
            <ShieldCheck size={13} /> {t("guestMarketplace.verify")}
          </Link>
          <div style={s.divider} />
          <Link to="/register" style={{ ...s.topLink, color: "#f97316", fontWeight: 700 }}>{t("guestMarketplace.becomeVendor")}</Link>
          <div style={s.divider} />
          <LanguageSwitcher
            buttonStyle={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#f3f4f6",
              height: 32,
              padding: "4px 8px",
            }}
          />
          <div style={s.divider} />
          <Link to="/login" style={s.btnOutline}>{t("guestMarketplace.login")}</Link>
          <Link to="/register" style={s.btnFill}>{t("guestMarketplace.register")}</Link>
        </nav>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#1a1a1a] border-t border-[#333] shadow-lg p-5 flex flex-col gap-4 z-40 transition-all duration-300">
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white flex items-center gap-3 text-sm py-2"
            >
              <Truck size={16} className="text-[#f97316]" /> {t("guestMarketplace.trackOrder")}
            </Link>
            <Link
              to="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white flex items-center gap-3 text-sm py-2"
            >
              <ShieldCheck size={16} className="text-[#f97316]" /> {t("guestMarketplace.verify")}
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#f97316] font-bold flex items-center gap-3 text-sm py-2"
            >
              {t("guestMarketplace.becomeVendor")}
            </Link>
            <div className="h-px bg-[#333] my-1" />
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center border border-[#f97316] rounded text-[#f97316] font-bold text-sm bg-transparent"
              >
                {t("guestMarketplace.login")}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center rounded bg-[#f97316] text-white font-bold text-sm"
              >
                {t("guestMarketplace.register")}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT (below fixed headers) ───────────────────────── */}
      <div className="pt-[130px] sm:pt-[120px] md:pt-[82px] pb-[60px]">

        {/* ── HERO BANNER ────────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main banner */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#fff4eb] to-[#fde8cc] border border-[#f7d9b0] rounded py-8 px-6 sm:py-10 sm:px-10 flex flex-col justify-center min-h-[180px] sm:min-h-[220px]">
              <span className="text-[#f97316] font-extrabold text-xs uppercase tracking-wider">
                {t("guestMarketplace.platformTag")}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#111] my-3 leading-tight">
                {t("guestMarketplace.heroTitle")}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-[480px]">
                {t("guestMarketplace.heroDesc")}
              </p>
            </div>

            {/* Side banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-white border border-[#e5e5e5] rounded p-4 flex items-center gap-3.5">
                <div className="bg-[#fff4eb] text-[#f97316] w-[38px] h-[38px] rounded flex items-center justify-center flex-shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#111]">{t("guestMarketplace.ebiddingTitle")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t("guestMarketplace.ebiddingSub")}</div>
                </div>
              </div>
              <div className="bg-white border border-[#e5e5e5] rounded p-4 flex items-center gap-3.5">
                <div className="bg-[#fff4eb] text-[#f97316] w-[38px] h-[38px] rounded flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#111]">{t("guestMarketplace.verifiedVendorsTitle")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t("guestMarketplace.verifiedVendorsSub")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURE CARDS ROW ─────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { icon: <TrendingUp size={20} />, title: t("guestMarketplace.crowdBuyTitle"), sub: t("guestMarketplace.crowdBuySub") },
              { icon: <CreditCard size={20} />, title: t("guestMarketplace.payTitle"), sub: t("guestMarketplace.paySub") },
              { icon: <Utensils size={20} />, title: t("guestMarketplace.foodTitle"), sub: t("guestMarketplace.foodSub") },
            ].map(c => (
              <div key={c.title} className="bg-[#1e293b] text-white rounded p-4 flex items-start gap-3 cursor-pointer hover:bg-[#334155] transition-colors">
                <span className="text-[#f97316] flex-shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <div className="font-bold text-xs sm:text-sm">{c.title}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CATEGORY CHIPS ─────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          <div className="flex overflow-x-auto scrollbar-none border border-[#e5e5e5] rounded bg-white">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...s.catChip(activeCategory === cat),
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {cat === "All" ? (
                  <>
                    <Tag size={14} className={activeCategory === cat ? "text-[#f97316]" : "text-gray-500"} />
                    <span>{t("guestMarketplace.allCategory")}</span>
                  </>
                ) : cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── AI RECOMMENDATION PANEL ────────────────────────────────────── */}
        {(aiLoading || aiResult) && searchTerm && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-5">
            <div style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e293b 100%)",
              border: "1px solid #4338ca",
              borderRadius: "8px",
              padding: "20px 22px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decorative glow */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160,
                background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} color="#a78bfa" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {t("guestMarketplace.aiRecommendation")}
                  </span>
                </div>
                {!aiLoading && (
                  <button
                    onClick={() => { setAiResult(null); }}
                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}
                    aria-label="Tutup panel AI"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Loading state */}
              {aiLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#c4b5fd" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: 13 }}>{t("guestMarketplace.aiAnalyzing")}</span>
                </div>
              )}

              {/* Result state */}
              {!aiLoading && aiResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Summary text */}
                  <p style={{ margin: 0, fontSize: 13, color: "#e0e7ff", lineHeight: 1.7 }}>
                    {aiResult.summary}
                  </p>

                  {/* Detected category + keywords */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {aiResult.category && (
                      <button
                        onClick={() => {
                          const matched = ["Hardware","Software","Furniture","Office Supplies","Services",
                            "Spareparts","Electronics","Mechanical","Chemicals","Construction",
                            "Stationery","Pantry & F&B","Logistics","Marketing","Other"
                          ].find(c => c.toLowerCase() === aiResult.category?.toLowerCase());
                          if (matched) setActiveCategory(matched);
                        }}
                        style={{
                          background: "rgba(167,139,250,0.2)", border: "1px solid #7c3aed",
                          borderRadius: "4px", padding: "3px 10px",
                          color: "#c4b5fd", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", textTransform: "capitalize",
                        }}
                      >
                        # {aiResult.category}
                      </button>
                    )}
                    {aiResult.keywords?.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        style={{
                          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: "4px", padding: "3px 10px",
                          color: "#a5b4fc", fontSize: 11, fontWeight: 500,
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Product count info */}
                  {aiResult.products && aiResult.products.length > 0 && (
                    <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                      {t("guestMarketplace.aiRelevantProducts", { count: aiResult.products.length })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCT SECTION ─────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
          <div style={s.sectionHead}>
            <h2 className="m-0 text-base font-extrabold text-[#111]" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {aiResult ? (
                <>
                  <Sparkles size={15} color="#7c3aed" />
                  {t("guestMarketplace.aiSearchResults")}
                </>
              ) : t("guestMarketplace.recommendedProducts")}
            </h2>
          </div>

          {loading ? (
            <div className="py-[60px] text-center">
              <Loader2 className="animate-spin" size={36} color="#f97316" style={{ margin: "0 auto" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="py-[60px] text-center text-[#999]">
              <Package size={48} style={{ opacity: 0.15, margin: "0 auto 16px" }} />
              <p className="text-sm">{t("guestMarketplace.noProducts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {items.map(item => {
                const isCardLoading = clickedProductId === String(item.id) && isNavigating;
                return (
                  <div
                    key={item.id}
                    style={{
                      ...s.productCard,
                      opacity: isCardLoading ? 0.75 : 1,
                      pointerEvents: isNavigating ? "none" : "auto",
                    }}
                    onClick={() => {
                      setClickedProductId(String(item.id));
                      navigate(`/marketplace/${item.id}`);
                    }}
                    onMouseEnter={e => {
                      if (!isCardLoading) e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={e => {
                      if (!isCardLoading) e.currentTarget.style.boxShadow = "none";
                    }}
                    className="bg-white border border-[#e5e5e5] rounded cursor-pointer overflow-hidden transition-all duration-150"
                  >
                    <div style={{ ...s.productImg, position: "relative" }}>
                      {isCardLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <Loader2 className="animate-spin" size={24} color="#f97316" />
                          <span style={{ fontSize: 10, color: "#f97316", fontWeight: 700 }}>{t("guestMarketplace.loadingProducts")}</span>
                        </div>
                      ) : (item.image_url || item.image_path) ? (
                        <img
                          src={getAssetUrl(item.image_url || item.image_path)}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ) : (
                        <Package size={32} color="rgba(249,115,22,0.15)" />
                      )}
                    </div>
                  <div style={s.productBody}>
                    <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                      {item.category || "General"}
                    </div>
                    <div style={{
                      fontSize: "12px", fontWeight: 600, color: "#222",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden", lineHeight: 1.35, height: "2.7em",
                    }}>
                      {item.name}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (() => {
            const delta = 1;
            const pages: (number | "…")[] = [];
            const left = Math.max(2, currentPage - delta);
            const right = Math.min(totalPages - 1, currentPage + delta);
            pages.push(1);
            if (left > 2) pages.push("…");
            for (let i = left; i <= right; i++) pages.push(i);
            if (right < totalPages - 1) pages.push("…");
            if (totalPages > 1) pages.push(totalPages);

            const pgBtn = (label: React.ReactNode, page: number, disabled?: boolean, active?: boolean): React.ReactNode => (
              <button
                key={`pg-${page}-${label}`}
                onClick={() => handlePage(page)}
                disabled={disabled}
                style={{
                  minWidth: "32px", height: "32px", borderRadius: "3px",
                  border: active ? "none" : "1px solid #ddd",
                  background: active ? "#f97316" : disabled ? "#f4f4f4" : "#fff",
                  color: active ? "#fff" : disabled ? "#aaa" : "#333",
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: "12px", fontWeight: 700, padding: "0 8px",
                }}
              >
                {label}
              </button>
            );

            return (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "32px" }}>
                {pgBtn(<ChevronLeft size={14} />, currentPage - 1, currentPage === 1)}
                {pages.map((p, i) =>
                  p === "…"
                    ? <span key={`dots-${i}`} style={{ padding: "0 4px", color: "#999", fontSize: "12px" }}>…</span>
                    : pgBtn(p, p as number, false, currentPage === p)
                )}
                {pgBtn(<ChevronRightIcon size={14} />, currentPage + 1, currentPage === totalPages)}
              </div>
            );
          })()}
        </div>

        {/* ── CTA SECTION ───────────────────────────────────────────────── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>

            {/* Buyer CTA */}
            <div style={{
              background: "linear-gradient(135deg, #fff4eb 0%, #fde8cc 100%)",
              border: "1px solid #f7d9b0",
              borderRadius: "8px",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#111" }}>
                {t("guestMarketplace.cantFindTitle")}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.7 }}>
                {t("guestMarketplace.cantFindDesc")}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginTop: "4px" }}>
                <Link
                  to="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f97316",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    boxShadow: "0 2px 6px rgba(249,115,22,0.25)",
                  }}
                >
                  {t("guestMarketplace.contactTeam")}
                </Link>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "transparent",
                    color: "#f97316",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    padding: "9px 20px",
                    borderRadius: "4px",
                    border: "1px solid #f97316",
                  }}
                >
                  {t("guestMarketplace.loginAccount")}
                </Link>
              </div>
            </div>

            {/* Vendor CTA */}
            <div style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#fff" }}>
                {t("guestMarketplace.haveProductTitle")}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: 1.7 }}>
                {t("guestMarketplace.haveProductDesc")}
              </p>
              <Link
                to="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f97316",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  boxShadow: "0 2px 6px rgba(249,115,22,0.3)",
                  marginTop: "4px",
                }}
              >
                {t("guestMarketplace.registerVendor")}
              </Link>
            </div>

          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid #e5e5e5", background: "#fff", marginTop: "40px", padding: "32px 24px 16px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px" }}>
            <div>
              <img src="/assets/img/logo/sidebar.png" alt="Huntr Logo" style={{ height: "28px", marginBottom: "12px", objectFit: "contain" }} />
              <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.6, margin: 0 }}>
                Platform B2B e-procurement enterprise untuk efisiensi pengadaan bisnis.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#222", marginBottom: "12px" }}>Platform</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><Link to="/marketplace" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Marketplace</Link></li>
                <li><Link to="/register" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Vendor Registration</Link></li>
                <li><Link to="/login" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Buyer Portal</Link></li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#222", marginBottom: "12px" }}>Tools</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><Link to="/track" style={{ fontSize: "12px", color: "#888", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}><Truck size={11} color="#f97316" /> Track Order</Link></li>
                <li><Link to="/verify" style={{ fontSize: "12px", color: "#888", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}><ShieldCheck size={11} color="#f97316" /> Verify Document</Link></li>
              </ul>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#222", marginBottom: "12px" }}>Perusahaan</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="https://www.huntr.id/our-company" target="_blank" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Tentang Kami</a></li>
                <li><a href="https://www.huntr.id/privacy-policy" target="_blank" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Kebijakan Privasi</a></li>
                <li><a href="#" style={{ fontSize: "12px", color: "#888", textDecoration: "none" }}>Syarat &amp; Ketentuan</a></li>
              </ul>
            </div>
          </div>
          <div style={{ maxWidth: "1200px", margin: "24px auto 0", borderTop: "1px solid #f0f0f0", paddingTop: "14px", textAlign: "center", fontSize: "11px", color: "#bbb" }}>
            © 2026 Huntr.id – Enterprise Procurement Ecosystem. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
