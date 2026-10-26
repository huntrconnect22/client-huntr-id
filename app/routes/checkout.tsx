import React, { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { createRfq, getRfq, resubmitRfq } from "../lib/api";
import {
  ClipboardList,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Package,
  AlertCircle,
  FileText,
  Calendar,
  Paperclip,
  MapPin,
  Building,
  Briefcase,
  Clock,
  Coins,
  Sparkles,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { getAssetUrl } from "../lib/assets";
import { clearCart } from "../lib/cart";
import { getWarehouses, getWmsApps } from "../lib/api/wms";

export const SERVICE_PROJECT_TYPES = [
  {
    id: "Konstruksi & Sipil",
    label: "Konstruksi & Sipil",
    desc: "Renovasi, sipil, arsitektur, MEP gedung, perbaikan fisik",
    icon: "🏗️",
  },
  {
    id: "Teknologi Informasi (IT)",
    label: "Teknologi Informasi (IT)",
    desc: "Software development, maintenance server, network, cyber security",
    icon: "💻",
  },
  {
    id: "Sewa & Operasional Alat Berat",
    label: "Alat Berat & Mesin",
    desc: "Rental excavator, crane, forklift, bulldozer & operator",
    icon: "🚜",
  },
  {
    id: "Event Organizer & MICE",
    label: "Event & Production",
    desc: "Pameran, corporate event, panggung, audio visual, booth",
    icon: "🎪",
  },
  {
    id: "Maintenance & Fasilitas",
    label: "Maintenance & GA",
    desc: "Cleaning service, HVAC/AC, security, pest control, landscape",
    icon: "🔧",
  },
  {
    id: "Logistik & Transportasi",
    label: "Logistik & Transport",
    desc: "Pengiriman muatan proyek, ekspedisi kargo, sewa armada",
    icon: "🚚",
  },
  {
    id: "Konsultasi & Jasa Profesional",
    label: "Konsultasi & Audit",
    desc: "Legal, advisory, accounting, ISO, konsultan teknik",
    icon: "⚖️",
  },
  {
    id: "Lainnya",
    label: "Lainnya (Custom)",
    desc: "Tentukan jenis proyek atau layanan spesifik lainnya",
    icon: "🏷️",
  },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");
  const [prDuration, setPrDuration] = useState(7);
  const [prDepartment, setPrDepartment] = useState("General Procurement");
  const [prDocument, setPrDocument] = useState<File | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [companyAddresses, setCompanyAddresses] = useState<
    { id: string; label: string; value: string }[]
  >([]);
  const [wmsInstalled, setWmsInstalled] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [deliveryPointBeforeWarehouse, setDeliveryPointBeforeWarehouse] =
    useState("");
  const [procurementMode, setProcurementMode] = useState<"tender" | "direct">(
    () => (searchParams.get("mode") === "direct" ? "direct" : "tender"),
  );
  const [procurementType, setProcurementType] = useState<"goods" | "services" | "mixed">("goods");
  const [projectType, setProjectType] = useState<string>("Teknologi Informasi (IT)");
  const [customProjectType, setCustomProjectType] = useState<string>("");
  const [serviceStartDate, setServiceStartDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [serviceWorkingSchedule, setServiceWorkingSchedule] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [revisionRfqId] = useState(() => searchParams.get("revise"));
  const [revisionLoading, setRevisionLoading] = useState(
    Boolean(searchParams.get("revise")),
  );

  const durationCalculation = useMemo(() => {
    if (!serviceStartDate || !serviceEndDate) return null;
    const start = new Date(serviceStartDate);
    const end = new Date(serviceEndDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return { error: "Tanggal selesai harus setelah tanggal mulai" };
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    const months = (diffDays / 30).toFixed(1).replace(".0", "");
    return {
      days: diffDays,
      months,
      text: diffDays === 1 ? "1 Hari Kalender" : diffDays < 30 ? `${diffDays} Hari Kalender` : `${diffDays} Hari Kalender (~${months} Bulan)`,
    };
  }, [serviceStartDate, serviceEndDate]);

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug =
      c.slug ||
      c.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
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
        addresses.push({
          id: "main",
          label: "Main Address",
          value: comp.address,
        });
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

      if (comp.type === "vendor") {
        const slug = getCompanyPrefix(comp);
        navigate(slug || "/");
        return;
      }
    }

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
            name:
              item.catalogue?.name ||
              item.name ||
              `Item ${item.catalogue_id?.slice(0, 8) || "?"}`,
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
          estimated_price: i.estimated_price || 0,
          line_type: i.line_type || "goods",
        }));
        setCart(items);
      }
    }
  }, []);

  useEffect(() => {
    if (!revisionRfqId || !activeCompany?.id) return;

    getRfq(revisionRfqId)
      .then((response) => {
        const rfq = response?.rfq ?? response?.data ?? response;
        if (String(rfq.company_id) !== String(activeCompany.id)) {
          throw new Error("This PR belongs to another company workspace.");
        }
        if (rfq.status !== "rejected") {
          throw new Error("Only rejected PRs can be revised.");
        }

        setPrTitle(rfq.title || "");
        setPrDesc(rfq.description || "");
        setPrDuration(Number(rfq.duration_days || 7));
        setPrDepartment(rfq.department || "General Procurement");
        setDeliveryPoint(rfq.delivery_point || "");
        setDeliveryPointBeforeWarehouse(rfq.delivery_point || "");
        setWarehouseId(rfq.warehouse_id || "");
        setProcurementMode(
          rfq.procurement_mode === "direct" ? "direct" : "tender",
        );
        setProcurementType(rfq.procurement_type || "goods");
        if (rfq.project_type) {
          setProjectType(rfq.project_type);
        }
        setServiceStartDate(rfq.service_start_date || "");
        setServiceEndDate(rfq.service_end_date || "");
        setServiceLocation(rfq.service_location || rfq.delivery_point || "");
        setAcceptanceCriteria(rfq.acceptance_criteria || "");
        setCart(
          (rfq.items || []).map((item: any) => ({
            id: item.catalogue_id || `manual-${item.id}`,
            manual: !item.catalogue_id,
            item_code: item.catalogue?.item_code || "",
            name: item.catalogue?.name || item.item_name || "",
            uom: item.catalogue?.uom || item.uom || "unit",
            image_path: item.catalogue?.image_path || null,
            qty: Number(item.qty || 1),
            estimated_price: Number(item.estimated_price || 0),
            expected_date: item.expected_date,
            line_type: item.line_type || (item.catalogue_id ? "goods" : "service"),
            service_scope: item.service_scope || "",
            acceptance_criteria: item.acceptance_criteria || "",
            service_start_date: item.service_start_date || "",
            service_end_date: item.service_end_date || "",
          })),
        );
      })
      .catch((err) => setError(err.message || "Unable to load PR revision."))
      .finally(() => setRevisionLoading(false));
  }, [revisionRfqId, activeCompany?.id]);

  useEffect(() => {
    if (!activeCompany?.id) return;
    getWmsApps(activeCompany.id)
      .then((apps) => {
        const installed = Boolean(
          apps?.apps?.find((app: any) => app.key === "wms-inventory")
            ?.installed,
        );
        setWmsInstalled(installed);

        if (!installed) {
          setWarehouses([]);
          return null;
        }

        return getWarehouses(activeCompany.id);
      })
      .then((warehouseResponse) => {
        if (warehouseResponse) setWarehouses(warehouseResponse.data || []);
      })
      .catch(() => {
        setWmsInstalled(false);
        setWarehouses([]);
      });
  }, [activeCompany?.id]);

  // Company slug redirect check
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !location.pathname.startsWith(slug)) {
      navigate(`${slug}/checkout${location.search}`, { replace: true });
    }
  }, [activeCompany, location.pathname, location.search, navigate]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.estimated_price || 0) * item.qty,
    0,
  );
  const selectedWarehouse = warehouses.find(
    (warehouse: any) => String(warehouse.id) === String(warehouseId),
  );
  const warehouseDeliveryPoint = selectedWarehouse
    ? [selectedWarehouse.name, selectedWarehouse.address]
        .filter(Boolean)
        .join(" · ")
    : "";

  const updateEstimatedPrice = (id: string, price: number) => {
    const newCart = cart.map((i) =>
      i.id === id ? { ...i, estimated_price: price } : i,
    );
    setCart(newCart);
    localStorage.setItem("huntr_cart", JSON.stringify(newCart));
  };

  const updateQuantity = (id: string, qty: number) => {
    setCart((items) =>
      items.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, qty || 1) } : item,
      ),
    );
  };

  const addManualItem = () => {
    setCart((items) => [
      ...items,
      {
        id: `manual-${crypto.randomUUID()}`,
        manual: true,
        name: "",
        uom: "unit",
        qty: 1,
        estimated_price: 0,
      },
    ]);
  };

  const addServiceLine = () => {
    setCart((items) => [
      ...items,
      {
        id: `service-${crypto.randomUUID()}`,
        manual: true,
        line_type: "service",
        name: "",
        uom: "lot",
        qty: 1,
        estimated_price: 0,
        service_scope: "",
        acceptance_criteria: "",
        service_start_date: serviceStartDate,
        service_end_date: serviceEndDate,
      },
    ]);
  };

  const updateManualItem = (id: string, field: string, value: string) => {
    setCart((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
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
      if (procurementMode === "tender") {
        formData.append("duration_days", prDuration.toString());
      }
      formData.append("status", "pending_approval");
      formData.append("procurement_mode", procurementMode);
      formData.append("procurement_type", procurementType);
      const finalProjectType = projectType === "Lainnya" ? (customProjectType.trim() || "Lainnya") : projectType;
      if (procurementType !== "goods" && finalProjectType) {
        formData.append("project_type", finalProjectType);
      }
      if (serviceStartDate) formData.append("service_start_date", serviceStartDate);
      if (serviceEndDate) formData.append("service_end_date", serviceEndDate);
      if (serviceLocation || procurementType === "services") formData.append("service_location", serviceLocation || deliveryPoint);
      const finalCriteria = [
        acceptanceCriteria.trim(),
        serviceWorkingSchedule ? `Pola/Waktu Kerja: ${serviceWorkingSchedule.trim()}` : "",
      ].filter(Boolean).join("\n\n");
      if (finalCriteria) formData.append("acceptance_criteria", finalCriteria);
      formData.append("delivery_point", deliveryPoint);
      if (procurementType !== "services" && wmsInstalled && warehouseId)
        formData.append("warehouse_id", warehouseId);
      formData.append("department", prDepartment);

      if (procurementMode === "tender" && prDocument) {
        const maxSize = 10 * 1024 * 1024;
        if (prDocument.size > maxSize) {
          setError("File size must be less than 10MB.");
          return;
        }

        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ];
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
        formData.append(`items[${index}][line_type]`, item.line_type || "goods");
        if (item.manual) {
          formData.append(`items[${index}][item_name]`, item.name);
          formData.append(`items[${index}][uom]`, item.uom || (item.line_type === "service" ? "lot" : "unit"));
          if (item.service_scope) formData.append(`items[${index}][service_scope]`, item.service_scope);
          if (item.acceptance_criteria) formData.append(`items[${index}][acceptance_criteria]`, item.acceptance_criteria);
          if (item.service_start_date) formData.append(`items[${index}][service_start_date]`, item.service_start_date);
          if (item.service_end_date) formData.append(`items[${index}][service_end_date]`, item.service_end_date);
        } else {
          formData.append(`items[${index}][catalogue_id]`, item.id);
        }
        formData.append(`items[${index}][qty]`, item.qty.toString());
        formData.append(
          `items[${index}][estimated_price]`,
          (item.estimated_price || 0).toString(),
        );
        formData.append(
          `items[${index}][expected_date]`,
          item.expected_date ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        );
      });

      if (revisionRfqId) {
        await resubmitRfq(revisionRfqId, formData);
      } else {
        await createRfq(formData);
      }

      clearCart();
      setCart([]);
      setSuccess(true);
      setTimeout(() => navigate(`${getCompanyPrefix()}/my-pr`), 3000);
    } catch (err: any) {
      console.error("PR Creation Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create Purchase Request.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout
        title="Request Created"
        subtitle={
          revisionRfqId
            ? "Your revised purchase requisition has been submitted."
            : "Your purchase requisition has been submitted."
        }
      >
        <div className="border border-dashed border-[var(--ui-border)] rounded-xl py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-lg font-bold text-[var(--ui-text-primary)]">
            {revisionRfqId
              ? "Revised PR Submitted!"
              : "PR Successfully Submitted!"}
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)] max-w-md">
            Your Purchase Request{" "}
            <strong className="text-[var(--ui-text-primary)]">
              "{prTitle}"
            </strong>{" "}
            is now waiting for manager approval. You will be redirected shortly.
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
    <Layout
      title="Checkout Purchase Request"
      subtitle={
        revisionRfqId
          ? "Update the rejected PR, then submit it again for approval."
          : "Review your selected items and submit for approval."
      }
    >
      <div className="w-full space-y-4">
        {revisionLoading && (
          <div className="flex items-center gap-2 border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-4 py-3 text-sm text-[var(--ui-text-secondary)]">
            <Loader2 size={16} className="animate-spin" /> Loading PR for
            revision…
          </div>
        )}
        {revisionRfqId && !revisionLoading && !error && (
          <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-[var(--ui-text-secondary)]">
            You are revising a rejected PR. Update its details and items, then
            submit it for approval again.
          </div>
        )}
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
                    {procurementType === "services" ? <Briefcase size={16} /> : <Package size={16} />}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)]">
                      {procurementType === "services" ? "Daftar Lingkup Jasa & Budget" : procurementType === "mixed" ? "Item Barang & Jasa" : "Item Summary"}
                    </h3>
                    <p className="text-[10px] text-[var(--ui-text-muted)]">
                      {cart.length} {procurementType === "services" ? "layanan / scope pekerjaan" : "item(s)"} dalam request ini
                    </p>
                  </div>
                </div>
                {cartTotal > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[var(--ui-text-muted)] block">
                      {procurementType === "services" ? "Total Pagu Budget" : "Est. Total"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-orange-500">
                      IDR {cartTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {procurementMode === "direct" && procurementType !== "services" && (
                    <button type="button" onClick={addManualItem} className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-500/50">+ Add manual item</button>
                  )}
                  {procurementType !== "goods" && (
                    <button type="button" onClick={addServiceLine} className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-500/50 flex items-center gap-1.5">
                      <Briefcase size={12} className="text-orange-500" />
                      + Tambah Jasa / Scope
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-[var(--ui-border)]">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--ui-text-muted)]">
                    {procurementType === "services" ? (
                      <div>
                        <Briefcase size={28} className="mx-auto text-orange-500/50 mb-2" />
                        <p className="font-semibold text-[var(--ui-text-primary)]">Belum ada item jasa</p>
                        <p className="text-[11px] mt-1">Tambahkan lingkup pekerjaan dan pagu budget yang dialokasikan.</p>
                        <button type="button" onClick={addServiceLine} className="mt-3 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold text-xs inline-flex items-center gap-1">
                          + Tambah Jasa / Scope Pertama
                        </button>
                      </div>
                    ) : (
                      "Belum ada item terpilih."
                    )}
                  </div>
                ) :
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 px-4 flex items-center gap-3 text-xs"
                    >
                      <div className="w-11 h-11 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center">
                        {item.line_type === "service" ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10 text-orange-500">
                            <Briefcase size={16} />
                            <span className="text-[8px] font-bold uppercase mt-0.5">JASA</span>
                          </div>
                        ) : item.image_url || item.image_path ? (
                          <img
                            src={getAssetUrl(item.image_url || item.image_path)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package
                            size={18}
                            className="text-[var(--ui-text-muted)] opacity-40"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.manual ? (
                          <div>
                            <input
                              required
                              placeholder={item.line_type === "service" ? "Nama Jasa / Pekerjaan (misal: Jasa Desain Arsitektur, Maintenance Server)" : "Item name"}
                              value={item.name}
                              onChange={(event) =>
                                updateManualItem(
                                  item.id,
                                  "name",
                                  event.target.value,
                                )
                              }
                              className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-xs text-[var(--ui-text-primary)] w-full rounded"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-[var(--ui-text-primary)] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[var(--ui-text-muted)] font-mono">
                              {item.item_code || "—"}
                            </p>
                          </>
                        )}
                        {item.manual && item.line_type === "service" && (
                          <textarea
                            value={item.service_scope || ""}
                            onChange={(event) => updateManualItem(item.id, "service_scope", event.target.value)}
                            placeholder="Rincian Ruang Lingkup Pekerjaan (Scope of Work / Deliverables)..."
                            rows={2}
                            className="mt-2 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1.5 text-xs text-[var(--ui-text-primary)] rounded"
                          />
                        )}
                      </div>

                      <label className="w-20 shrink-0">
                        <span className="mb-0.5 block text-[9px] font-bold uppercase text-[var(--ui-text-muted)]">
                          {item.line_type === "service" ? "Volume" : "Qty"}
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateQuantity(item.id, Number(e.target.value))
                          }
                          className="w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-xs text-[var(--ui-text-primary)] rounded outline-none focus:border-orange-400/60"
                        />
                      </label>

                      <div className="w-32 shrink-0">
                        <span className="text-[9px] font-bold uppercase text-[var(--ui-text-muted)] block mb-0.5 flex items-center justify-between">
                          <span>{item.line_type === "service" ? "Pagu Budget" : "Est. Price"}</span>
                          {item.line_type === "service" && <Coins size={10} className="text-orange-500" />}
                        </span>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--ui-text-muted)] pointer-events-none">
                            IDR
                          </span>
                          <input
                            type="number"
                            value={
                              item.estimated_price === 0
                                ? ""
                                : item.estimated_price
                            }
                            placeholder="0"
                            onChange={(e) =>
                              updateEstimatedPrice(
                                item.id,
                                Number(e.target.value),
                              )
                            }
                            className="w-full pl-7 pr-2 py-1 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs outline-none focus:border-orange-400/60"
                          />
                        </div>
                      </div>

                      <div className="text-right min-w-[80px] shrink-0">
                        <span className="text-[9px] block text-[var(--ui-text-muted)] uppercase font-semibold">
                          {item.line_type === "service" ? "Subtotal" : "Subtotal"}
                        </span>
                        {item.estimated_price > 0 ? (
                          <span className="font-bold text-[var(--ui-text-primary)] tabular-nums">
                            IDR{" "}
                            {(
                              Number(item.estimated_price) * item.qty
                            ).toLocaleString()}
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
                <ClipboardList size={16} className="text-orange-500" /> Request
                Details
              </h3>

              <div className="space-y-3 text-xs">
                <fieldset className="space-y-2">
                  <legend className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)]">Procurement object</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[['goods','Goods','Physical items that can be received into warehouse.'],['services','Services','Professional work, subscription, consulting, or maintenance.'],['mixed','Mixed','A single PR contains goods and services.']].map(([value,label,help]) => <button key={value} type="button" onClick={() => { const next = value === "services" && cart.some((item) => item.line_type !== "service") ? "mixed" : value; setProcurementType(next as any); if (next === "services") setWarehouseId(""); }} className={`border p-3 text-left ${procurementType === value ? "border-orange-500 bg-orange-500/5" : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"}`}><span className="block font-semibold text-[var(--ui-text-primary)]">{label}</span><span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">{help}</span></button>)}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)]">
                    Procurement route
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setProcurementMode("tender")}
                      className={`border p-3 text-left transition-colors ${procurementMode === "tender" ? "border-orange-500 bg-orange-500/5" : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"}`}
                    >
                      <span className="block font-semibold text-[var(--ui-text-primary)]">
                        Tender
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">
                        Invite vendors after approval.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProcurementMode("direct");
                        setPrDocument(null);
                      }}
                      className={`border p-3 text-left transition-colors ${procurementMode === "direct" ? "border-orange-500 bg-orange-500/5" : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"}`}
                    >
                      <span className="block font-semibold text-[var(--ui-text-primary)]">
                        Direct purchase
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">
                        For urgent buying. No tender is published.
                      </span>
                    </button>
                  </div>
                </fieldset>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">
                      PR Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Office Supplies for Q3 2026"
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                      <Building size={12} /> Department *
                    </label>
                    <select
                      value={prDepartment}
                      onChange={(e) => setPrDepartment(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                    >
                      <option value="General Procurement">
                        General Procurement
                      </option>
                      <option value="Information Technology">
                        Information Technology (IT)
                      </option>
                      <option value="Operations & Logistics">
                        Operations & Logistics
                      </option>
                      <option value="General Affairs (GA)">
                        General Affairs (GA)
                      </option>
                      <option value="Finance & Accounting">
                        Finance & Accounting
                      </option>
                      <option value="Human Resources (HR)">
                        Human Resources (HR)
                      </option>
                      <option value="Marketing & Sales">
                        Marketing & Sales
                      </option>
                      <option value="Engineering & Maintenance">
                        Engineering & Maintenance
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">
                    Purpose / Description
                  </label>
                  <textarea
                    placeholder="Explain why these items are needed..."
                    value={prDesc}
                    onChange={(e) => setPrDesc(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none"
                  />
                </div>
                {procurementType !== "goods" && (
                  <div className="space-y-4 border-l-2 border-orange-500 bg-orange-500/5 p-4 rounded-r-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-orange-500/20">
                      <div>
                        <p className="text-xs font-bold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                          <Briefcase size={14} className="text-orange-500" />
                          Detail Pengadaan Jasa & Spesifikasi Proyek
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--ui-text-muted)]">
                          Pengadaan jasa dinilai dari pagu budget, waktu pengerjaan, dan deliverables BAST.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                        Penerimaan via BAST
                      </span>
                    </div>

                    {/* 1. Jenis Proyek */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1">
                        <Sparkles size={11} className="text-orange-400" />
                        Jenis Proyek / Kategori Jasa *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SERVICE_PROJECT_TYPES.map((type) => {
                          const isSelected = projectType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setProjectType(type.id)}
                              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500/10 shadow-sm"
                                  : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-400/40"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{type.icon}</span>
                                <span className={`text-xs font-bold leading-tight ${isSelected ? "text-orange-500" : "text-[var(--ui-text-primary)]"}`}>
                                  {type.label}
                                </span>
                              </div>
                              <span className="text-[9px] text-[var(--ui-text-muted)] mt-1 line-clamp-2">
                                {type.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {projectType === "Lainnya" && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Tuliskan jenis proyek spesifik (misal: Jasa Survei Topografi, Sertifikasi ISO)..."
                            value={customProjectType}
                            onChange={(e) => setCustomProjectType(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-orange-500/50 text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* 2. Waktu Pengerjaan */}
                    <div className="space-y-2 pt-2 border-t border-[var(--ui-border)]/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1">
                          <Clock size={11} className="text-orange-400" />
                          Waktu & Jadwal Pengerjaan *
                        </label>
                        {durationCalculation && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${durationCalculation.error ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {durationCalculation.error || `⏱️ Durasi: ${durationCalculation.text}`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
                          Tanggal Mulai Pengerjaan *
                          <input
                            type="date"
                            value={serviceStartDate}
                            onChange={(e) => setServiceStartDate(e.target.value)}
                            className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
                          />
                        </label>
                        <label className="text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
                          Target Selesai Pengerjaan (Deadline) *
                          <input
                            type="date"
                            min={serviceStartDate || undefined}
                            value={serviceEndDate}
                            onChange={(e) => setServiceEndDate(e.target.value)}
                            className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
                          />
                        </label>
                      </div>

                      <label className="block text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
                        Pola Waktu Kerja / Jam Kerja (Opsional)
                        <input
                          type="text"
                          value={serviceWorkingSchedule}
                          onChange={(e) => setServiceWorkingSchedule(e.target.value)}
                          placeholder="misal: Hari Kerja Senin - Jumat (08:00 - 17:00 WIB), atau Shift 24 Jam Non-stop"
                          className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
                        />
                      </label>
                    </div>

                    {/* 3. Acceptance Criteria & SLA */}
                    <div className="pt-2 border-t border-[var(--ui-border)]/60">
                      <label className="block text-[10px] font-bold uppercase text-[var(--ui-text-muted)]">
                        Kriteria Penerimaan & Deliverables (Syarat BAST) *
                        <textarea
                          value={acceptanceCriteria}
                          onChange={(e) => setAcceptanceCriteria(e.target.value)}
                          placeholder="Contoh: 1. Laporan progres mingguan, 2. Dokumentasi serah terima / BAST ditandatangani PM, 3. Garansi pengerjaan minimal 30 hari kalender, 4. Uji fungsi (UAT) lolos 100%."
                          rows={3}
                          className="mt-1 w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {wmsInstalled && procurementType !== "services" && (
                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                      <Building size={12} /> Receiving Warehouse
                    </label>
                    <select
                      value={warehouseId}
                      onChange={(e) => {
                        const nextWarehouseId = e.target.value;
                        if (!nextWarehouseId) {
                          setWarehouseId("");
                          setDeliveryPoint(deliveryPointBeforeWarehouse);
                          return;
                        }
                        const warehouse = warehouses.find(
                          (item: any) =>
                            String(item.id) === String(nextWarehouseId),
                        );
                        setDeliveryPointBeforeWarehouse(deliveryPoint);
                        setWarehouseId(nextWarehouseId);
                        setDeliveryPoint(
                          [warehouse?.name, warehouse?.address]
                            .filter(Boolean)
                            .join(" · "),
                        );
                      }}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
                    >
                      <option value="">No WMS warehouse selected</option>
                      {warehouses
                        .filter(
                          (warehouse: any) => warehouse.status === "active",
                        )
                        .map((warehouse: any) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} · {warehouse.code}
                            {warehouse.address ? ` · ${warehouse.address}` : ""}
                          </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-[var(--ui-text-muted)]">
                      Goods Receipt for this PR will automatically enter the
                      selected WMS warehouse. Its address becomes the delivery
                      point.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                    <MapPin size={12} /> {procurementType === "services" ? "Service Location *" : "Delivery Point *"}
                  </label>
                  {companyAddresses.length > 0 ? (
                    <select
                      value={deliveryPoint}
                      onChange={(e) => { setDeliveryPoint(e.target.value); if (procurementType === "services") setServiceLocation(e.target.value); }}
                      disabled={Boolean(warehouseId)}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {warehouseId && (
                        <option value={warehouseDeliveryPoint}>
                          Warehouse:{" "}
                          {warehouseDeliveryPoint || "Address not recorded"}
                        </option>
                      )}
                      {companyAddresses.map((address) => (
                        <option key={address.id} value={address.value}>
                          {address.label}: {address.value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      placeholder="e.g. Jl. Sudirman No. 123, Jakarta"
                      value={deliveryPoint}
                      onChange={(e) => { setDeliveryPoint(e.target.value); if (procurementType === "services") setServiceLocation(e.target.value); }}
                      disabled={Boolean(warehouseId)}
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  )}
                </div>

                {procurementMode === "tender" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                        <Calendar size={12} /> Tender Duration (Days)
                      </label>
                      <select
                        value={prDuration}
                        onChange={(e) => setPrDuration(Number(e.target.value))}
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
                          onChange={(e) =>
                            setPrDocument(e.target.files?.[0] || null)
                          }
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("pr-document")?.click()
                          }
                          className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-left text-xs text-[var(--ui-text-muted)] flex items-center gap-2 hover:border-orange-400/50 transition-all truncate"
                        >
                          {prDocument ? (
                            <>
                              <FileText
                                size={14}
                                className="text-orange-500 shrink-0"
                              />{" "}
                              <span className="truncate text-orange-500 font-semibold">
                                {prDocument.name}
                              </span>
                            </>
                          ) : (
                            "Choose file..."
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar */}
          <div className="space-y-3">
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3 sticky top-4">
              <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] pb-2 border-b border-[var(--ui-border)] flex items-center justify-between">
                <span>{procurementType === "services" ? "Ringkasan Budget Jasa" : "Order Summary"}</span>
                {procurementType === "services" && (
                  <span className="text-[10px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                    Layanan Proyek
                  </span>
                )}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ui-text-muted)]">
                    {procurementType === "services" ? "Pagu Alokasi Budget" : "Subtotal"}
                  </span>
                  <span className="font-semibold text-[var(--ui-text-primary)] tabular-nums">
                    IDR {cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ui-text-muted)]">Tax (0%)</span>
                  <span className="font-semibold text-[var(--ui-text-primary)]">
                    IDR 0
                  </span>
                </div>
                {procurementType === "services" && (
                  <div className="text-[10px] text-[var(--ui-text-muted)] bg-orange-500/5 border border-orange-500/20 p-2 rounded-lg">
                    💡 <b>Pagu Budget:</b> Menjadi batas atas (Owner Estimate / HPS) bagi vendor dalam mengajukan penawaran tender.
                  </div>
                )}
                <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between">
                  <span className="font-bold text-[var(--ui-text-primary)] uppercase">
                    {procurementType === "services" ? "Total Pagu Anggaran" : "Total"}
                  </span>
                  <span className="text-sm font-bold text-orange-500 tabular-nums">
                    IDR {cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleSubmitPR}
                disabled={
                  loading || revisionLoading || !!error || cart.length === 0
                }
                style={{ color: "white" }}
                className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {revisionRfqId ? "Submit revised PR" : "Submit Request"}{" "}
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-[var(--ui-text-muted)] text-center leading-relaxed">
                By submitting, this request will be sent to your manager for
                approval before being published.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
