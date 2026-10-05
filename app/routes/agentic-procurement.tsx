import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { runAgenticProcurement, chatAgenticProcurement, createAgenticPr } from "../lib/api/ai";
import { isAgenticProcurementEnabled, setAgenticProcurementEnabled } from "../lib/features";
import { clearCart } from "../lib/cart";

import {
  FileText,
  Layers,
  Package,
  Bot,
  ShoppingBag,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import Swal from "sweetalert2";
import { useLanguage } from "../context/LanguageContext";
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
} from "../features/agentic-procurement";

export default function AgenticProcurementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pr" | "comparison" | "catalogues" | "chat">("pr");
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);

  // Real-time animated workflow steps (title translated on each render via t() and buildSteps)
  function buildSteps(statuses?: { step: string; status: string; summary?: string }[]): StepStatus[] {
    if (statuses) {
      return statuses.map((s) => ({
        step: s.step as StepStatus["step"],
        title: getStepTitle(s.step),
        status: s.status as StepStatus["status"],
        summary: s.summary,
      }));
    }
    return [
      { step: "intent_analysis",    title: getStepTitle("intent_analysis"),    status: "pending" },
      { step: "catalogue_discovery", title: getStepTitle("catalogue_discovery"), status: "pending" },
      { step: "product_comparison",  title: getStepTitle("product_comparison"),  status: "pending" },
      { step: "pr_formulation",      title: getStepTitle("pr_formulation"),      status: "pending" },
    ];
  }
  function getStepTitle(step: string): string {
    switch (step) {
      case "intent_analysis":    return t("agentic.workflow.steps.intentAnalysis");
      case "web_search":         return t("agentic.workflow.steps.webSearch");
      case "catalogue_discovery": return t("agentic.workflow.steps.catalogueDiscovery");
      case "product_comparison":  return t("agentic.workflow.steps.productComparison");
      case "pr_formulation":      return t("agentic.workflow.steps.prFormulation");
      default: return step;
    }
  }

  const [workflowSteps, setWorkflowSteps] = useState<StepStatus[]>(buildSteps());

  // Chat refinement state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync workflow step titles whenever locale changes
  useEffect(() => {
    setWorkflowSteps((prev) =>
      prev.map((s) => ({ ...s, title: getStepTitle(s.step) }))
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
      window.removeEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
      window.removeEventListener("storage", handleFeatureUpdate);
    };
  }, []);

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
      const comp = JSON.parse(compStr);
      setActiveCompany(comp);
      if (comp.type === "vendor") {
        navigate("/");
        return;
      }
    }
    const userStr = localStorage.getItem("user_session");
    if (userStr) {
      setUser(JSON.parse(userStr));
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
      { step: "intent_analysis",    title: getStepTitle("intent_analysis"),    status: "running" },
      { step: "web_search",          title: getStepTitle("web_search"),          status: "pending" },
      { step: "catalogue_discovery", title: getStepTitle("catalogue_discovery"), status: "pending" },
      { step: "product_comparison",  title: getStepTitle("product_comparison"),  status: "pending" },
      { step: "pr_formulation",      title: getStepTitle("pr_formulation"),      status: "pending" },
    ]);

    try {
      const stepTimer1 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx === 0
              ? { ...s, status: "completed" }
              : idx === 1
              ? { ...s, status: "running" }
              : s
          )
        );
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx <= 1
              ? { ...s, status: "completed" }
              : idx === 2
              ? { ...s, status: "running" }
              : s
          )
        );
      }, 2500);

      const stepTimer3 = setTimeout(() => {
        setWorkflowSteps((prev) =>
          prev.map((s, idx) =>
            idx <= 2
              ? { ...s, status: "completed" }
              : idx === 3
              ? { ...s, status: "running" }
              : s
          )
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

        // Bangun summary web_search dari response
        const webSearchCount = res.web_search ? Object.keys(res.web_search).length : 0;
        const webSearchFound = webSearchCount > 0
          ? t("agentic.workflow.braveFoundSummary", { count: webSearchCount })
          : (res.workflow_steps?.find((s: any) => s.step === "web_search")?.summary || t("agentic.workflow.brandsFound"));

        // Kumpulkan semua sumber URL Brave dari web_search results
        const rawWebSources: any[] = [];
        if (res.web_search) {
          Object.values(res.web_search).forEach((data: any) => {
            (data.results || []).forEach((r: any) => {
              if (r.link) rawWebSources.push({
                title: r.title || "",
                link: r.link,
                price: r.price || 0,
                snippet: r.snippet || "",
                thumbnail: r.thumbnail || null,
              });
            });
          });
        }
        // Tambahkan juga sumber dari workflow step jika ada
        const stepSources = res.workflow_steps?.find((s: any) => s.step === "web_search")?.sources || [];
        stepSources.forEach((s: any) => {
          if (s.link && !rawWebSources.find((r) => r.link === s.link)) {
            rawWebSources.push({ title: s.title || "", link: s.link, price: s.price || 0 });
          }
        });

        const webSearchSources = rawWebSources.slice(0, 30);
        const brandRecommendations = res.workflow_steps?.find((s: any) => s.step === "web_search")?.brand_recommendations || [];

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
            // @ts-ignore — extra fields for source panel
            webSearchSources,
            brandRecommendations,
          },
          {
            step: "catalogue_discovery",
            title: getStepTitle("catalogue_discovery"),
            status: "completed",
            summary: t("agentic.workflow.catalogueFoundSummary", { count: res.catalogues?.length || 0 }),
          },
          {
            step: "product_comparison",
            title: getStepTitle("product_comparison"),
            status: "completed",
            summary: res.comparison?.executive_summary || t("agentic.workflow.comparisonDoneSummary"),
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
        throw new Error(res?.error || t("agentic.error.swalProcessFailedTitle"));
      }
    } catch (err: any) {
      console.error("Agentic procurement error:", err);
      setWorkflowSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: s.status === "running" ? "failed" : s.status,
        }))
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
      0
    );
    if (itemsSum && itemsSum > 0) return itemsSum;
    if (draft.estimated_total_budget && Number(draft.estimated_total_budget) > 0) {
      return Number(draft.estimated_total_budget);
    }
    if (intent?.estimated_total_budget_idr && Number(intent.estimated_total_budget_idr) > 0) {
      return Number(intent.estimated_total_budget_idr);
    }
    return 0;
  };

  const handleCreatePrNow = async (config?: { department?: string; tenderDays?: number; attachments?: File[] }) => {
    if (!result?.pr_draft || !activeCompany?.id) return;

    const totalBudget = getPrTotalBudget(result.pr_draft, result.intent);
    const department = config?.department || result.pr_draft.department || "Procurement";
    const tenderDays = config?.tenderDays || result.pr_draft.duration_days || 14;
    const countItems = result.pr_draft.suggested_items?.length || 0;
    const winnerName = selectedWinner?.product_name || selectedWinner?.name;
    const winnerHtml = winnerName
      ? t("agentic.prDraft.actions.winnerLabel", { name: winnerName })
      : "";
    const budgetLabel = totalBudget > 0 ? `Rp ${totalBudget.toLocaleString("id-ID")}` : t("agentic.prDraft.needVendorOffer");

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
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      confirmButtonText: t("agentic.prDraft.actions.confirmYes"),
      cancelButtonText: t("agentic.prDraft.actions.cancel"),
    });

    if (!confirm.isConfirmed) return;

    setIsCreatingPr(true);
    try {
      const payload = {
        ...result.pr_draft,
        department,
        duration_days: tenderDays,
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
          confirmButtonColor: "#f97316",
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
      (item: any) => String(item.id) === String(comparisonItem.catalogue_id)
    );
    const isBrandComparison = result?.comparison?.source === "brave_brand_comparison";
    const isWebListing = result?.comparison?.source === "brave_web_listings";
    if (!catalogue && !isBrandComparison && !isWebListing) return;

    const currentItems = result?.pr_draft?.suggested_items || [];
    const existingIndex = currentItems.findIndex(
      (item: any) => catalogue && String(item.catalogue_id) === String(catalogue.id)
    );
    const targetIndex = existingIndex >= 0 ? existingIndex : currentItems.length === 1 ? 0 : -1;
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
      qty: Math.max(1, Number(targetIndex >= 0 ? currentItems[targetIndex].qty : 1) || 1),
      estimated_price: webPrice,
      price_status: listingPrice > 0 ? "web_listing_reference" : webPrice > 0 ? "web_market_reference" : "rfq_required",
      price_note: listingPrice > 0 ? "Harga dari satu listing web; bukan median pasar." : webPrice > 0 ? "Harga median berdasarkan referensi web." : "Tidak ada harga web tervalidasi; harga ditentukan melalui RFQ.",
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
          (total: number, item: any) => total + (Number(item.qty) || 1) * (Number(item.estimated_price) || 0),
          0
        ),
      },
    }));
    setSelectedWinner(comparisonItem);
    setActiveTab("pr");
  };

  const handleUpdatePrItemQty = (itemIndex: number, quantity: number) => {
    setResult((previous: any) => {
      const items = previous?.pr_draft?.suggested_items;
      if (!Array.isArray(items) || !items[itemIndex]) return previous;

      const suggestedItems = items.map((item: any, index: number) =>
        index === itemIndex ? { ...item, qty: Math.max(1, quantity) } : item
      );

      return {
        ...previous,
        pr_draft: {
          ...previous.pr_draft,
          suggested_items: suggestedItems,
          estimated_total_budget: suggestedItems.reduce(
            (total: number, item: any) => total + (Number(item.qty) || 1) * (Number(item.estimated_price) || 0),
            0
          ),
        },
      };
    });
  };

  const handleExportToCart = () => {
    if (!result?.pr_draft?.suggested_items) return;

    const items = result.pr_draft.suggested_items.map((item: any) => ({
      id: item.catalogue_id || item.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
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
      { role: "user" as const, content: userText, timestamp: new Date().toLocaleTimeString() },
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
          { role: "assistant", content: res.reply, timestamp: new Date().toLocaleTimeString() },
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

  // Tab pills label (translated reactively)
  const tabBadgeCount = (tab: "pr" | "comparison" | "catalogues" | "chat") => {
    if (tab === "pr") return result?.pr_draft?.suggested_items?.length || 0;
    if (tab === "comparison") return result?.comparison?.comparison_matrix?.length || 0;
    if (tab === "catalogues") return result?.catalogues?.length || 0;
    return chatMessages.length;
  };
  const TABS: { key: "pr" | "comparison" | "catalogues" | "chat"; label: string; icon: React.ReactNode; showBadge: boolean }[] = [
    { key: "pr",           label: t("agentic.tabs.prDraft"),      icon: <FileText size={13} />, showBadge: true },
    { key: "comparison",   label: t("agentic.tabs.comparison"),   icon: <Layers size={13} />,   showBadge: true },
    { key: "catalogues",   label: t("agentic.tabs.catalogues"),   icon: <Package size={13} />,  showBadge: true },
    { key: "chat",         label: t("agentic.tabs.chat"),         icon: <Bot size={13} />,      showBadge: false },
  ];

  return (
    <Layout
      title={t("agentic.page.title")}
      subtitle={t("agentic.page.subtitle")}
    >
      <div className="flex flex-col gap-4 max-w-7xl mx-auto pb-12">
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
            webSearchSources={
              (result?.workflow_steps?.find((s: any) => s.step === "web_search")?.sources || [])
                .concat(
                  Object.values(result?.web_search || {}).flatMap((d: any) =>
                    (d.results || []).map((r: any) => ({
                      title: r.title || "",
                      link: r.link,
                      price: r.price || 0,
                      snippet: r.snippet || "",
                      thumbnail: r.thumbnail || null,
                    }))
                  )
                )
                .filter((s: any, i: number, arr: any[]) => s.link && arr.findIndex((x) => x.link === s.link) === i)
                .slice(0, 30)
            }
            brandRecommendations={
              result?.workflow_steps?.find((s: any) => s.step === "web_search")?.brand_recommendations || []
            }
          />
        )}

        {/* Results Section */}
        {result && (
          <div className="flex flex-col gap-3">
            {/* Navigation Tabs & Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--ui-border)] pb-2.5">
              {/* Tab pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {TABS.map((tab) => {
                  const count = tabBadgeCount(tab.key);
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                        activeTab === tab.key
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.showBadge && count > 0 && (
                        <span className="text-[10px] px-1 rounded bg-white/20">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportToCart}
                  className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg bg-[var(--ui-bg-card)] hover:bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ShoppingBag size={13} />
                  <span>{t("agentic.tabs.checkout")}</span>
                </button>

                <button
                  onClick={() => handleCreatePrNow()}
                  disabled={isCreatingPr}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPr ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{t("agentic.tabs.saving")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>{t("agentic.tabs.createPr")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

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
              />
            )}

            {/* TAB 2: COMPARISON MATRIX */}
            {activeTab === "comparison" && (
              <AgenticComparisonTab
                comparison={result.comparison}
                formatRupiah={formatRupiah}
                onSelectWinner={handleSelectComparisonItem}
                selectedWinnerId={selectedWinner ? String(selectedWinner.catalogue_id ?? selectedWinner.id ?? selectedWinner.product_name) : null}
              />
            )}

            {/* TAB 3: CATALOGUES */}
            {activeTab === "catalogues" && (
              <AgenticCatalogueTab
                catalogues={result.catalogues || []}
              />
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
          </div>
        )}
      </div>
    </Layout>
  );
}
