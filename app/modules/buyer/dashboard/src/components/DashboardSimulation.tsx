import React, { useState } from "react";
import Layout from "../Layout";
import { CheckCircle, FileText, Clock, TrendingUp, ArrowRight, Play, RefreshCw, Database, ShieldAlert } from "lucide-react";

const INITIAL_CATALOGUE = [
  { id: "1", item_code: "CAT-001", name: "Premium Laptop Pro", category: "Hardware", uom: "unit", price: 15000000 },
  { id: "2", item_code: "CAT-002", name: "Ergonomic Office Chair", category: "Furniture", uom: "pcs", price: 2500000 },
  { id: "3", item_code: "CAT-003", name: "4K IPS Design Monitor", category: "Hardware", uom: "unit", price: 6000000 },
];

export function DashboardSimulation({ user, activeCompany }: { user: any, activeCompany: any }) {
  const [activeStep, setActiveStep] = useState(1);
  const [rfqTitle, setRfqTitle] = useState("Enterprise Workplace Hardware Provisioning");
  const [rfqDesc, setRfqDesc] = useState("Acquisition of premium development laptops and monitors for new engineers.");
  const [rfqItems, setRfqItems] = useState([
    { catalogue_id: 1, qty: 5, expected_date: "2026-06-15" },
    { catalogue_id: 3, qty: 3, expected_date: "2026-06-15" }
  ]);
  const [proposals, setProposals] = useState([
    { id: 1, company: "IndoTech Solutions", price_offer: 87000000, delivery_days: 5, warranty_months: 24, score: 0.92, status: "submitted" },
    { id: 2, company: "Nusantara Digital", price_offer: 93000000, delivery_days: 3, warranty_months: 36, score: 0.95, status: "submitted" },
    { id: 3, company: "Global Globalindo", price_offer: 82000000, delivery_days: 10, warranty_months: 12, score: 0.74, status: "submitted" }
  ]);
  const [poStatus, setPoStatus] = useState("draft");
  const [deliveryStatus, setDeliveryStatus] = useState("idle");
  const [goodsReceipt, setGoodsReceipt] = useState<any>(null);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "System initialized. Database loaded successfully.", type: "info", time: "Just now" },
    { id: 2, text: "Verification module loaded for company registrations.", type: "success", time: "2 mins ago" }
  ]);

  const addNotification = (text: string, type: "success" | "info" | "warning") => {
    setNotifications(prev => [{ id: Date.now(), text, type, time: "Just now" }, ...prev]);
  };

  const advanceStep = () => {
    if (activeStep === 1) {
      addNotification(`RFQ "${rfqTitle}" has been created as DRAFT.`, "info");
      setActiveStep(2);
    } else if (activeStep === 2) {
      addNotification("RFQ approved by Purchasing Manager. Status: ACTIVE.", "success");
      setActiveStep(3);
    } else if (activeStep === 3) {
      addNotification("Three vendors successfully submitted competitive proposals.", "info");
      setActiveStep(4);
    } else if (activeStep === 4) {
      addNotification("SAW Scoring & Ranking calculations finished. Winner identified!", "success");
      setActiveStep(5);
    } else if (activeStep === 5) {
      addNotification("Purchase Order (PO-2026-0091) generated and released to Nusantara Digital.", "success");
      setPoStatus("pending_confirmation");
      setActiveStep(6);
    } else if (activeStep === 6) {
      addNotification("Vendor confirmed PO. Proforma Invoice generated. Status: PAID via Midtrans.", "success");
      setPoStatus("paid");
      setActiveStep(7);
    } else if (activeStep === 7) {
      addNotification("Vendor released Delivery Order DO-9811. Goods are now in transit.", "info");
      setDeliveryStatus("shipping");
      setActiveStep(8);
    } else if (activeStep === 8) {
      addNotification("Goods received. Handover document verified. final Invoice generated.", "success");
      setDeliveryStatus("received");
      setGoodsReceipt({
        id: "GR-00912",
        received_qty: 8,
        handover_document_path: "handover_docs/custom_signature.pdf",
        status: "completed"
      });
      setActiveStep(9);
    }
  };

  const resetWorkflow = () => {
    setActiveStep(1);
    setPoStatus("draft");
    setDeliveryStatus("idle");
    setGoodsReceipt(null);
    addNotification("Workflow simulator reset.", "warning");
  };

  const downloadCSV = (title: string, headers: string[], data: any[][]) => {
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSimulationState = () => {
    const headers = ["Simulation Step", "Active PO Status", "Delivery Status", "Goods Receipt ID", "Goods Receipt Status"];
    const rows = [[
      `Step ${activeStep} of 9`,
      poStatus,
      deliveryStatus,
      goodsReceipt?.id || "N/A",
      goodsReceipt?.status || "N/A"
    ]];
    downloadCSV("Simulation_Lifecycle_State", headers, rows);
  };

  const handleDownloadCatalogues = () => {
    const headers = ["Item Code", "Item Name", "Category", "UOM", "Unit Price (IDR)"];
    const rows = INITIAL_CATALOGUE.map(item => [item.item_code, item.name, item.category, item.uom, String(item.price)]);
    downloadCSV("Department_Reference_Catalogues", headers, rows);
  };

  return (
    <Layout title="B2B E-Procurement Dashboard" subtitle="Enterprise Sequential Procurement Lifecycle & Multi-agent Simulation.">
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ width: "100%", boxSizing: "border-box" }}>
        
        {/* Left column: Active Procurement & Step Simulator */}
        <section className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: 400 }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl -z-10" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-orange-400">Step {activeStep} of 9</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadSimulationState}
                    style={{
                      background: "rgba(249,115,22,0.1)",
                      border: "1px solid rgba(249,115,22,0.3)",
                      color: "#fb923c",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Download State Excel
                  </button>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {activeStep === 9 ? "Workflow Completed" : "Simulation In Progress"}
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Sequential Procurement Lifecycle</h2>
              <p className="text-gray-400 text-sm mb-6">
                Step through a full high-fidelity enterprise B2B procurement cycle. This follows the exact domain services and actions implemented on the backend.
              </p>

              {/* Progress Steps Visualizer */}
              <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(step => (
                  <div
                    key={step}
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      activeStep >= step ? "bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-gray-800"
                    }`}
                  />
                ))}
              </div>

              {/* Dynamic step detail card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
                {activeStep === 1 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><FileText size={18} className="text-orange-400" /> Step 1: Draft RFQ Creation</h3>
                    <p className="text-gray-300 text-sm mb-4">Buyer creates a Request for Quotation (RFQ) detailing catalog items, descriptions, and expected delivery dates.</p>
                    <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-lg text-xs">
                      <p><strong>Title:</strong> {rfqTitle}</p>
                      <p><strong>Description:</strong> {rfqDesc}</p>
                      <p><strong>Items:</strong> {rfqItems.length} categories requested</p>
                    </div>
                  </div>
                )}
                {activeStep === 2 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Clock size={18} className="text-yellow-400" /> Step 2: RFQ Manager Approval</h3>
                    <p className="text-gray-300 text-sm mb-4">The Purchasing Manager reviews the RFQ, verifies department budgets, and transitions its status to ACTIVE to allow bidding.</p>
                    <div className="flex items-center gap-3 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 p-3 rounded-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                      Pending review by Finance Manager (Budget Code: DEPT-DEV-2026)
                    </div>
                  </div>
                )}
                {activeStep === 3 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><FileText size={18} className="text-amber-400" /> Step 3: Vendor Proposal Submission</h3>
                    <p className="text-gray-300 text-sm mb-4">Registered vendors analyze requirements and submit binding price offers, delivery dates, and warranty guarantees.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {proposals.map(p => (
                        <div key={p.id} className="bg-black/30 p-3 rounded-lg text-xs border border-white/5">
                          <p className="font-semibold text-white mb-1">{p.company}</p>
                          <p className="text-gray-400">Offer: Rp {(p.price_offer / 1000000).toFixed(0)}M</p>
                          <p className="text-gray-400">Delivery: {p.delivery_days} days</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeStep === 4 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><TrendingUp size={18} className="text-green-400" /> Step 4: SAW Scoring & Analytical Decision</h3>
                    <p className="text-gray-300 text-sm mb-4">The system utilizes the Simple Additive Weighting (SAW) algorithm to score proposals dynamically based on criteria weights (Price: 50%, Timeline: 30%, Warranty: 20%).</p>
                    <div className="flex flex-col gap-2">
                      {proposals.sort((a,b) => b.score - a.score).map((p, idx) => (
                        <div key={p.id} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg text-xs">
                          <span className="font-medium text-white">{idx+1}. {p.company}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-orange-400 font-bold">Score: {p.score}</span>
                            {idx === 0 && <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 font-bold">WINNER</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeStep === 5 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-orange-400" /> Step 5: Awarding Vendor & PO Generation</h3>
                    <p className="text-gray-300 text-sm mb-4">The winning proposal is officially accepted, transitioning others to rejected. A formal Purchase Order (PO) is automatically drafted.</p>
                    <div className="bg-black/30 p-3 rounded-lg text-xs border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">Purchase Order: PO-2026-0091</p>
                        <p className="text-gray-400">Issued to: Nusantara Digital</p>
                      </div>
                      <span className="bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-500/30 font-bold uppercase tracking-wider text-[10px]">
                        Pending Manager Approval
                      </span>
                    </div>
                  </div>
                )}
                {activeStep === 6 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-green-400" /> Step 6: PO Confirmation & Proforma Invoice</h3>
                    <p className="text-gray-300 text-sm mb-4">Vendor confirms PO, releasing the Proforma Invoice. Buyer processes upfront payment seamlessly via integrated payment gateway.</p>
                    <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-3 rounded-lg text-xs flex justify-between items-center">
                      <p><strong>Invoice:</strong> INV-PF-9801 (Proforma) - PAID via Midtrans</p>
                      <span className="bg-green-500 text-black px-2 py-0.5 rounded font-bold uppercase text-[9px] border-none">PAID</span>
                    </div>
                  </div>
                )}
                {activeStep === 7 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><ArrowRight size={18} className="text-orange-400" /> Step 7: Delivery Order released</h3>
                    <p className="text-gray-300 text-sm mb-4">Vendor ships the items and releases the Delivery Order (DO) with a trackable shipment number.</p>
                    <div className="bg-black/20 p-3 rounded-lg text-xs border border-white/5">
                      <p><strong>DO Number:</strong> DO-9811</p>
                      <p><strong>Shipment Status:</strong> <span className="text-orange-400 font-bold">SHIPPED</span></p>
                    </div>
                  </div>
                )}
                {activeStep === 8 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-orange-400" /> Step 8: Confirm Delivery & Goods Receipt</h3>
                    <p className="text-gray-300 text-sm mb-4">Buyer checks physical delivery, signs the handover document, and submits the Goods Receipt. Final Invoice is triggered automatically.</p>
                    <div className="bg-black/20 p-3 rounded-lg text-xs border border-white/5 flex justify-between items-center">
                      <div>
                        <p><strong>Goods Receipt:</strong> GR-00912</p>
                        <p className="text-gray-400">Handover Document: custom_signature.pdf</p>
                      </div>
                      <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase text-[9px] border border-green-500/30">RECEIVED</span>
                    </div>
                  </div>
                )}
                {activeStep === 9 && (
                  <div className="text-center py-4">
                    <span className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold shadow-lg shadow-green-500/20">
                      ✓
                    </span>
                    <h3 className="text-lg font-bold text-white mb-1">Procurement Cycle Complete!</h3>
                    <p className="text-gray-400 text-xs">All actions resolved via enterprise service domains flawlessly.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Control Panel */}
            <div className="flex gap-4">
              {activeStep < 9 ? (
                <button
                  onClick={advanceStep}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <Play size={16} /> Advance to Next Action
                </button>
              ) : (
                <button
                  onClick={resetWorkflow}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Restart Simulation
                </button>
              )}
            </div>
          </div>

          {/* Historical catalog reference */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 m-0">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Department Reference Catalogues
              </h3>
              <button 
                onClick={handleDownloadCatalogues}
                style={{
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  color: "#fbbf24",
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Download Catalogues Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-2.5">Code</th>
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">UOM</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_CATALOGUE.map(item => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-orange-400">{item.item_code}</td>
                      <td className="py-3 text-white font-medium">{item.name}</td>
                      <td className="py-3 text-gray-400">{item.category}</td>
                      <td className="py-3 text-gray-400">{item.uom}</td>
                      <td className="py-3 text-right text-white">Rp {item.price.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right column: Notification Log & SAW weight configurations */}
        <section className="flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-400">
              <Database size={18} /> System Event Log
            </h3>
            <div className="flex flex-col gap-3">
              {notifications.map(n => (
                <div key={n.id} className="bg-black/20 p-3 rounded-lg border-l-2 border-orange-500 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-orange-400">{n.type}</span>
                    <span className="text-[10px] text-gray-500">{n.time}</span>
                  </div>
                  <p className="text-xs text-gray-300">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-400">
              <ShieldAlert size={18} /> Security & Audits
            </h3>
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Encryption Active</p>
                  <p className="text-[10px] text-gray-500">AES-256 for all PO documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">OTP Verification</p>
                  <p className="text-[10px] text-gray-500">MANDATORY for new vendors</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
