import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { createRfq } from "../lib/api";
import { ClipboardList, CheckCircle2, ArrowLeft, Loader2, Package, AlertCircle, FileText, Calendar, Paperclip, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { getAssetUrl } from "../lib/assets";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");
  const [prDuration, setPrDuration] = useState(7);
  const [prDocument, setPrDocument] = useState<File | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [companyAddresses, setCompanyAddresses] = useState<{ id: string; label: string; value: string }[]>([]);

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug = c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    if (userSession) setUser(JSON.parse(userSession));

    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      setActiveCompany(comp);

      const addresses: { id: string; label: string; value: string }[] = [];
      if (comp.address) {
        addresses.push({ id: "main", label: "Main Address", value: comp.address });
      }
      if (Array.isArray(comp.hq_addresses)) {
        comp.hq_addresses.forEach((addr: any, idx: number) => {
          const value = typeof addr === "string" ? addr : addr.address || "";
          addresses.push({ id: `hq_${idx}`, label: `HQ ${idx + 1}`, value });
        });
      }
      if (addresses.length > 0) {
        setCompanyAddresses(addresses);
        setDeliveryPoint(addresses[0].value);
      } else if (comp.address) {
        setDeliveryPoint(comp.address);
      }

      if (comp.type === 'vendor') {
        const slug = getCompanyPrefix(comp);
        navigate(slug || "/");
        return;
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const fromAi = searchParams.get("from") === "ai";
    const aiDraftStr = localStorage.getItem("ai_pr_draft");

    if (fromAi && aiDraftStr) {
      const draft = JSON.parse(aiDraftStr);
      if (draft.title) setPrTitle(draft.title);
      if (draft.description) setPrDesc(draft.description);
      if (draft.duration_days) setPrDuration(draft.duration_days);

      if (draft.suggested_items && draft.suggested_items.length > 0) {
        const items = draft.suggested_items
          .filter((item: any) => item.catalogue_id || item.catalogue?.id)
          .map((item: any) => ({
            id: item.catalogue_id || item.catalogue?.id || "",
            item_code: item.catalogue?.item_code || item.item_code || "",
            name: item.catalogue?.name || item.name || `Item ${item.catalogue_id?.slice(0, 8) || "?"}`,
            category: item.catalogue?.category || item.category || "",
            brand: item.catalogue?.brand || item.brand || "",
            uom: item.catalogue?.uom || item.uom || "unit",
            image_path: item.catalogue?.image_path || item.image_path || null,
            qty: item.qty || 1,
            estimated_price: item.estimated_price || 0,
          }));
        setCart(items);
        localStorage.setItem("huntr_cart", JSON.stringify(items));
      }
      localStorage.removeItem("ai_pr_draft");
    } else {
      const savedCart = localStorage.getItem("huntr_cart");
      if (savedCart) {
        const items = JSON.parse(savedCart).map((i: any) => ({
          ...i,
          estimated_price: i.estimated_price || 0
        }));
        setCart(items);
      }
    }
  }, []);

  // Company slug redirect check
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/checkout`, { replace: true });
    }
  }, [activeCompany]);

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.estimated_price || 0) * item.qty), 0);

  const updateEstimatedPrice = (id: string, price: number) => {
    const newCart = cart.map(i => i.id === id ? { ...i, estimated_price: price } : i);
    setCart(newCart);
    localStorage.setItem("huntr_cart", JSON.stringify(newCart));
  };

  const handleSubmitPR = async () => {
    if (!activeCompany || !user) return;
    if (!prTitle) {
      setError("Please provide a title for this Purchase Request.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("company_id", activeCompany.id);
      formData.append("user_id", user.id);
      formData.append("title", prTitle);
      formData.append("description", prDesc);
      formData.append("duration_days", prDuration.toString());
      formData.append("status", "pending_approval");
      formData.append("delivery_point", deliveryPoint);
      
      if (prDocument) {
        const maxSize = 10 * 1024 * 1024;
        if (prDocument.size > maxSize) {
          setError("File size must be less than 10MB.");
          return;
        }
        
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(prDocument.type)) {
          setError("Only PDF, DOC, DOCX, JPG, and PNG files are allowed.");
          return;
        }
        formData.append("document", prDocument);
      }

      if (cart.length === 0) {
        setError("Please add at least one item to your cart.");
        return;
      }

      cart.forEach((item, index) => {
        formData.append(`items[${index}][catalogue_id]`, item.id);
        formData.append(`items[${index}][qty]`, item.qty.toString());
        formData.append(`items[${index}][estimated_price]`, (item.estimated_price || 0).toString());
        formData.append(`items[${index}][expected_date]`, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      });

      await createRfq(formData);
      
      localStorage.removeItem("huntr_cart");
      setSuccess(true);
      setTimeout(() => navigate(`${getCompanyPrefix()}/my-pr`), 3000);
    } catch (err: any) {
      console.error("PR Creation Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create Purchase Request.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout title="Request Created" subtitle="Your purchase requisition has been submitted.">
        <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-lg font-bold text-[var(--ui-text-primary)]">PR Successfully Submitted!</h2>
          <p className="text-xs text-[var(--ui-text-muted)] max-w-md">
            Your Purchase Request <strong className="text-[var(--ui-text-primary)]">"{prTitle}"</strong> is now waiting for manager approval. You will be redirected shortly.
          </p>
          <button 
            onClick={() => navigate(`${getCompanyPrefix()}/my-pr`)}
            className="mt-2 px-4 py-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
          >
            Go to My Requests
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout Purchase Request" subtitle="Review your selected items and submit for approval.">
      <div className="w-full space-y-4">
        {/* Back Link */}
        <button
          onClick={() => navigate(`${getCompanyPrefix()}/marketplace`)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline"
        >
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Content Area (Items + PR Form) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Items Summary Table */}
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] overflow-hidden">
              <div className="p-3.5 px-4 border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)]">Item Summary</h3>
                    <p className="text-[10px] text-[var(--ui-text-muted)]">{cart.length} item{cart.length !== 1 ? "s" : ""} in this request</p>
                  </div>
                </div>
                {cartTotal > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[var(--ui-text-muted)] block">Est. Total</span>
                    <span className="text-xs sm:text-sm font-bold text-orange-500">IDR {cartTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-[var(--ui-border)]">
                {cart.map((item) => (
                  <div key={item.id} className="p-3.5 px-4 flex items-center gap-3 text-xs">
                    <div className="w-11 h-11 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center">
                      {(item.image_url || item.image_path) ? (
                        <img src={getAssetUrl(item.image_url || item.image_path)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={18} className="text-[var(--ui-text-muted)] opacity-40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--ui-text-primary)] truncate">{item.name}</p>
                      <p className="text-[10px] text-[var(--ui-text-muted)] font-mono">{item.item_code || "—"}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold text-[11px] shrink-0">
                      ×{item.qty} {item.uom || "pc"}
                    </span>

                    <div className="w-28 shrink-0">
                      <span className="text-[9px] font-bold uppercase text-[var(--ui-text-muted)] block mb-0.5">Est. Price</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--ui-text-muted)] pointer-events-none">IDR</span>
                        <input
                          type="number"
                          value={item.estimated_price === 0 ? "" : item.estimated_price}
                          placeholder="0"
                          onChange={(e) => updateEstimatedPrice(item.id, Number(e.target.value))}
                          className="w-full pl-7 pr-2 py-1 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs outline-none focus:border-orange-400/60"
                        />
                      </div>
                    </div>

                    <div className="text-right min-w-[70px] shrink-0">
                      {item.estimated_price > 0 ? (
                        <span className="font-bold text-[var(--ui-text-primary)] tabular-nums">
                          IDR {(Number(item.estimated_price) * item.qty).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[var(--ui-text-muted)]">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Details Form */}
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--ui-border)]">
                <ClipboardList size={16} className="text-orange-500" /> Request Details
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">PR Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Office Supplies for Q3 2026" 
                    value={prTitle}
                    onChange={e => setPrTitle(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">Purpose / Description</label>
                  <textarea 
                    placeholder="Explain why these items are needed..." 
                    value={prDesc}
                    onChange={e => setPrDesc(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                    <MapPin size={12} /> Delivery Point *
                  </label>
                  {companyAddresses.length > 0 ? (
                    <select
                      value={deliveryPoint}
                      onChange={e => setDeliveryPoint(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                    >
                      {companyAddresses.map(address => (
                        <option key={address.id} value={address.value}>
                          {address.label}: {address.value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea 
                      placeholder="e.g. Jl. Sudirman No. 123, Jakarta" 
                      value={deliveryPoint}
                      onChange={e => setDeliveryPoint(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                      <Calendar size={12} /> Tender Duration (Days)
                    </label>
                    <select 
                      value={prDuration}
                      onChange={e => setPrDuration(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                      <Paperclip size={12} /> Supporting Doc (Optional)
                    </label>
                    <div>
                      <input 
                        type="file" 
                        id="pr-document"
                        onChange={e => setPrDocument(e.target.files?.[0] || null)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('pr-document')?.click()}
                        className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-left text-xs text-[var(--ui-text-muted)] flex items-center gap-2 hover:border-orange-400/50 transition-all truncate"
                      >
                        {prDocument ? <><FileText size={14} className="text-orange-500 shrink-0" /> <span className="truncate text-orange-500 font-semibold">{prDocument.name}</span></> : "Choose file..."}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-3">
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3 sticky top-4">
              <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] pb-2 border-b border-[var(--ui-border)]">
                Order Summary
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ui-text-muted)]">Subtotal</span>
                  <span className="font-semibold text-[var(--ui-text-primary)] tabular-nums">IDR {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ui-text-muted)]">Tax (0%)</span>
                  <span className="font-semibold text-[var(--ui-text-primary)]">IDR 0</span>
                </div>
                <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between">
                  <span className="font-bold text-[var(--ui-text-primary)] uppercase">Total</span>
                  <span className="text-sm font-bold text-orange-500 tabular-nums">IDR {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button 
                onClick={handleSubmitPR}
                disabled={loading || cart.length === 0}
                style={{ color: 'white' }}
                className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Submit Request <CheckCircle2 size={16} /></>}
              </button>
              
              <p className="text-[10px] text-[var(--ui-text-muted)] text-center leading-relaxed">
                By submitting, this request will be sent to your manager for approval before being published.
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
