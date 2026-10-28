import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import Swal from "sweetalert2";

export function NegotiationModal({ proposal, onClose, onSuccess }: { proposal: any, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [paymentScheme, setPaymentScheme] = useState(proposal.payment_term || "");
  const [deliveryTerms, setDeliveryTerms] = useState(proposal.delivery_time || "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Force items to be an array and try different keys
    const rawItems = proposal.items || proposal.proposal_items || [];
    
    console.log("NegotiationModal - Proposal Items:", rawItems);

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const mappedItems = rawItems.map((it: any) => {
        const rfqItem = it.rfq_item || it.rfqItem;
        const catalogue = rfqItem?.catalogue || it.catalogue;
        return {
          proposal_item_id: it.id,
          inventory_name: catalogue?.name || rfqItem?.catalogue?.name || it.name || "Item",
          original_price: it.price_offer || 0,
          negotiated_price: it.price_offer || 0,
          negotiated_qty: rfqItem?.qty || it.qty || 1,
          uom: catalogue?.uom || rfqItem?.catalogue?.uom || it.uom || "Pc"
        };
      });
      setItems(mappedItems);
    } else if (proposal.price_offer) {
      // Fallback for legacy proposals or when items are not loaded
      setItems([{
        proposal_item_id: "legacy",
        inventory_name: proposal.rfq?.title || "Total Proposal Offer",
        original_price: proposal.price_offer,
        negotiated_price: proposal.price_offer,
        negotiated_qty: 1,
        uom: "Package"
      }]);
    }
  }, [proposal]);

  const handleItemPriceChange = (proposalItemId: string, newPrice: string) => {
    setItems(prev => prev.map(it => it.proposal_item_id === proposalItemId ? { ...it, negotiated_price: Number(newPrice) } : it));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { apiPost } = await import("../../../lib/api");
      await apiPost("/api/orders/negotiate", {
        proposal_id: proposal.id,
        items: items,
        payment_scheme: paymentScheme,
        delivery_terms: deliveryTerms,
        buyer_remarks: notes
      });
      Swal.fire({
        icon: 'success',
        title: 'Negotiation Sent!',
        text: 'Negotiation request sent to vendor!',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to send negotiation.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 32, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--ui-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--ui-text-primary)" }}>Negotiation Request</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 600 }}>Proposal by {proposal.company?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ui-text-muted)", cursor: "pointer" }}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 900, color: "#f97316", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "block" }}>Proposed Unit Prices</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ padding: 16, background: "var(--ui-bg-input)", borderRadius: 16, border: "1px solid var(--ui-border-input)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ui-text-primary)" }}>{it.inventory_name}</div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600 }}>Qty: {it.negotiated_qty} {it.uom} · Original: Rp {Number(it.original_price).toLocaleString()}</div>
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 800, color: "var(--ui-text-muted)" }}>Rp</span>
                      <input 
                        type="number"
                        value={it.negotiated_price}
                        onChange={(e) => handleItemPriceChange(it.proposal_item_id, e.target.value)}
                        style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px 8px 32px", fontSize: 14, fontWeight: 800, color: "#f97316", outline: "none" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 900, color: "#f97316", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "block" }}>Payment Scheme</label>
              <select 
                value={paymentScheme}
                onChange={e => setPaymentScheme(e.target.value)}
                style={{ width: "100%", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 12, padding: 12, fontSize: 14, color: "var(--ui-text-primary)", fontWeight: 700, appearance: "auto" }}
              >
                <option value="7 days">Net 7 Days</option>
                <option value="14 days">Net 14 Days</option>
                <option value="30 days">Net 30 Days</option>
                <option value="60 days">Net 60 Days</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 900, color: "#f97316", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "block" }}>Delivery Info</label>
              <select 
                value={deliveryTerms}
                onChange={e => setDeliveryTerms(e.target.value)}
                style={{ width: "100%", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 12, padding: 12, fontSize: 14, color: "var(--ui-text-primary)", fontWeight: 700, appearance: "auto" }}
              >
                <option value="3">3 Days (Express)</option>
                <option value="7">7 Days (Standard)</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 900, color: "#f97316", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "block" }}>Negotiation Notes</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tell vendor why you are negotiating..."
              style={{ width: "100%", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 12, padding: 16, fontSize: 14, color: "var(--ui-text-primary)", minHeight: 100, outline: "none", resize: "none" }}
            />
          </div>
        </div>

        <div style={{ padding: 32, borderTop: "1px solid var(--ui-border)", display: "flex", gap: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 16, borderRadius: 16, border: "1px solid var(--ui-border-input)", background: "none", fontSize: 14, fontWeight: 700, color: "var(--ui-text-secondary)", cursor: "pointer" }}>Cancel</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            style={{ flex: 2, padding: 16, borderRadius: 16, background: "var(--huntr-gradient)", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 20px rgba(249,115,22,0.2)", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? <Loader2 className="animate-spin" style={{ margin: "0 auto" }} /> : "Submit Negotiation"}
          </button>
        </div>
      </div>
    </div>
  );
}


