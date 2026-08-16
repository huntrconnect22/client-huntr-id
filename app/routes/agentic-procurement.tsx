import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { runAgenticProcurement, chatAgenticProcurement, createAgenticPr } from "../lib/api/ai";
import {
  Sparkles,
  Bot,
  Search,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building,
  Calendar,
  Send,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Sliders,
  Check,
  Zap,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import Swal from "sweetalert2";

interface StepStatus {
  step: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  summary?: string;
  [key: string]: any;
}

const PRESET_PROMPTS = [
  {
    title: "10 Laptop Dev & 5 Monitor 4K",
    category: "IT Hardware",
    prompt:
      "Pengadaan 10 unit laptop Core i7 / Ryzen 7, RAM 32GB, 1TB SSD untuk tim engineer, dan 5 unit monitor 27 inch 4K. Tolong cari barang yang cocok di katalog, bandingkan spesifikasinya, dan susun draft PR lengkap beserta justifikasi teknis dan estimasi harga.",
  },
  {
    title: "25 Kursi Ergonomis & 15 Meja",
    category: "General Affairs",
    prompt:
      "Pengadaan 25 unit kursi kerja ergonomis lumbar support breathable mesh dan 15 unit meja kerja adjustable height untuk ekspansi lantai 3 kantor. Buatkan PR lengkap dengan estimasi budget dan spesifikasi daya tahan.",
  },
  {
    title: "50 Set APD Proyek Lapangan",
    category: "HSE & Safety",
    prompt:
      "Pengadaan APD proyek: 50 helm safety ANSI Z89.1, 50 pasang safety shoes steel toe cap SNI/EN ISO, dan 50 rompi reflektif high-visibility. Target pengiriman 14 hari.",
  },
  {
    title: "Server Rack 42U & UPS 3000VA",
    category: "Infrastructure",
    prompt:
      "Pengadaan 1 unit Server Rack 42U 19-inch dengan sistem pendingin fan kit, PDU 16 port, dan 2 unit Online UPS 3000VA untuk upgrade ruang server IT.",
  },
];

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

  // Real-time animated steps
  const [workflowSteps, setWorkflowSteps] = useState<StepStatus[]>([
    { step: "intent_analysis", title: "1. Analisis Kebutuhan", status: "pending" },
    { step: "catalogue_discovery", title: "2. Pencarian Katalog", status: "pending" },
    { step: "product_comparison", title: "3. Komparasi Opsi", status: "pending" },
    { step: "pr_formulation", title: "4. Formulasi PR Lengkap", status: "pending" },
  ]);

  // Chat refinement state
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string; timestamp?: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    const newMessages = [
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
        {/* Disclaimer Hint Banner (Beta) */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1 text-xs leading-relaxed">
            <span className="font-bold">Disclaimer Versi Beta:</span> Fitur Agentic AI Procurement saat ini masih dalam <b>Versi Beta</b>. Hasil pencarian katalog, komparasi spesifikasi teknis, serta estimasi harga dihasilkan secara otomatis oleh model AI dan <b>tidak dijamin 100% akurat</b>. Dokumen PR ini berfungsi sebagai draf referensi cerdas; mohon periksa dan sesuaikan kembali sebelum mengajukan ke proses persetujuan resmi (*approval*).
          </div>
        </div>

        {/* Sleek Input Card */}
        <div className="rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                  Huntr Procurement Agent
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Versi Beta
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    ChatGPT 4o
                  </span>
                </h2>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Deskripsikan barang atau jasa yang ingin diadakan, AI akan mencari katalog, membandingkan spesifikasi, dan membuat PR.
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Butuh 15 unit laptop Core i7 RAM 32GB untuk tim developer, 15 monitor 27 inch 4K, dan 15 mouse wireless. Cari produknya, bandingkan alternatifnya, dan langsung buatkan PR lengkap dengan estimasi harga."
              rows={2}
              disabled={isRunning}
              className="w-full p-3 pr-32 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-xs md:text-sm outline-none focus:border-orange-500/50 transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleExecuteWorkflow();
                }
              }}
            />
            <button
              onClick={() => handleExecuteWorkflow()}
              disabled={isRunning || !prompt.trim()}
              className="absolute right-2.5 bottom-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Zap size={13} />
                  <span>Jalankan AI</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Prompts (Compact chips) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-[var(--ui-text-muted)] flex items-center gap-1">
              <Sliders size={11} /> Preset:
            </span>
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item.prompt);
                  handleExecuteWorkflow(item.prompt);
                }}
                disabled={isRunning}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--ui-bg-input)] hover:bg-orange-500/10 border border-[var(--ui-border)] hover:border-orange-500/30 text-[var(--ui-text-secondary)] hover:text-orange-500 transition-all text-left flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Reasoning (Compact Grid) */}
        {(isRunning || result) && (
          <div className="p-3 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Bot size={13} className="text-orange-400" />
                Tahapan Autonomous AI Agent
              </span>
              {isRunning && (
                <span className="text-orange-400 font-medium flex items-center gap-1.5 animate-pulse text-[11px]">
                  <Loader2 size={11} className="animate-spin" /> Menganalisis...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {workflowSteps.map((step, i) => {
                const isDone = step.status === "completed";
                const isCurr = step.status === "running";
                const isFail = step.status === "failed";

                return (
                  <div
                    key={i}
                    className={`p-2.5 rounded-md border text-xs transition-all flex flex-col gap-1 ${
                      isDone
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                        : isCurr
                        ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                        : isFail
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-muted)] opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="truncate">{step.title}</span>
                      {isDone ? (
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      ) : isCurr ? (
                        <Loader2 size={13} className="animate-spin text-orange-400 flex-shrink-0" />
                      ) : isFail ? (
                        <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      )}
                    </div>
                    {step.summary && (
                      <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-1">
                        {step.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="flex flex-col gap-3">
            {/* Toolbar & Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--ui-border)] pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("pr")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "pr"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <FileText size={13} />
                  <span>Draft PR Resmi</span>
                  <span className="text-[10px] px-1 rounded bg-white/20">
                    {result.pr_draft?.suggested_items?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("comparison")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "comparison"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <Layers size={13} />
                  <span>Matriks Komparasi</span>
                  {result.comparison?.comparison_matrix?.length ? (
                    <span className="text-[10px] px-1 rounded bg-white/20">
                      {result.comparison.comparison_matrix.length}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setActiveTab("catalogues")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                  }`}
                >
                  <Bot size={13} />
                  <span>Asisten AI</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportToCart}
                  className="px-3 py-1.5 rounded-md bg-[var(--ui-bg-card)] hover:bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ShoppingBag size={13} />
                  <span>Checkout</span>
                </button>

                <button
                  onClick={handleCreatePrNow}
                  disabled={isCreatingPr}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPr ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Buat PR Resmi (1-Click)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: PR DRAFT PREVIEW */}
            {activeTab === "pr" && result.pr_draft && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: PR Document */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                  <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
                    <div className="border-b border-[var(--ui-border)] pb-3">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                        Purchase Requisition Draft
                      </span>
                      <h3 className="text-sm md:text-base font-bold text-[var(--ui-text-primary)] mt-0.5">
                        {result.pr_draft.title}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-[var(--ui-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Building size={11} /> {result.pr_draft.department || "General Procurement"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Tender: {result.pr_draft.duration_days || 7} Hari
                        </span>
                        <span>•</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                            result.pr_draft.priority === "Urgent"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {result.pr_draft.priority || "Normal"}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
                        Deskripsi Kebutuhan
                      </span>
                      <p className="text-xs text-[var(--ui-text-primary)] leading-relaxed bg-[var(--ui-bg-input)] p-3 rounded-md border border-[var(--ui-border)]">
                        {result.pr_draft.description}
                      </p>
                    </div>

                    {/* Justification */}
                    {result.pr_draft.business_justification && (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px] flex items-center gap-1">
                          <ShieldCheck size={12} className="text-orange-400" />
                          Justifikasi Bisnis
                        </span>
                        <div className="text-xs text-[var(--ui-text-primary)] bg-orange-500/5 p-3 rounded-md border border-orange-500/20">
                          {result.pr_draft.business_justification}
                        </div>
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="font-bold text-[var(--ui-text-secondary)] uppercase tracking-wider text-[11px]">
                        Line Items ({result.pr_draft.suggested_items?.length || 0})
                      </span>

                      <div className="overflow-x-auto rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[var(--ui-bg-input)] border-b border-[var(--ui-border)] text-[var(--ui-text-muted)] font-semibold">
                              <th className="px-3 py-2">Item & Spesifikasi</th>
                              <th className="px-3 py-2 text-center">Qty</th>
                              <th className="px-3 py-2 text-right">Harga Satuan</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--ui-border)]">
                            {result.pr_draft.suggested_items?.map((item: any, idx: number) => {
                              const subtotal = (item.qty || 1) * (item.estimated_price || 0);
                              return (
                                <tr key={idx} className="hover:bg-[var(--ui-bg-input)]/50 transition-colors">
                                  <td className="px-3 py-2.5">
                                    <div className="font-semibold text-[var(--ui-text-primary)]">
                                      {item.name}
                                    </div>
                                    <div className="text-[11px] text-[var(--ui-text-muted)]">
                                      {item.detailed_specs || item.reason || "-"}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-medium text-[var(--ui-text-primary)]">
                                    {item.qty} {item.uom || "unit"}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono text-[var(--ui-text-secondary)]">
                                    {formatRupiah(item.estimated_price)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-mono font-bold text-orange-400">
                                    {formatRupiah(subtotal)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-[var(--ui-bg-input)] font-bold text-[var(--ui-text-primary)]">
                              <td colSpan={3} className="px-3 py-2 text-right">
                                Total Anggaran (IDR):
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs text-orange-400">
                                {formatRupiah(getPrTotalBudget(result.pr_draft, result.intent))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Summary Panel */}
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3">
                    <span className="text-xs font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={13} className="text-emerald-400" />
                      Ringkasan Finansial
                    </span>

                    <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-semibold">Total Estimasi Anggaran</span>
                      <span className="text-lg font-black font-mono text-emerald-400">
                        {formatRupiah(getPrTotalBudget(result.pr_draft, result.intent))}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs divide-y divide-[var(--ui-border)]">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[var(--ui-text-muted)]">Perusahaan</span>
                        <span className="font-semibold text-[var(--ui-text-primary)]">
                          {activeCompany?.name || "Buyer"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[var(--ui-text-muted)]">Departemen</span>
                        <span className="font-semibold text-[var(--ui-text-primary)]">
                          {result.pr_draft.department || "Procurement"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[var(--ui-text-muted)]">Pengiriman</span>
                        <span className="font-semibold text-[var(--ui-text-primary)] truncate max-w-[150px]">
                          {result.pr_draft.delivery_point_recommendation || "Kantor Pusat"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCreatePrNow}
                      disabled={isCreatingPr}
                      className="w-full mt-1 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingPr ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Buat PR Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPARISON MATRIX */}
            {activeTab === "comparison" && (
              <div className="flex flex-col gap-3">
                {result.comparison?.executive_summary && (
                  <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-orange-500/30 flex flex-col gap-1.5 text-xs">
                    <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Sparkles size={12} /> Ringkasan Analisis Komparasi
                    </span>
                    <p className="text-[var(--ui-text-primary)] leading-relaxed">
                      {result.comparison.executive_summary}
                    </p>
                    {result.comparison.winner_reason && (
                      <div className="mt-1 text-[11px] p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                        <span>
                          <b>Rekomendasi Utama:</b> {result.comparison.winner_reason}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {result.comparison?.comparison_matrix?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.comparison.comparison_matrix.map((item: any, idx: number) => {
                      const isWinner =
                        item.catalogue_id === result.comparison.winner_id || item.score >= 88;
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-lg bg-[var(--ui-bg-card)] border flex flex-col justify-between gap-2.5 shadow-sm relative ${
                            isWinner
                              ? "border-emerald-500 ring-1 ring-emerald-500/20"
                              : "border-[var(--ui-border)]"
                          }`}
                        >
                          {isWinner && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                              <Sparkles size={9} /> Top Choice
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-[var(--ui-text-primary)]">
                                  {item.product_name}
                                </h4>
                                {item.vendor_name && (
                                  <span className="text-[10px] text-[var(--ui-text-muted)]">
                                    {item.vendor_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded">
                                {item.score || 85}/100
                              </span>
                            </div>

                            {item.key_specs && (
                              <div className="p-2 rounded bg-[var(--ui-bg-input)] text-[11px] text-[var(--ui-text-secondary)] border border-[var(--ui-border)]">
                                {item.key_specs}
                              </div>
                            )}

                            {item.pros?.length > 0 && (
                              <div className="text-[11px]">
                                <span className="font-semibold text-emerald-400 block mb-0.5 text-[10px]">
                                  Kelebihan:
                                </span>
                                <ul className="space-y-0.5">
                                  {item.pros.map((pro: string, pIdx: number) => (
                                    <li key={pIdx} className="flex items-start gap-1 text-[var(--ui-text-secondary)]">
                                      <Check size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                      <span>{pro}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.cons?.length > 0 && (
                              <div className="text-[11px]">
                                <span className="font-semibold text-amber-400 block mb-0.5 text-[10px]">
                                  Catatan:
                                </span>
                                <ul className="space-y-0.5">
                                  {item.cons.map((con: string, cIdx: number) => (
                                    <li key={cIdx} className="flex items-start gap-1 text-[var(--ui-text-muted)]">
                                      <span className="text-amber-400">•</span>
                                      <span>{con}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
                            <span className="text-[var(--ui-text-muted)] text-[11px]">Estimasi:</span>
                            <span className="font-bold font-mono text-[var(--ui-text-primary)]">
                              {formatRupiah(item.estimated_price_idr || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
                    Perbandingan otomatis aktif ketika ada 2 atau lebih opsi barang.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CATALOGUES */}
            {activeTab === "catalogues" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {result.catalogues?.length > 0 ? (
                  result.catalogues.map((cat: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] hover:border-orange-500/30 transition-all flex flex-col justify-between gap-2 shadow-sm text-xs"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded">
                            Match {cat.ai_score || 85}%
                          </span>
                          <span className="text-[10px] text-[var(--ui-text-muted)]">
                            {cat.category || "General"}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[var(--ui-text-primary)] line-clamp-2">
                          {cat.name}
                        </h4>
                        <p className="text-[11px] text-[var(--ui-text-muted)] line-clamp-2">
                          {cat.specifications || "Spesifikasi vendor"}
                        </p>
                        {cat.vendor && (
                          <span className="text-[10px] text-[var(--ui-text-secondary)]">
                            🏢 {cat.vendor}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--ui-text-muted)]">{cat.item_code}</span>
                        <span className="font-semibold text-orange-400">{cat.uom || "unit"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
                    Item spesifikasi standar industri digenerasikan untuk ditenderkan ke vendor.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CHAT REFINEMENT */}
            {activeTab === "chat" && (
              <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3 h-[460px]">
                <div className="border-b border-[var(--ui-border)] pb-2 flex items-center gap-2">
                  <Bot size={15} className="text-orange-400" />
                  <span className="font-bold text-xs text-[var(--ui-text-primary)]">
                    Chat & Refinement PR
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs">
                  {chatMessages.map((msg, idx) => {
                    const isAi = msg.role === "assistant";
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2 leading-relaxed ${isAi ? "justify-start" : "justify-end"}`}
                      >
                        {isAi && (
                          <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                            <Bot size={13} />
                          </div>
                        )}
                        <div
                          className={`p-2.5 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                            isAi
                              ? "bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)]"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  {isChatSending && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-400">
                      <Loader2 size={13} className="animate-spin" />
                      <span>AI sedang memproses...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex items-center gap-2 border-t border-[var(--ui-border)] pt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendChatMessage();
                    }}
                    placeholder="Tanyakan atau minta revisi (misal: kurangi laptop jadi 8 unit)..."
                    disabled={isChatSending}
                    className="flex-1 px-3 py-2 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 transition-all"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatSending || !chatInput.trim()}
                    className="px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Send size={13} />
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
