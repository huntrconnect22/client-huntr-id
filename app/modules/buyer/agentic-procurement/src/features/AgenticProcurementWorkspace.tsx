import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  CircularProgress,
  useTheme,
} from "@mui/material";
import Layout from "~/components/Layout";
import {
  runAgenticProcurement,
  chatAgenticProcurement,
  createAgenticPr,
} from "~/lib/api/ai";
import {
  isAgenticProcurementEnabled,
  setAgenticProcurementEnabled,
} from "~/lib/features";
import { clearCart } from "~/lib/cart";
import { getWarehouses, getWmsApps } from "~/lib/api/wms";

import {
  FileText,
  Layers,
  Package,
  Bot,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import { useLanguage } from "~/context/LanguageContext";
import {
  type StepStatus,
  type ChatMessage,
  AgenticPromptInput,
  AgenticWorkflowSteps,
  AgenticPrDraftTab,
  AgenticComparisonTab,
  AgenticCatalogueTab,
  AgenticChatTab,
  AgenticNoticeBanner,
} from "~/features/agentic-procurement";

/**
 * AgenticProcurementPage Component
 * 
 * 100% Pure Material UI implementation.
 */
export default function AgenticProcurementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const theme = useTheme();

  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "pr" | "comparison" | "catalogues" | "chat"
  >("pr");
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [wmsInstalled, setWmsInstalled] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Real-time animated workflow steps
  function buildSteps(
    statuses?: { step: string; status: string; summary?: string }[],
  ): StepStatus[] {
    if (statuses) {
      return statuses.map((s) => ({
        step: s.step as StepStatus["step"],
        title: getStepTitle(s.step),
        status: s.status as StepStatus["status"],
        summary: s.summary,
      }));
    }
    return [
      {
        step: "intent_analysis",
        title: getStepTitle("intent_analysis"),
        status: "pending",
      },
      {
        step: "catalogue_discovery",
        title: getStepTitle("catalogue_discovery"),
        status: "pending",
      },
      {
        step: "product_comparison",
        title: getStepTitle("product_comparison"),
        status: "pending",
      },
      {
        step: "pr_formulation",
        title: getStepTitle("pr_formulation"),
        status: "pending",
      },
    ];
  }

  function getStepTitle(step: string): string {
    switch (step) {
      case "intent_analysis":
        return t("agentic.workflow.steps.intentAnalysis");
      case "web_search":
        return t("agentic.workflow.steps.webSearch");
      case "catalogue_discovery":
        return t("agentic.workflow.steps.catalogueDiscovery");
      case "product_comparison":
        return t("agentic.workflow.steps.productComparison");
      case "pr_formulation":
        return t("agentic.workflow.steps.prFormulation");
      default:
        return step;
    }
  }

  const [workflowSteps, setWorkflowSteps] =
    useState<StepStatus[]>(buildSteps());

  // Chat refinement state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync workflow step titles whenever locale changes
  useEffect(() => {
    setWorkflowSteps((prev) =>
      prev.map((s) => ({ ...s, title: getStepTitle(s.step) })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Sync feature flag state
  useEffect(() => {
    setIsFeatureEnabled(isAgenticProcurementEnabled());
    const handleFeatureUpdate = () => {
      setIsFeatureEnabled(isAgenticProcurementEnabled());
    };
    window.addEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
    window.addEventListener("storage", handleFeatureUpdate);
    return () => {
      window.removeEventListener(
        "huntr-feature-flags-updated",
        handleFeatureUpdate,
      );
      window.removeEventListener("storage", handleFeatureUpdate);
    };
  }, []);

  useEffect(() => {
    if (!activeCompany?.id) return;

    getWmsApps(activeCompany.id)
      .then(async (apps) => {
        const installed = Boolean(
          apps?.apps?.find((app: any) => app.key === "wms-inventory")
            ?.installed,
        );
        setWmsInstalled(installed);
        setWarehouses(
          installed ? (await getWarehouses(activeCompany.id))?.data || [] : [],
        );
      })
      .catch(() => {
        setWmsInstalled(false);
        setWarehouses([]);
      });
  }, [activeCompany?.id]);

  const handleActivateFeature = () => {
    setAgenticProcurementEnabled(true);
    setIsFeatureEnabled(true);
    Swal.fire({
      icon: "success",
      title: t("agentic.banner.activateSuccessTitle"),
      text: t("agentic.banner.activateSuccessText"),
      timer: 2000,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    const compStr = localStorage.getItem("active_company");
    if (compStr) {
      try {
        const comp = JSON.parse(compStr);
        setActiveCompany(comp);
        if (comp.type === "vendor") {
          navigate("/");
          return;
        }
      } catch (e) {
        console.error("Invalid active company session", e);
      }
    }
    const userStr = localStorage.getItem("user_session");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Invalid user session", e);
      }
    }

    const searchParams = new URLSearchParams(location.search);
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setPrompt(initialQuery);
      handleExecuteWorkflow(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const getCompanyPrefix = () => {
    if (!activeCompany) return "";
    const slug =
      activeCompany.slug ||
      (activeCompany.name
        ? activeCompany.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : "");
    return slug ? `/${slug}` : "";
  };

  const handleExecuteWorkflow = async (userPromptToRun?: string) => {
    const promptText = userPromptToRun || prompt;
    if (!promptText.trim()) return;

    setIsRunning(true);
    setSelectedWinner(null);
    setResult(null);

    setWorkflowSteps([
      {
        step: "intent_analysis",
        title: getStepTitle("intent_analysis"),
        status: "running",
      },
      {
        step: "web_search",
        title: getStepTitle("web_search"),
        status: "pending",
      },
      {
        step: "catalogue_discovery",
        title: getStepTitle("catalogue_discovery"),
        status: "pending",
      },
      {
        step: "product_comparison",
        title: getStepTitle("product_comparison"),
        status: "pending",
      },
      {
        step: "pr_formulation",
        title: getStepTitle("pr_formulation"),
        status: "pending",
      },
    ]);

    try {
      const stepTimer1 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx === 0
              ? { ...s, status: "completed" }
              : idx === 1
                ? { ...s, status: "running" }
                : s,
          ),
        );
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx <= 1
              ? { ...s, status: "completed" }
              : idx === 2
                ? { ...s, status: "running" }
                : s,
          ),
        );
      }, 2500);

      const stepTimer3 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx <= 2
              ? { ...s, status: "completed" }
              : idx === 3
                ? { ...s, status: "running" }
                : s,
          ),
        );
      }, 4000);

      const res = await runAgenticProcurement(promptText, {
        company_id: activeCompany?.id,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (res && res.success) {
        setResult(res);

        const webSearchCount = res.web_search
          ? Object.keys(res.web_search).length
          : 0;
        const webSearchFound =
          webSearchCount > 0
            ? t("agentic.workflow.braveFoundSummary", { count: webSearchCount })
            : res.workflow_steps?.find((s: any) => s.step === "web_search")
                ?.summary || t("agentic.workflow.brandsFound");

        const rawWebSources: any[] = [];
        if (res.web_search) {
          Object.values(res.web_search).forEach((data: any) => {
            (data.results || []).forEach((r: any) => {
              if (r.link)
                rawWebSources.push({
                  title: r.title || "",
                  link: r.link,
                  price: r.price || 0,
                  snippet: r.snippet || "",
                  thumbnail: r.thumbnail || null,
                });
            });
          });
        }
        const stepSources =
          res.workflow_steps?.find((s: any) => s.step === "web_search")
            ?.sources || [];
        stepSources.forEach((s: any) => {
          if (s.link && !rawWebSources.find((r) => r.link === s.link)) {
            rawWebSources.push({
              title: s.title || "",
              link: s.link,
              price: s.price || 0,
            });
          }
        });

        const webSearchSources = rawWebSources.slice(0, 30);
        const brandRecommendations =
          res.workflow_steps?.find((s: any) => s.step === "web_search")
            ?.brand_recommendations || [];

        setWorkflowSteps([
          {
            step: "intent_analysis",
            title: getStepTitle("intent_analysis"),
            status: "completed",
            summary: res.intent?.ai_summary,
          },
          {
            step: "web_search",
            title: getStepTitle("web_search"),
            status: "completed",
            summary: webSearchFound,
            // @ts-ignore
            webSearchSources,
            brandRecommendations,
          },
          {
            step: "catalogue_discovery",
            title: getStepTitle("catalogue_discovery"),
            status: "completed",
            summary: t("agentic.workflow.catalogueFoundSummary", {
              count: res.catalogues?.length || 0,
            }),
          },
          {
            step: "product_comparison",
            title: getStepTitle("product_comparison"),
            status: "completed",
            summary:
              res.comparison?.executive_summary ||
              t("agentic.workflow.comparisonDoneSummary"),
          },
          {
            step: "pr_formulation",
            title: getStepTitle("pr_formulation"),
            status: "completed",
            summary: res.pr_draft?.title,
          },
        ]);

        const prTitle = res.pr_draft?.title || t("agentic.prDraft.headerTitle");
        setChatMessages([
          {
            role: "assistant",
            content: t("agentic.chat.introMessage", { title: prTitle }),
          },
        ]);
        setActiveTab("pr");
      } else {
        throw new Error(
          res?.error || t("agentic.error.swalProcessFailedTitle"),
        );
      }
    } catch (err: any) {
      console.error("Agentic procurement error:", err);
      setWorkflowSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: s.status === "running" ? "failed" : s.status,
        })),
      );
      Swal.fire({
        icon: "error",
        title: t("agentic.error.swalProcessFailedTitle"),
        text: err?.message || t("agentic.error.swalProcessFailedText"),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getPrTotalBudget = (draft?: any, intent?: any) => {
    if (!draft) return 0;
    const itemsSum = draft.suggested_items?.reduce(
      (acc: number, cur: any) =>
        acc + (Number(cur.qty) || 1) * (Number(cur.estimated_price) || 0),
      0,
    );
    if (itemsSum && itemsSum > 0) return itemsSum;
    if (
      draft.estimated_total_budget &&
      Number(draft.estimated_total_budget) > 0
    ) {
      return Number(draft.estimated_total_budget);
    }
    if (
      intent?.estimated_total_budget_idr &&
      Number(intent.estimated_total_budget_idr) > 0
    ) {
      return Number(intent.estimated_total_budget_idr);
    }
    return 0;
  };

  const handleCreatePrNow = async (config?: {
    department?: string;
    tenderDays?: number;
    attachments?: File[];
    warehouseId?: string;
  }) => {
    if (!result?.pr_draft || !activeCompany?.id) return;

    const totalBudget = getPrTotalBudget(result.pr_draft, result.intent);
    const department =
      config?.department || result.pr_draft.department || "Procurement";
    const tenderDays =
      config?.tenderDays || result.pr_draft.duration_days || 14;
    const countItems = result.pr_draft.suggested_items?.length || 0;
    const winnerName = selectedWinner?.product_name || selectedWinner?.name;
    const winnerHtml = winnerName
      ? t("agentic.prDraft.actions.winnerLabel", { name: winnerName })
      : "";
    const budgetLabel =
      totalBudget > 0
        ? `Rp ${totalBudget.toLocaleString("id-ID")}`
        : t("agentic.prDraft.needVendorOffer");

    const confirm = await Swal.fire({
      title: t("agentic.prDraft.actions.confirmTitle"),
      html: t("agentic.prDraft.actions.confirmHtml", {
        title: result.pr_draft.title,
        countItems,
        dept: department,
        tenderDays,
        winnerHtml,
        budget: budgetLabel,
      }),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef7d00",
      cancelButtonColor: "#6b7280",
      confirmButtonText: t("agentic.prDraft.actions.confirmYes"),
      cancelButtonText: t("agentic.prDraft.actions.cancel"),
    });

    if (!confirm.isConfirmed) return;

    setIsCreatingPr(true);
    try {
      const payload = {
        ...result.pr_draft,
        suggested_items: (result.pr_draft.suggested_items || []).map((i: any) => ({
          ...i,
          qty: Number(i.qty) || 1,
        })),
        department,
        duration_days: tenderDays,
        warehouse_id: config?.warehouseId || null,
        selected_winner: selectedWinner || null,
      };
      const res = await createAgenticPr(activeCompany.id, payload);
      if (res && res.success && res.rfq?.id) {
        clearCart();
        await Swal.fire({
          icon: "success",
          title: t("agentic.prDraft.actions.successTitle"),
          text: t("agentic.prDraft.actions.successText", {
            title: result.pr_draft.title,
            id: res.rfq.id,
          }),
          confirmButtonColor: "#ef7d00",
          confirmButtonText: t("agentic.prDraft.actions.successButton"),
        });

        const prefix = getCompanyPrefix();
        navigate(`${prefix}/my-pr/${res.rfq.id}`);
      } else {
        throw new Error(res?.error || t("agentic.prDraft.actions.errorTitle"));
      }
    } catch (err: any) {
      console.error("Create PR error:", err);
      Swal.fire({
        icon: "error",
        title: t("agentic.prDraft.actions.errorTitle"),
        text: err?.message || t("agentic.prDraft.actions.errorText"),
      });
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleSelectComparisonItem = (comparisonItem: any) => {
    const catalogue = result?.catalogues?.find(
      (item: any) => String(item.id) === String(comparisonItem.catalogue_id),
    );
    const isBrandComparison =
      result?.comparison?.source === "brave_brand_comparison";
    const isWebListing = result?.comparison?.source === "brave_web_listings";
    if (!catalogue && !isBrandComparison && !isWebListing) return;

    const currentItems = result?.pr_draft?.suggested_items || [];
    const existingIndex = currentItems.findIndex(
      (item: any) =>
        catalogue && String(item.catalogue_id) === String(catalogue.id),
    );
    const targetIndex =
      existingIndex >= 0 ? existingIndex : currentItems.length === 1 ? 0 : -1;
    const selectedName = catalogue?.name || comparisonItem.product_name;
    if (!selectedName) return;

    const listingPrice = Number(comparisonItem.web_listing_price) || 0;
    const webPrice = Number(comparisonItem.web_price_avg) || listingPrice;
    const selectedItem = {
      ...(targetIndex >= 0 ? currentItems[targetIndex] : {}),
      catalogue_id: catalogue?.id ?? null,
      id: catalogue?.id ?? comparisonItem.catalogue_id,
      name: selectedName,
      item_code: catalogue?.item_code ?? null,
      category: catalogue?.category ?? result?.intent?.category ?? null,
      brand: catalogue?.brand ?? comparisonItem.brand ?? null,
      detailed_specs: catalogue?.specifications ?? null,
      uom: catalogue?.uom ?? "unit",
      qty: Math.max(
        1,
        Number(targetIndex >= 0 ? currentItems[targetIndex].qty : 1) || 1,
      ),
      estimated_price: webPrice,
      price_status:
        listingPrice > 0
          ? "web_listing_reference"
          : webPrice > 0
            ? "web_market_reference"
            : "rfq_required",
      price_note:
        listingPrice > 0
          ? "Harga dari satu listing web; bukan median pasar."
          : webPrice > 0
            ? "Harga median berdasarkan referensi web."
            : "Tidak ada harga web tervalidasi; harga ditentukan melalui RFQ.",
      web_price_min: comparisonItem.web_price_min ?? null,
      web_price_max: comparisonItem.web_price_max ?? null,
      web_price_avg: webPrice > 0 ? webPrice : null,
      web_sources: comparisonItem.web_sources ?? [],
    };
    const suggestedItems = [...currentItems];

    if (targetIndex >= 0) {
      suggestedItems[targetIndex] = selectedItem;
    } else {
      suggestedItems.push(selectedItem);
    }

    setResult((previous: any) => ({
      ...previous,
      pr_draft: {
        ...previous.pr_draft,
        suggested_items: suggestedItems,
        estimated_total_budget: suggestedItems.reduce(
          (total: number, item: any) =>
            total +
            (Number(item.qty) || 1) * (Number(item.estimated_price) || 0),
          0,
        ),
      },
    }));
    setSelectedWinner(comparisonItem);
    setActiveTab("pr");
  };

  const handleUpdatePrItemQty = (itemIndex: number, quantity: number | string) => {
    setResult((previous: any) => {
      const items = previous?.pr_draft?.suggested_items;
      if (!Array.isArray(items) || !items[itemIndex]) return previous;

      const suggestedItems = items.map((item: any, index: number) =>
        index === itemIndex ? { ...item, qty: quantity === "" ? "" : Math.max(0, Number(quantity)) } : item,
      );

      return {
        ...previous,
        pr_draft: {
          ...previous.pr_draft,
          suggested_items: suggestedItems,
          estimated_total_budget: suggestedItems.reduce(
            (total: number, item: any) =>
              total +
              (Number(item.qty) || 0) * (Number(item.estimated_price) || 0),
            0,
          ),
        },
      };
    });
  };

  const handleExportToCart = () => {
    if (!result?.pr_draft?.suggested_items) return;

    const items = result.pr_draft.suggested_items.map((item: any) => ({
      id:
        item.catalogue_id ||
        item.id ||
        `ai-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || t("agentic.itemGenericName"),
      item_code: item.item_code || t("agentic.itemGenericCode"),
      category: item.category || t("agentic.itemGenericCategory"),
      brand: item.brand || "",
      uom: item.uom || t("agentic.itemGenericUom"),
      qty: item.qty || 1,
      estimated_price: item.estimated_price || 0,
      image_path: item.image_url || null,
    }));

    localStorage.setItem("huntr_cart", JSON.stringify(items));
    window.dispatchEvent(new Event("huntr-cart-updated"));
    localStorage.setItem("ai_pr_draft", JSON.stringify(result.pr_draft));

    const prefix = getCompanyPrefix();
    navigate(`${prefix}/checkout?from=ai`);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput("");
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      {
        role: "user" as const,
        content: userText,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
    setChatMessages(newMessages);
    setIsChatSending(true);

    try {
      const res = await chatAgenticProcurement(newMessages, {
        company_id: activeCompany?.id,
      });

      if (res && res.reply) {
        setChatMessages([
          ...newMessages,
          {
            role: "assistant",
            content: res.reply,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatSending(false);
    }
  };

  const formatRupiah = (num: number) => {
    return `Rp ${Number(num || 0).toLocaleString("id-ID")}`;
  };

  const tabBadgeCount = (tab: "pr" | "comparison" | "catalogues" | "chat") => {
    if (tab === "pr") return result?.pr_draft?.suggested_items?.length || 0;
    if (tab === "comparison")
      return result?.comparison?.comparison_matrix?.length || 0;
    if (tab === "catalogues") return result?.catalogues?.length || 0;
    return chatMessages.length;
  };

  return (
    <Layout
      title={t("agentic.page.title")}
      subtitle={t("agentic.page.subtitle")}
    >
      <Box sx={{ maxWidth: 1240, mx: "auto", width: "100%", pb: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Notice & Disclaimer Banners */}
        <AgenticNoticeBanner
          isFeatureEnabled={isFeatureEnabled}
          onActivateFeature={handleActivateFeature}
          onOpenSettings={() => navigate(`${getCompanyPrefix()}/account`)}
        />

        {/* Prompt Input & Preset Chips */}
        <AgenticPromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          isRunning={isRunning}
          onExecute={handleExecuteWorkflow}
        />

        {/* Step Reasoning Cards */}
        {(isRunning || result) && (
          <AgenticWorkflowSteps
            workflowSteps={workflowSteps}
            isRunning={isRunning}
            webSearchSources={(
              result?.workflow_steps?.find((s: any) => s.step === "web_search")
                ?.sources || []
            )
              .concat(
                Object.values(result?.web_search || {}).flatMap((d: any) =>
                  (d.results || []).map((r: any) => ({
                    title: r.title || "",
                    link: r.link,
                    price: r.price || 0,
                    snippet: r.snippet || "",
                    thumbnail: r.thumbnail || null,
                  })),
                ),
              )
              .filter(
                (s: any, i: number, arr: any[]) =>
                  s.link && arr.findIndex((x) => x.link === s.link) === i,
              )
              .slice(0, 30)}
            brandRecommendations={
              result?.workflow_steps?.find((s: any) => s.step === "web_search")
                ?.brand_recommendations || []
            }
          />
        )}

        {/* Results Section */}
        {result && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Header Tabs & Top Actions */}
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
                bgcolor: "background.paper",
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    minHeight: 44,
                    borderRadius: 2,
                    mr: 1,
                  },
                }}
              >
                <Tab
                  value="pr"
                  icon={<FileText size={15} />}
                  iconPosition="start"
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>{t("agentic.tabs.prDraft")}</span>
                      {tabBadgeCount("pr") > 0 && (
                        <Chip
                          size="small"
                          label={tabBadgeCount("pr")}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  }
                />
                <Tab
                  value="comparison"
                  icon={<Layers size={15} />}
                  iconPosition="start"
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>{t("agentic.tabs.comparison")}</span>
                      {tabBadgeCount("comparison") > 0 && (
                        <Chip
                          size="small"
                          label={tabBadgeCount("comparison")}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  }
                />
                <Tab
                  value="catalogues"
                  icon={<Package size={15} />}
                  iconPosition="start"
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>{t("agentic.tabs.catalogues")}</span>
                      {tabBadgeCount("catalogues") > 0 && (
                        <Chip
                          size="small"
                          label={tabBadgeCount("catalogues")}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  }
                />
                <Tab
                  value="chat"
                  icon={<Bot size={15} />}
                  iconPosition="start"
                  label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>{t("agentic.tabs.chat")}</span>
                      {chatMessages.length > 0 && (
                        <Chip
                          size="small"
                          label={chatMessages.length}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  }
                />
              </Tabs>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={handleExportToCart}
                  startIcon={<ShoppingBag size={15} />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, height: 38 }}
                >
                  {t("agentic.tabs.checkout")}
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleCreatePrNow()}
                  disabled={isCreatingPr}
                  startIcon={
                    isCreatingPr ? (
                      <CircularProgress size={15} color="inherit" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )
                  }
                  sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, height: 38 }}
                >
                  {isCreatingPr ? t("agentic.tabs.saving") : t("agentic.tabs.createPr")}
                </Button>
              </Stack>
            </Paper>

            {/* TAB 1: PR DRAFT PREVIEW */}
            {activeTab === "pr" && result.pr_draft && (
              <AgenticPrDraftTab
                prDraft={result.pr_draft}
                intent={result.intent}
                activeCompanyName={activeCompany?.name}
                isCreatingPr={isCreatingPr}
                onCreatePr={(config) => handleCreatePrNow(config)}
                onUpdateItemQty={handleUpdatePrItemQty}
                formatRupiah={formatRupiah}
                getTotalBudget={getPrTotalBudget}
                selectedWinner={selectedWinner}
                wmsInstalled={wmsInstalled}
                warehouses={warehouses}
              />
            )}

            {/* TAB 2: COMPARISON MATRIX */}
            {activeTab === "comparison" && (
              <AgenticComparisonTab
                comparison={result.comparison}
                formatRupiah={formatRupiah}
                onSelectWinner={handleSelectComparisonItem}
                selectedWinnerId={
                  selectedWinner
                    ? String(
                        selectedWinner.catalogue_id ??
                          selectedWinner.id ??
                          selectedWinner.product_name,
                      )
                    : null
                }
              />
            )}

            {/* TAB 3: CATALOGUES */}
            {activeTab === "catalogues" && (
              <AgenticCatalogueTab catalogues={result.catalogues || []} />
            )}

            {/* TAB 4: CHAT REFINEMENT */}
            {activeTab === "chat" && (
              <AgenticChatTab
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isChatSending={isChatSending}
                onSendMessage={handleSendChatMessage}
                chatEndRef={chatEndRef}
              />
            )}
          </Box>
        )}
      </Box>
    </Layout>
  );
}
