import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet } from "../lib/api";
import { Trophy, Globe, Search, Filter, Calendar, Building2, Package, ChevronRight, Loader2, Lightbulb, Info } from "lucide-react";
import { useNavigate } from "react-router";

export default function AllRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCompany, setActiveCompany] = useState<any>(null);

  useEffect(() => {
    fetchGlobalRequests();
    const companySession = localStorage.getItem("active_company");
    if (companySession) setActiveCompany(JSON.parse(companySession));
  }, []);

  const fetchGlobalRequests = async () => {
    try {
      // Fetch all requests that are 'active' (published global RFQs)
      const res = await apiGet(`/api/rfqs?status=active`);
      setRequests(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err) {
      console.error("Failed to fetch global RFQs", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="All Requests" subtitle="Browse active global RFQs and tenders published by organizations.">
      <div style={{ width: "100%" }}>
        
        {/* Info Banner: How to create request? */}
        {activeCompany?.type === 'buyer' && (
          <div className="huntr-action-card" style={{
            marginBottom: 20, borderRadius: 8,
            background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(251,146,60,0.1))",
            border: "1px solid rgba(249,115,22,0.2)",
            transition: "all 0.3s ease",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
              <Lightbulb size={20} color="#fb923c" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>How to create a request?</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.5, transition: "color 0.3s ease" }}>
                Go to the <strong>Marketplace</strong>, add items to your cart, and checkout to create a Purchase Request. 
                Once your manager approves it, your request will be published here as a Global RFQ for vendors to bid on.
              </p>
            </div>
            <button 
              onClick={() => navigate("/marketplace")}
              style={{
                padding: "8px 16px", borderRadius: 8, background: "#f59e0b", border: "none", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.3s ease"
              }}
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <div className="huntr-toolbar">
          <div className="huntr-toolbar-search">
            <Globe style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ui-text-muted)", transition: "color 0.3s ease" }} size={18} />
            <input 
              type="text" 
              placeholder="Search active tenders by title, item, or company..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px 10px 38px", borderRadius: 8,
                background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                color: "var(--ui-text-primary)", outline: "none", fontSize: 14, transition: "all 0.3s ease",
              }}
            />
          </div>
          <button style={{
            padding: "0 18px", borderRadius: 8, background: "var(--ui-bg-input)",
            border: "1px solid var(--ui-border-input)", color: "var(--ui-text-secondary)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, fontSize: 14, transition: "all 0.3s ease",
          }}>
            <Filter size={16} /> Filters
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 className="animate-spin" size={32} color="#f59e0b" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "var(--ui-text-muted)", transition: "color 0.3s ease" }}>
            <Search size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
            <h3 style={{ margin: 0, fontSize: 14, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>No active requests found</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ui-text-secondary)", transition: "color 0.3s ease" }}>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            {filteredRequests.map(req => {
              const companyInitial = req.company?.name ? req.company.name.charAt(0).toUpperCase() : "B";
              const formattedDate = new Date(req.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
              });
              
              return (
                <div key={req.id} style={{
                  background: "var(--ui-bg-card)", 
                  borderRadius: 8, 
                  border: "1px solid var(--ui-border)",
                  padding: 16, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 12, 
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}>
                  {/* Feed Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Avatar */}
                      <div style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: "50%", 
                        background: "linear-gradient(135deg, #f97316, #f59e0b)", 
                        color: "#fff", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontWeight: 700,
                        fontSize: 14,
                        boxShadow: "0 4px 10px rgba(249,115,22,0.2)"
                      }}>
                        {companyInitial}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 14 }}>
                          {req.company?.name || "Buyer Organization"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>
                          Published • {formattedDate}
                        </div>
                      </div>
                    </div>
                    {/* RFQ Code */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ 
                        padding: "2px 6px", 
                        borderRadius: 4, 
                        background: "rgba(34,197,94,0.12)", 
                        color: "#22c55e", 
                        fontSize: 10, 
                        fontWeight: 600, 
                        textTransform: "uppercase", 
                        letterSpacing: "0.05em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} /> Active RFQ
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>
                        #{String(req.id).substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Feed Content */}
                  <div style={{ borderTop: "1px solid var(--ui-border-subtle)", paddingTop: 16 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "var(--ui-text-primary)", lineHeight: 1.4 }}>
                      {req.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.6 }}>
                      Requesting bids for product catalog items in this RFQ. Review details below to place a proposal offer.
                    </p>
                  </div>

                  {/* Feed Stats / Meta */}
                  <div style={{ display: "flex", gap: 12, padding: "10px 14px", background: "var(--ui-bg-input)", borderRadius: 8 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <Package size={16} color="#f97316" />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Required Items</div>
                        <div style={{ fontSize: 13, color: "var(--ui-text-primary)", fontWeight: 700, marginTop: 1 }}>
                          {req.items?.length || 0} Categories
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={16} color="#f97316" />
                      <div>
                        <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Open Since</div>
                        <div style={{ fontSize: 13, color: "var(--ui-text-primary)", fontWeight: 700, marginTop: 1 }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feed Footer Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--ui-border-subtle)", paddingTop: 16 }}>
                    <button 
                      onClick={() => navigate(`/rfq/${req.id}`)}
                      style={{
                        padding: "8px 16px", 
                        borderRadius: 8, 
                        background: "linear-gradient(135deg,#f97316,#f59e0b)",
                        border: "none", 
                        color: "#fff", 
                        fontWeight: 700, 
                        fontSize: 13,
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        gap: 8, 
                        boxShadow: "0 6px 14px rgba(249,115,22,0.2)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      View Details & Bid <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
