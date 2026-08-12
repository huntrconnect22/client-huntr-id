import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams, useLoaderData } from "react-router";
import Layout from "../components/Layout";
import { getCatalogue } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import { addItemToCart, getCartItemCount, loadCart } from "../lib/cart";
import { Package, ShoppingCart, ArrowLeft, ArrowRight, X, CheckCircle2, Search, Truck, ShieldCheck, Tag, Hash, Building2, Minus, Plus } from "lucide-react";
import type { Route } from "./+types/marketplace-detail";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    const response = await getCatalogue(params.id);
    let product = response;
    if (response && typeof response === "object" && "data" in response) {
      product = response.data;
    }
    return { product };
  } catch (err) {
    console.error("Failed to load product details in loader", err);
    return { product: null };
  }
}

export function meta({ data }: Route.MetaArgs) {
  const product = data?.product;
  if (!product) {
    return [
      { title: "Product Not Found | Huntr.id" },
      { name: "description", content: "The requested product catalogue item was not found." },
    ];
  }

  const title = `${product.name} | Huntr.id`;
  const description = product.specifications || `Buy ${product.name} on Huntr.id. ${product.category || "General"} product from vendor.`;
  const canonical = `https://app.huntr.id/marketplace/${product.id}`;
  const imageUrl = product.image_url || product.image_path
    ? getAssetUrl(product.image_url || product.image_path)
    : (product.image || "https://app.huntr.id/assets/img/logo/sidebar.png");

  return [
    { title },
    { name: "description", content: description.substring(0, 160) },
    { rel: "canonical", href: canonical },
    { property: "og:type", content: "og:product" },
    { property: "og:url", content: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description.substring(0, 160) },
    { property: "og:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: canonical },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description.substring(0, 160) },
    { name: "twitter:image", content: imageUrl },
  ];
}

interface CatalogueItem {
  id: string;
  item_code: string;
  name: string;
  category?: string;
  specifications?: string;
  price?: number;
  image?: string;
  image_url?: string;
  image_path?: string;
  uom: string;
  company_id: string;
  company?: {
    id: string;
    name: string;
    type: string;
  };
}

function SpecificationsBlock({ text }: { text: string | undefined }) {
  if (!text) {
    return <p className="text-xs text-[var(--ui-text-muted)] italic m-0">No specifications provided.</p>;
  }

  return (
    <div className="text-xs text-[var(--ui-text-primary)] leading-relaxed whitespace-pre-wrap break-words">
      {text}
    </div>
  );
}

function GuestHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] shadow-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <Link to="/" className="flex-shrink-0">
        <img src="/assets/img/logo/sidebar.png" alt="Huntr Logo" className="h-8 w-auto object-contain" />
      </Link>
      <nav className="flex items-center gap-4">
        <Link to="/login" className="px-3.5 py-1.5 border border-orange-500 rounded text-orange-500 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all">Sign In</Link>
        <Link to="/register" className="px-3.5 py-1.5 bg-orange-500 rounded text-white text-xs font-bold hover:bg-orange-600 transition-all">Register</Link>
      </nav>
    </header>
  );
}

export default function MarketplaceDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<CatalogueItem | null>(loaderData?.product || null);
  const [loading, setLoading] = useState(!loaderData?.product);
  const [error, setError] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSpecExpanded, setIsSpecExpanded] = useState(false);

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    setIsGuest(!userSession);
  }, []);

  useEffect(() => {
    if (!id) { setError("Product not found."); setLoading(false); return; }
    if (loaderData?.product && String(loaderData.product.id) === id) {
      setItem(loaderData.product); setLoading(false); return;
    }
    setLoading(true);
    getCatalogue(id)
      .then((response) => {
        let product = response;
        if (response && typeof response === "object" && "data" in response) product = response.data;
        if (product) { setItem(product); setError(null); }
        else setError("Product data is empty.");
      })
      .catch(() => setError("Failed to load product details."))
      .finally(() => setLoading(false));
  }, [id, loaderData]);

  const handleAddToCart = () => { setQuantity(1); setShowQuantityModal(true); };

  const confirmAddToCart = () => {
    try {
      if (!item) return;
      addItemToCart(item as any, quantity);
      setCartMessage("Product added to cart.");
      setShowQuantityModal(false);
      setTimeout(() => setCartMessage(null), 3500);
    } catch {
      setCartMessage("Unable to add product to cart right now.");
    }
  };

  const imageUrl = item?.image_url || item?.image_path ? getAssetUrl(item.image_url || item.image_path) : (item?.image || null);
  const pageTitle = item?.name || "Marketplace Product";

  if (isGuest) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)]">
        <GuestHeader />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-orange-500 font-bold text-xs">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>
          {item && (
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center overflow-hidden">
                {imageUrl ? <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <Package size={48} className="opacity-30" />}
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{item.category || "General"}</span>
                  <h1 className="text-lg font-bold text-[var(--ui-text-primary)] mt-1">{item.name}</h1>
                  <p className="text-xs text-[var(--ui-text-muted)]">SKU: {item.item_code}</p>
                </div>
                {item.price && item.price > 0 && (
                  <div className="text-xl font-bold text-emerald-500">
                    Rp {Number(item.price).toLocaleString("id-ID")} <span className="text-xs font-normal text-[var(--ui-text-muted)]">/ {item.uom}</span>
                  </div>
                )}
                <button onClick={() => navigate("/login")} style={{ color: 'white' }} className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={15} /> Sign In to Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout title={pageTitle} subtitle="Product details from vendor catalog">
      <div className="w-full space-y-4">
        {/* Back Link */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-orange-500 font-semibold text-xs hover:underline">
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        {loading && (
          <div className="flex justify-center py-16">
            <Package size={28} className="animate-spin text-orange-500" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && item && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* Left Image Box */}
            <div className="md:col-span-5 border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4">
              <div className="w-full aspect-square rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={48} className="text-[var(--ui-text-muted)] opacity-30" />
                )}
              </div>
            </div>

            {/* Right Details Box */}
            <div className="md:col-span-7 space-y-4">
              <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                    {item.category || "General"}
                  </span>
                  <h1 className="text-lg font-bold text-[var(--ui-text-primary)] mt-1.5 leading-snug">{item.name}</h1>
                  <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">SKU: {item.item_code}</p>
                </div>

                {item.price && item.price > 0 && (
                  <div className="p-3.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)]">
                    <span className="text-xs font-semibold text-[var(--ui-text-muted)]">Estimated Price</span>
                    <div className="text-2xl font-bold text-emerald-500 mt-0.5">
                      Rp {Number(item.price).toLocaleString("id-ID")} <span className="text-xs font-semibold text-[var(--ui-text-muted)]">/ {item.uom}</span>
                    </div>
                  </div>
                )}

                {/* Inset Metadata Grid */}
                <div className="border border-[var(--ui-border)] rounded-lg overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                  <div className="p-3 px-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--ui-text-muted)]">SKU / Item Code</span>
                    <span className="font-bold text-[var(--ui-text-primary)]">{item.item_code}</span>
                  </div>
                  <div className="p-3 px-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--ui-text-muted)]">Category</span>
                    <span className="font-bold text-[var(--ui-text-primary)]">{item.category || "General"}</span>
                  </div>
                  <div className="p-3 px-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--ui-text-muted)]">Unit of Measure</span>
                    <span className="font-bold text-[var(--ui-text-primary)]">{item.uom}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{ color: 'white' }}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingCart size={15} /> Add to Cart
                </button>
              </div>

              {/* Specifications Card */}
              {item.specifications && (
                <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Specifications</span>
                  <div className={`overflow-hidden transition-all ${isSpecExpanded ? "max-h-none" : "max-h-24"}`}>
                    <SpecificationsBlock text={item.specifications} />
                  </div>
                  <button
                    onClick={() => setIsSpecExpanded(!isSpecExpanded)}
                    className="text-xs font-semibold text-orange-500 hover:underline pt-1"
                  >
                    {isSpecExpanded ? "Show Less" : "Read More"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Set Quantity Modal */}
      {showQuantityModal && item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[999] p-4" onClick={() => setShowQuantityModal(false)}>
          <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--ui-text-primary)]">Set Quantity</h3>
                <p className="text-xs text-[var(--ui-text-muted)] line-clamp-1 mt-0.5">{item.name}</p>
              </div>
              <button onClick={() => setShowQuantityModal(false)} className="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between border border-[var(--ui-border)] rounded-lg bg-[var(--ui-bg-input)] p-1">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-md bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-primary)] hover:border-orange-500/40">
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-20 text-center font-bold text-base bg-transparent border-none text-[var(--ui-text-primary)] outline-none"
              />
              <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-md bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-primary)] hover:border-orange-500/40">
                <Plus size={14} />
              </button>
            </div>

            <div className="text-[11px] text-center text-[var(--ui-text-muted)]">
              Unit: <span className="font-semibold text-[var(--ui-text-secondary)]">{item.uom || "unit"}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowQuantityModal(false)} className="flex-1 py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] font-semibold text-xs">
                Cancel
              </button>
              <button onClick={confirmAddToCart} style={{ color: 'white' }} className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5">
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {cartMessage && (
        <div className="fixed bottom-6 right-6 bg-[var(--ui-bg-card)] border border-emerald-500/30 p-3.5 px-4 rounded-xl shadow-xl flex items-center gap-3 z-50 text-xs font-semibold text-[var(--ui-text-primary)]">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <span>{cartMessage}</span>
        </div>
      )}
    </Layout>
  );
}
