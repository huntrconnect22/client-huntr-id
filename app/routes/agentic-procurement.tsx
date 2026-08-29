import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { runAgenticProcurement, chatAgenticProcurement, createAgenticPr } from "../lib/api/ai";
import { isAgenticProcurementEnabled, setAgenticProcurementEnabled } from "../lib/features";
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

  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pr" | "comparison" | "catalogues" | "chat">("pr");
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);

  // Real-time animated workflow steps
  const [workflowSteps, setWorkflowSteps] = useState<StepStatus[]>([
    { step: "intent_analysis", title: "1. Analisis Kebutuhan", status: "pending" },
    { step: "catalogue_discovery", title: "2. Pencarian Katalog", status: "pending" },
    { step: "product_comparison", title: "3. Komparasi Opsi", status: "pending" },
    { step: "pr_formulation", title: "4. Formulasi PR Lengkap", status: "pending" },
  ]);

  // Chat refinement state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      title: "Fitur Diaktifkan!",
      text: "AI Agentic Procurement telah diaktifkan dan ditambahkan ke sidebar navigasi.",
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
    setResult(null);

    setWorkflowSteps([
      { step: "intent_analysis", title: "1. Analisis Kebutuhan", status: "running" },
      { step: "catalogue_discovery", title: "2. Pencarian Katalog", status: "pending" },
      { step: "product_comparison", title: "3. Komparasi Opsi", status: "pending" },
      { step: "pr_formulation", title: "4. Formulasi PR Lengkap", status: "pending" },
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
      }, 2000);

      const res = await runAgenticProcurement(promptText, {
        company_id: activeCompany?.id,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res && res.success) {
        setResult(res);
        setWorkflowSteps([
          {
            step: "intent_analysis",
            title: "1. Analisis Kebutuhan",
            status: "completed",
            summary: res.intent?.ai_summary,
          },
          {
            step: "catalogue_discovery",
            title: "2. Pencarian Katalog",
            status: "completed",
            summary: `Ditemukan ${res.catalogues?.length || 0} kandidat katalog`,
          },
          {
            step: "product_comparison",
            title: "3. Komparasi Opsi",
            status: "completed",
            summary: res.comparison?.executive_summary || "Evaluasi komparasi produk selesai",
          },
          {
            step: "pr_formulation",
            title: "4. Formulasi PR Lengkap",
            status: "completed",
            summary: res.pr_draft?.title,
          },
        ]);

        setChatMessages([
          {
            role: "assistant",
            content: `Halo! Saya telah selesai menganalisis kebutuhan dan merumuskan Purchase Requisition (PR) **"${
              res.pr_draft?.title || "PR Pengadaan"
            }"**.\n\nAnda dapat meninjau rincian item, perbandingan alternatif di tab **Matriks Komparasi**, atau meminta revisi langsung di sini.`,
          },
        ]);
        setActiveTab("pr");
      } else {
        throw new Error(res?.error || "Gagal memproses pengadaan.");
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
        title: "Gagal Memproses",
        text: err?.message || "Terjadi kesalahan saat memproses kebutuhan pengadaan dengan AI.",
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

  const handleCreatePrNow = async () => {
    if (!result?.pr_draft || !activeCompany?.id) return;

    const totalBudget = getPrTotalBudget(result.pr_draft, result.intent);

    const confirm = await Swal.fire({
      title: "Buat Purchase Requisition?",
      html: `
        <div class="text-left text-xs">
          <p class="font-semibold text-gray-800 dark:text-gray-200 mb-1">${result.pr_draft.title}</p>
          <p class="text-gray-600 dark:text-gray-400 mb-2">${result.pr_draft.suggested_items?.length || 0} item line akan dibuat dan diajukan ke Approval Manager.</p>
          <div class="bg-orange-50 dark:bg-orange-950/40 p-2 rounded border border-orange-200 dark:border-orange-800 font-mono text-orange-800 dark:text-orange-300">
            Total Anggaran: <b>Rp ${totalBudget.toLocaleString("id-ID")}</b>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Buat PR",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsCreatingPr(true);
    try {
      const res = await createAgenticPr(activeCompany.id, result.pr_draft);
      if (res && res.success && res.rfq?.id) {
        await Swal.fire({
          icon: "success",
          title: "PR Berhasil Dibuat!",
          text: `PR '${result.pr_draft.title}' telah tercatat dengan ID ${res.rfq.id}.`,
          confirmButtonColor: "#f97316",
          confirmButtonText: "Lihat PR",
        });

        const prefix = getCompanyPrefix();
        navigate(`${prefix}/my-pr/${res.rfq.id}`);
      } else {
        throw new Error(res?.error || "Gagal membuat PR.");
      }
    } catch (err: any) {
      console.error("Create PR error:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Membuat PR",
        text: err?.message || "Terjadi kendala saat menyimpan PR.",
      });
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleExportToCart = () => {
    if (!result?.pr_draft?.suggested_items) return;

    const items = result.pr_draft.suggested_items.map((item: any) => ({
      id: item.catalogue_id || item.id || `ai-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || "Item Pengadaan",
      item_code: item.item_code || "PR-ITEM",
      category: item.category || "General",
      brand: item.brand || "",
      uom: item.uom || "unit",
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

  return (
    <Layout
      title="Agentic AI Procurement"
      subtitle="Autonomous Procurement Agent untuk pencarian katalog, komparasi produk, dan penyusunan PR otomatis."
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
          />
        )}

        {/* Results Section */}
        {result && (
          <div className="flex flex-col gap-3">
            {/* Navigation Tabs & Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[var(--ui-border)] pb-2.5">
              {/* Tab pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <button
                  onClick={() => setActiveTab("pr")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                    activeTab === "pr"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <FileText size={13} />
                  <span>Draft PR</span>
                  <span className="text-[10px] px-1 rounded bg-white/20">
                    {result.pr_draft?.suggested_items?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("comparison")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                    activeTab === "comparison"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <Layers size={13} />
                  <span>Komparasi</span>
                  {result.comparison?.comparison_matrix?.length ? (
                    <span className="text-[10px] px-1 rounded bg-white/20">
                      {result.comparison.comparison_matrix.length}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setActiveTab("catalogues")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                    activeTab === "catalogues"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <Package size={13} />
                  <span>Katalog ({result.catalogues?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                    activeTab === "chat"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <Bot size={13} />
                  <span>Asisten AI</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportToCart}
                  className="flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg bg-[var(--ui-bg-card)] hover:bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ShoppingBag size={13} />
                  <span>Checkout</span>
                </button>

                <button
                  onClick={handleCreatePrNow}
                  disabled={isCreatingPr}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPr ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Buat PR (1-Click)</span>
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
                onCreatePr={handleCreatePrNow}
                formatRupiah={formatRupiah}
                getTotalBudget={getPrTotalBudget}
              />
            )}

            {/* TAB 2: COMPARISON MATRIX */}
            {activeTab === "comparison" && (
              <AgenticComparisonTab
                comparison={result.comparison}
                formatRupiah={formatRupiah}
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
