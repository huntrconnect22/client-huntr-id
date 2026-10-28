import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { createRfq, getRfq, resubmitRfq } from "../../../lib/api";
import { clearCart } from "../../../lib/cart";
import { getWarehouses, getWmsApps } from "../../../lib/api/wms";
import type {
  CartItem,
  CompanyAddress,
  DurationCalculation,
  ProcurementMode,
  ProcurementType,
} from "../types";

export function useCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PR Form states
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");
  const [prDuration, setPrDuration] = useState(7);
  const [prDepartment, setPrDepartment] = useState("General Procurement");
  const [prDocument, setPrDocument] = useState<File | null>(null);
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [companyAddresses, setCompanyAddresses] = useState<CompanyAddress[]>([]);

  // WMS states
  const [wmsInstalled, setWmsInstalled] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [deliveryPointBeforeWarehouse, setDeliveryPointBeforeWarehouse] = useState("");

  // Procurement mode & types
  const [procurementMode, setProcurementMode] = useState<ProcurementMode>(
    () => (searchParams.get("mode") === "direct" ? "direct" : "tender"),
  );
  const [procurementType, setProcurementType] = useState<ProcurementType>("goods");

  // Service specific states
  const [projectType, setProjectType] = useState<string>("Teknologi Informasi (IT)");
  const [customProjectType, setCustomProjectType] = useState<string>("");
  const [serviceStartDate, setServiceStartDate] = useState("");
  const [serviceEndDate, setServiceEndDate] = useState("");
  const [serviceWorkingSchedule, setServiceWorkingSchedule] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");

  // Revision states
  const [revisionRfqId] = useState(() => searchParams.get("revise"));
  const [revisionLoading, setRevisionLoading] = useState(
    Boolean(searchParams.get("revise")),
  );

  const getCompanyPrefix = useCallback((comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug =
      c.slug ||
      c.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  }, [activeCompany]);

  // Duration calculation for services
  const durationCalculation = useMemo<DurationCalculation | null>(() => {
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
      text:
        diffDays === 1
          ? "1 Hari Kalender"
          : diffDays < 30
          ? `${diffDays} Hari Kalender`
          : `${diffDays} Hari Kalender (~${months} Bulan)`,
    };
  }, [serviceStartDate, serviceEndDate]);

  // Initial load
  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    if (userSession) setUser(JSON.parse(userSession));

    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      setActiveCompany(comp);

      const addresses: CompanyAddress[] = [];
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
            line_type: "goods",
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
  }, [getCompanyPrefix, navigate, searchParams]);

  // Load Revision PR
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

  // Load WMS apps and warehouses
  useEffect(() => {
    if (!activeCompany?.id) return;
    getWmsApps(activeCompany.id)
      .then((apps) => {
        const installed = Boolean(
          apps?.apps?.find((app: any) => app.key === "wms-inventory")?.installed,
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
  }, [activeCompany, getCompanyPrefix, location.pathname, location.search, navigate]);

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.estimated_price || 0) * item.qty,
      0,
    );
  }, [cart]);

  const selectedWarehouse = useMemo(() => {
    return warehouses.find(
      (warehouse: any) => String(warehouse.id) === String(warehouseId),
    );
  }, [warehouses, warehouseId]);

  const warehouseDeliveryPoint = useMemo(() => {
    return selectedWarehouse
      ? [selectedWarehouse.name, selectedWarehouse.address]
          .filter(Boolean)
          .join(" · ")
      : "";
  }, [selectedWarehouse]);

  // Cart operations
  const updateEstimatedPrice = useCallback((id: string, price: number) => {
    setCart((prevCart) => {
      const newCart = prevCart.map((i) =>
        i.id === id ? { ...i, estimated_price: price } : i,
      );
      localStorage.setItem("huntr_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    setCart((items) => {
      const newCart = items.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, qty || 1) } : item,
      );
      localStorage.setItem("huntr_cart", JSON.stringify(newCart));
      return newCart;
    });
  }, []);

  const addManualItem = useCallback(() => {
    setCart((items) => [
      ...items,
      {
        id: `manual-${crypto.randomUUID()}`,
        manual: true,
        name: "",
        uom: "unit",
        qty: 1,
        estimated_price: 0,
        line_type: "goods",
      },
    ]);
  }, []);

  const addServiceLine = useCallback(() => {
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
  }, [serviceStartDate, serviceEndDate]);

  const updateManualItem = useCallback((id: string, field: string, value: string) => {
    setCart((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }, []);

  const handleWarehouseChange = useCallback(
    (nextWarehouseId: string) => {
      if (!nextWarehouseId) {
        setWarehouseId("");
        setDeliveryPoint(deliveryPointBeforeWarehouse);
        return;
      }
      const warehouse = warehouses.find(
        (item: any) => String(item.id) === String(nextWarehouseId),
      );
      setDeliveryPointBeforeWarehouse(deliveryPoint);
      setWarehouseId(nextWarehouseId);
      setDeliveryPoint(
        [warehouse?.name, warehouse?.address].filter(Boolean).join(" · "),
      );
    },
    [deliveryPoint, deliveryPointBeforeWarehouse, warehouses],
  );

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
      const finalProjectType =
        projectType === "Lainnya"
          ? customProjectType.trim() || "Lainnya"
          : projectType;
      if (procurementType !== "goods" && finalProjectType) {
        formData.append("project_type", finalProjectType);
      }
      if (serviceStartDate) formData.append("service_start_date", serviceStartDate);
      if (serviceEndDate) formData.append("service_end_date", serviceEndDate);
      if (serviceLocation || procurementType === "services")
        formData.append("service_location", serviceLocation || deliveryPoint);
      const finalCriteria = [
        acceptanceCriteria.trim(),
        serviceWorkingSchedule
          ? `Pola/Waktu Kerja: ${serviceWorkingSchedule.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
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
          formData.append(
            `items[${index}][uom]`,
            item.uom || (item.line_type === "service" ? "lot" : "unit"),
          );
          if (item.service_scope)
            formData.append(`items[${index}][service_scope]`, item.service_scope);
          if (item.acceptance_criteria)
            formData.append(
              `items[${index}][acceptance_criteria]`,
              item.acceptance_criteria,
            );
          if (item.service_start_date)
            formData.append(
              `items[${index}][service_start_date]`,
              item.service_start_date,
            );
          if (item.service_end_date)
            formData.append(
              `items[${index}][service_end_date]`,
              item.service_end_date,
            );
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

  return {
    navigate,
    getCompanyPrefix,
    cart,
    cartTotal,
    loading,
    success,
    error,
    setError,
    prTitle,
    setPrTitle,
    prDesc,
    setPrDesc,
    prDuration,
    setPrDuration,
    prDepartment,
    setPrDepartment,
    prDocument,
    setPrDocument,
    deliveryPoint,
    setDeliveryPoint,
    companyAddresses,
    wmsInstalled,
    warehouses,
    warehouseId,
    selectedWarehouse,
    warehouseDeliveryPoint,
    handleWarehouseChange,
    procurementMode,
    setProcurementMode,
    procurementType,
    setProcurementType,
    projectType,
    setProjectType,
    customProjectType,
    setCustomProjectType,
    serviceStartDate,
    setServiceStartDate,
    serviceEndDate,
    setServiceEndDate,
    serviceWorkingSchedule,
    setServiceWorkingSchedule,
    serviceLocation,
    setServiceLocation,
    acceptanceCriteria,
    setAcceptanceCriteria,
    durationCalculation,
    revisionRfqId,
    revisionLoading,
    updateEstimatedPrice,
    updateQuantity,
    addManualItem,
    addServiceLine,
    updateManualItem,
    handleSubmitPR,
  };
}


