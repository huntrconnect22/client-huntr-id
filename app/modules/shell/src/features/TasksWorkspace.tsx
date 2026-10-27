import React, { useEffect, useState } from "react";
import Layout from "~/components/Layout";
import { apiGet } from "~/lib/api";
import { 
  ClipboardList, CheckCircle2, Calendar,
  ArrowRight, Loader2, AlertCircle,
  ShieldCheck, Trophy,
  ReceiptText, FileText, PackageCheck
} from "lucide-react";
import { useNavigate } from "react-router";

interface TaskItem {
  id: string;
  type: "pr_approval" | "winner_selection" | "winner_approval" | "po_confirmation" | "arrange_delivery" | "bast_signing";
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  targetUrl: string;
  meta: any;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (userSession && companySession) {
      setActiveUser(JSON.parse(userSession));
      setActiveCompany(JSON.parse(companySession));
      fetchTasks(JSON.parse(userSession), JSON.parse(companySession));
    } else {
      setLoading(false);
      setError("User session or workspace not found.");
    }
  }, []);

  const fetchTasks = async (user: any, company: any) => {
    setLoading(true);
    setError(null);
    try {
      const taskList: TaskItem[] = [];

      if (company.type === "buyer") {
        const isManager = user.role === "manager" || company.owner_id === user.id;

        // 1. Fetch PRs awaiting manager approval
        if (isManager) {
          const pendingPrs = await apiGet(`/api/rfqs?status=pending_approval&company_id=${company.id}`);
          const prs = Array.isArray(pendingPrs) ? pendingPrs : [];
          prs.forEach((pr: any) => {
            taskList.push({
              id: `pr-approve-${pr.id}`,
              type: "pr_approval",
              title: "Approve Purchase Requisition",
              description: `Persetujuan PR internal "${pr.title}" untuk dipublikasikan sebagai tender global.`,
              dueDate: new Date(pr.created_at).toLocaleDateString(),
              priority: "high",
              targetUrl: `/my-pr/${pr.id}`,
              meta: { id: pr.id, creator: pr.user?.name || "Staff" }
            });
          });
        }

        // 2. Fetch Active RFQs where Winner selection is needed
        const activeRfqs = await apiGet(`/api/rfqs?company_id=${company.id}`);
        const rfqs = Array.isArray(activeRfqs) ? activeRfqs : [];
        const openRfqs = rfqs.filter((r: any) => r.status === "active");

        for (const rfq of openRfqs) {
          // Check if there are proposals submitted
          const proposalsRes = await apiGet(`/api/rfqs/${rfq.id}/rankings`);
          const proposals = proposalsRes.rankings || (Array.isArray(proposalsRes) ? proposalsRes : []);
          const hasAwarded = proposals.some((p: any) => p.proposal?.winner_status === "awarded" || p.proposal?.winner_status === "approved" || p.is_winner);
          
          if (proposals.length > 0 && !hasAwarded) {
            taskList.push({
              id: `winner-select-${rfq.id}`,
              type: "winner_selection",
              title: "Pilih Pemenang Tender (Award)",
              description: `Tender "${rfq.title}" memiliki ${proposals.length} proposal masuk yang siap dievaluasi & ditetapkan pemenangnya.`,
              dueDate: "Tender Berlangsung",
              priority: "medium",
              targetUrl: `/rfq/${rfq.id}`,
              meta: { id: rfq.id, count: proposals.length }
            });
          }
        }

        // 3. Fetch Awarded proposals awaiting manager approval
        if (isManager) {
          const awaitingWinnerRes = await apiGet(`/api/proposals/manager/awaiting-approval?company_id=${company.id}`);
          const awaitingWinners = awaitingWinnerRes.proposals || [];
          awaitingWinners.forEach((winner: any) => {
            taskList.push({
              id: `winner-approve-${winner.id}`,
              type: "winner_approval",
              title: "Setujui Pemenang Tender & Generate PO",
              description: `Pemenang tender untuk "${winner.rfq_title}" telah diajukan (${winner.company_name}). Harap berikan persetujuan akhir untuk menerbitkan PO.`,
              dueDate: new Date(winner.awarded_at).toLocaleDateString(),
              priority: "high",
              targetUrl: `/my-pr/${winner.rfq_id}`,
              meta: { id: winner.id, companyName: winner.company_name, price: winner.price_offer }
            });
          });
        }

        // 4. BAST Signing tasks for Buyer (received-by)
        // Use per_page=100 to ensure we don't miss tasks sitting beyond page 1
        const poRes = await apiGet(`/api/orders?company_id=${company.id}&per_page=100`);
        const pos = poRes.data || [];
        // Terminal statuses where no action is needed
        const doneStatuses = ["delivered", "completed", "done", "paid", "cancelled"];
        pos.forEach((po: any) => {
          if (doneStatuses.includes(po.status)) return; // skip finished POs
          (po.basts || []).forEach((bast: any) => {
            if (!bast.received_by_signed_at) {
              taskList.push({
                id: `bast-sign-${bast.id}`,
                type: "bast_signing",
                title: "Tanda Tangan BAST (Penerima)",
                description: `BAST No. ${bast.bast_number} untuk PO #${po.po_number} belum ditandatangani oleh pihak Buyer sebagai penerima barang.`,
                dueDate: new Date(bast.created_at).toLocaleDateString(),
                priority: "high",
                targetUrl: `/orders?search=${po.po_number}`,
                meta: { id: bast.id, poNumber: po.po_number }
              });
            }
          });
        });

      } else if (company.type === "vendor") {
        // Use per_page=100 to ensure we don't miss tasks sitting beyond page 1
        const poRes = await apiGet(`/api/orders?company_id=${company.id}&per_page=100`);
        const pos = poRes.data || [];
        const doneStatuses = ["delivered", "completed", "done", "paid", "cancelled"];

        // 1. PO Confirmation tasks for Vendor (needs to confirm PO)
        pos.forEach((po: any) => {
          if (po.status === "issued" || po.status === "published") {
            taskList.push({
              id: `po-confirm-${po.id}`,
              type: "po_confirmation",
              title: "Konfirmasi Purchase Order (PO)",
              description: `Purchase Order baru #${po.po_number} diterima dari buyer. Harap konfirmasi untuk menerbitkan proforma invoice.`,
              dueDate: new Date(po.created_at).toLocaleDateString(),
              priority: "high",
              targetUrl: `/orders?search=${po.po_number}`,
              meta: { id: po.id, poNumber: po.po_number }
            });
          }
        });

        // 2. Delivery Arrangement tasks for Vendor (needs to send/arrange delivery)
        pos.forEach((po: any) => {
          // Only show if PO is confirmed AND no delivery order has been created yet
          if (po.status === "confirmed" && (!po.delivery_orders || po.delivery_orders.length === 0)) {
            taskList.push({
              id: `arrange-delivery-${po.id}`,
              type: "arrange_delivery",
              title: "Atur Pengiriman & Input Resi",
              description: `PO #${po.po_number} sudah dikonfirmasi. Segera buat Surat Jalan (DO) dan input nomor resi pengiriman.`,
              dueDate: "Segera",
              priority: "medium",
              targetUrl: `/orders?search=${po.po_number}`,
              meta: { id: po.id, poNumber: po.po_number }
            });
          }
        });

        // 3. BAST Signing tasks for Vendor (handed-by) — skip finished POs
        pos.forEach((po: any) => {
          if (doneStatuses.includes(po.status)) return;
          (po.basts || []).forEach((bast: any) => {
            if (!bast.handed_by_signed_at) {
              taskList.push({
                id: `bast-sign-vendor-${bast.id}`,
                type: "bast_signing",
                title: "Tanda Tangan BAST (Penyerah)",
                description: `BAST No. ${bast.bast_number} untuk PO #${po.po_number} belum ditandatangani oleh pihak Vendor sebagai penyerah barang.`,
                dueDate: new Date(bast.created_at).toLocaleDateString(),
                priority: "high",
                targetUrl: `/orders?search=${po.po_number}`,
                meta: { id: bast.id, poNumber: po.po_number }
              });
            }
          });
        });
      }

      setTasks(taskList);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile task list.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "High" };
      case "medium":
        return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Medium" };
      default:
        return { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", label: "Low" };
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "pr_approval":
        return <ClipboardList size={22} color="#f59e0b" />;
      case "winner_selection":
        return <Trophy size={22} color="#fb923c" />;
      case "winner_approval":
        return <ShieldCheck size={22} color="#10b981" />;
      case "po_confirmation":
        return <ReceiptText size={22} color="#f97316" />;
      case "arrange_delivery":
        return <PackageCheck size={22} color="#3b82f6" />;
      default:
        return <CheckCircle2 size={22} color="#10b981" />;
    }
  };

  return (
    <Layout title="Daftar Tugas (Tasks)" subtitle="Daftar tindakan langsung yang memerlukan tinjauan atau keputusan Anda.">
      <div style={{ width: "100%", paddingBottom: 40 }}>
        
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
            <Loader2 className="animate-spin" size={32} color="var(--huntr-orange)" />
          </div>
        ) : error ? (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 20, color: "#f87171", fontSize: 13, display: "flex", gap: 10, alignItems: "center" }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", background: "var(--ui-bg-input)", borderRadius: 24, border: "1px dashed var(--ui-border)" }}>
            <CheckCircle2 size={48} style={{ opacity: 0.15, marginBottom: 16, color: "#22c55e" }} />
            <h3 style={{ color: "var(--ui-text-primary)", margin: 0, fontSize: 18, fontWeight: 800 }}>Semua Tugas Selesai!</h3>
            <p style={{ color: "var(--ui-text-secondary)", fontSize: 13, marginTop: 6, textAlign: "center" }}>Tidak ada pekerjaan tertunda yang membutuhkan tindakan Anda saat ini.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: "var(--ui-text-secondary)" }}>
                Ditemukan <strong style={{ color: "var(--ui-text-primary)" }}>{tasks.length} tugas</strong> penting
              </div>
              <button 
                onClick={() => fetchTasks(activeUser, activeCompany)}
                style={{ background: "none", border: "none", color: "var(--huntr-orange)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Refresh Tugas
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tasks.map(task => {
                const priority = getPriorityStyle(task.priority);
                return (
                  <div 
                    key={task.id}
                    onClick={() => navigate(task.targetUrl)}
                    style={{
                      background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
                      borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16,
                      cursor: "pointer", transition: "all 0.2s ease", position: "relative"
                    }}
                    className="huntr-task-item"
                  >
                    {/* Left Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {getTaskIcon(task.type)}
                    </div>

                    {/* Middle Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                          background: priority.bg, color: priority.color, textTransform: "uppercase"
                        }}>
                          {priority.label} Priority
                        </span>
                        <span style={{ fontSize: 11, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={12} /> Batas Waktu: {task.dueDate}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--ui-text-primary)" }}>{task.title}</h4>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.4 }}>
                        {task.description}
                      </p>
                    </div>

                    {/* Right Action */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--huntr-orange)", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      Kerjakan <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
