import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLoaderData } from "react-router";
import Layout from "../components/Layout";
import { getCatalogue } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import {
  addItemToCart, loadCart,
  type CartItem,
} from "../lib/cart";
import {
  Package, ShoppingCart, ArrowLeft, CheckCircle2,
  Plus, Tag, Ruler,
} from "lucide-react";
import type { Route } from "./+types/marketplace-detail";

/* ── SSR Loader ────────────────────────────────────────────────────── */
export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) throw new Response("Not Found", { status: 404 });
  try {
    const res = await getCatalogue(params.id);
    const product = res?.data ?? res;
    return { product };
  } catch {
    return { product: null };
  }
}

export function meta({ data }: Route.MetaArgs) {
  const p = data?.product;
  if (!p) return [{ title: "Product Not Found | Huntr.id" }];
  const title = `${p.name} | Huntr.id`;
  const desc  = (p.specifications || `Buy ${p.name} on Huntr.id.`).substring(0, 160);
  const canonical = `https://app.huntr.id/marketplace/${p.id}`;
  const img   = (p.image_url || p.image_path) ? getAssetUrl(p.image_url || p.image_path) : (p.image || "https://app.huntr.id/assets/img/logo/sidebar.png");
  return [
    { title }, { name: "description", content: desc },
    { rel: "canonical", href: canonical },
    { property: "og:title",       content: title },
    { property: "og:description", content: desc  },
    { property: "og:image",       content: img   },
    { property: "og:url",         content: canonical },
    { name: "twitter:card",        content: "summary_large_image" },
    { name: "twitter:title",       content: title },
    { name: "twitter:description", content: desc  },
    { name: "twitter:image",       content: img   },
  ];
}

/* ── Specs block ───────────────────────────────────────────────────── */
function SpecsBlock({ text }: { text?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-xs text-[var(--ui-text-muted)] italic">No specifications provided.</p>;
  return (
    <div>
      <div className={`text-xs text-[var(--ui-text-primary)] leading-relaxed whitespace-pre-wrap break-words overflow-hidden transition-all ${expanded ? "" : "max-h-24"}`}>
        {text}
      </div>
      <button onClick={() => setExpanded(p => !p)} className="text-xs font-semibold text-orange-500 hover:underline mt-1.5">
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

/* ── Guest header ──────────────────────────────────────────────────── */
function GuestHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] shadow-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <Link to="/"><img src="/assets/img/logo/sidebar.png" alt="Huntr" className="h-8 w-auto object-contain" /></Link>
      <nav className="flex items-center gap-3">
        <Link to="/login"    className="px-3.5 py-1.5 border border-orange-500 rounded text-orange-500 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all">Sign In</Link>
        <Link to="/register" className="px-3.5 py-1.5 bg-orange-500 rounded text-white text-xs font-bold hover:bg-orange-600 transition-all">Register</Link>
      </nav>
    </header>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export default function MarketplaceDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();

  const [item, setItem]       = useState<any>(loaderData?.product ?? null);
  const [loading, setLoading] = useState(!loaderData?.product);
  const [error, setError]     = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [cart, setCart]       = useState<CartItem[]>(() => loadCart());
  const [justAdded, setJustAdded] = useState(false);

  /* ── Helpers ── */
  const getCompanyPrefix = () => {
    try {
      const c = JSON.parse(localStorage.getItem("active_company") || "{}");
      const slug = c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return slug ? `/${slug}` : "";
    } catch { return ""; }
  };

  /* ── Init ── */
  useEffect(() => {
    setIsGuest(!localStorage.getItem("user_session"));
  }, []);

  useEffect(() => {
    if (!id) { setError("Product not found."); setLoading(false); return; }
    if (loaderData?.product && String(loaderData.product.id) === id) {
      setItem(loaderData.product); setLoading(false); return;
    }
    setLoading(true);
    getCatalogue(id)
      .then(res => { const p = res?.data ?? res; p ? setItem(p) : setError("Product data is empty."); })
      .catch(() => setError("Failed to load product details."))
      .finally(() => setLoading(false));
  }, [id, loaderData]);

  /* ── Cart sync ── */
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setCart(Array.isArray(d) ? d : loadCart());
    };
    window.addEventListener("huntr-cart-updated", h);
    return () => window.removeEventListener("huntr-cart-updated", h);
  }, []);

  /* ── Add to cart — no modal ── */
  const handleAddToCart = () => {
    if (!item) return;
    const updated = addItemToCart(item as any, 1);
    setCart(updated);
    window.dispatchEvent(new CustomEvent("huntr-open-cart"));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const inCart   = cart.some(c => String(c.id) === String(item?.id));
  const imageUrl = item?.image_url || item?.image_path
    ? getAssetUrl(item.image_url || item.image_path)
    : (item?.image || null);

  /* ── Guest view ── */
  if (isGuest) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)]">
        <GuestHeader />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-orange-500 font-bold text-xs"><ArrowLeft size={14} /> Back</Link>
          {item && (
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <Package size={48} className="opacity-30" />}
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{item.category || "General"}</span>
                  <h1 className="text-lg font-bold mt-1">{item.name}</h1>
                  <p className="text-xs text-[var(--ui-text-muted)]">SKU: {item.item_code}</p>
                </div>
                {item.price > 0 && (
                  <div className="text-xl font-bold text-emerald-500">
                    Rp {Number(item.price).toLocaleString("id-ID")} <span className="text-xs font-normal text-[var(--ui-text-muted)]">/ {item.uom}</span>
                  </div>
                )}
                <button onClick={() => navigate("/login")} style={{ color: "white" }} className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={15} /> Sign In to Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Authenticated view ── */
  return (
    <Layout title={item?.name || "Product Detail"} subtitle="Product details from vendor catalog">
      <div className="w-full space-y-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs hover:underline">
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        {loading && <div className="flex justify-center py-16"><Package size={28} className="animate-spin text-orange-500" /></div>}
        {error   && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">{error}</div>}

        {!loading && !error && item && (
          <div className="flex gap-5 items-start">

            {/* Image */}
            <div className="flex-shrink-0 w-56 xl:w-72 hidden md:block border border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg-card)] p-4">
              <div className="w-full aspect-square rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center overflow-hidden">
                {imageUrl
                  ? <img src={imageUrl} alt={item.name} className="w-full h-full object-contain" />
                  : <Package size={40} className="text-[var(--ui-text-muted)] opacity-20" />}
              </div>
              {/* Mobile: show image full width */}
            </div>

            {/* Main detail */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Mobile image */}
              <div className="md:hidden w-full border border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg-card)] p-4">
                <div className="w-full aspect-video rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center overflow-hidden">
                  {imageUrl ? <img src={imageUrl} alt={item.name} className="w-full h-full object-contain" /> : <Package size={40} className="opacity-20" />}
                </div>
              </div>

              {/* Info card */}
              <div className="border border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg-card)] p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{item.category || "General"}</span>
                  <h1 className="text-xl font-bold text-[var(--ui-text-primary)] mt-2 leading-snug">{item.name}</h1>
                  {item.brand && <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">by <span className="font-semibold text-[var(--ui-text-secondary)]">{item.brand}</span></p>}
                </div>

                {item.price > 0 && (
                  <div className="p-3.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider">Estimated Price</span>
                    <div className="text-2xl font-black text-emerald-500 mt-0.5">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                      <span className="text-sm font-semibold text-[var(--ui-text-muted)] ml-1">/ {item.uom}</span>
                    </div>
                  </div>
                )}

                {/* Metadata pills */}
                <div className="flex flex-wrap gap-2">
                  {item.item_code && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] bg-[var(--ui-bg-input)] border border-[var(--ui-border)] px-3 py-1.5 rounded-lg">
                      <Tag size={11} /> {item.item_code}
                    </span>
                  )}
                  {item.uom && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] bg-[var(--ui-bg-input)] border border-[var(--ui-border)] px-3 py-1.5 rounded-lg">
                      <Ruler size={11} /> per {item.uom}
                    </span>
                  )}
                </div>

                {/* Add to cart — no modal */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{ color: "white" }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                    justAdded ? "bg-emerald-500 shadow-emerald-500/30" : inCart ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/25"
                  }`}
                >
                  {justAdded ? (
                    <><CheckCircle2 size={16} /> Added to Cart!</>
                  ) : inCart ? (
                    <><Plus size={16} /> Add More to Cart</>
                  ) : (
                    <><ShoppingCart size={16} /> Add to Cart</>
                  )}
                </button>

                <p className="text-[11px] text-center text-[var(--ui-text-muted)]">
                  Prices confirmed when vendors submit proposals. You can edit quantity in your cart.
                </p>
              </div>

              {/* Specifications */}
              {item.specifications && (
                <div className="border border-[var(--ui-border)] rounded-2xl bg-[var(--ui-bg-card)] p-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Specifications</span>
                  <SpecsBlock text={item.specifications} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
