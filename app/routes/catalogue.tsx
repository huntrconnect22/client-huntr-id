import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { importCatalogue, getCatalogues, createCatalogue, updateCatalogue, getCsrfCookie } from "../lib/api";
import { 
  Plus, Check, Loader2, Package, Search, UploadCloud, FileText, 
  ChevronRight, X, LayoutGrid, List
} from "lucide-react";
import { getAssetUrl } from "../lib/assets";

const PRODUCT_CATEGORIES = [
  "Hardware",
  "Software",
  "Furniture",
  "Office Supplies",
  "Services",
  "Spareparts",
  "Electronics",
  "Mechanical",
  "Chemicals",
  "Construction",
  "Stationery",
  "Pantry & F&B",
  "Logistics",
  "Marketing",
  "Other"
];

import { useSearchParams } from "react-router";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [company, setCompany] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Catalogue list state
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Manual Entry Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    category: "",
    brand: "",
    specifications: "",
    keywords: "",
    uom: "Pc",
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      const ac = JSON.parse(activeComp);
      setCompany(ac);
    }
    
    // Initialize CSRF cookie
    getCsrfCookie().catch(err => {
      console.warn("Failed to initialize CSRF cookie:", err);
    });
  }, []);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Sync debounced localSearch to URL searchParams
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchParams(prev => {
          if (localSearch) prev.set("search", localSearch);
          else prev.delete("search");
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm]);

  // Main data fetching effect reacting to URL changes (page, search, company)
  useEffect(() => {
    if (company?.id) {
      fetchItems(company.id, currentPage, searchTerm);
    }
  }, [company, currentPage, searchTerm]);

  const fetchItems = async (cid: number, page = currentPage, query = searchTerm) => {
    setItemsLoading(true);
    try {
      const res = await getCatalogues({ company_id: cid, page, search: query });
      if (res && res.data && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.last_page || 1);
      } else {
        const d = res?.data || res || [];
        setItems(Array.isArray(d) ? d : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams(prev => {
      prev.set("page", String(newPage));
      return prev;
    });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", company.id.toString());
      fd.append("item_code", formData.item_code);
      fd.append("name", formData.name);
      fd.append("category", formData.category);
      fd.append("brand", formData.brand);
      fd.append("specifications", formData.specifications);
      fd.append("keywords", formData.keywords);
      fd.append("uom", formData.uom);
      fd.append("price", "0");
      if (productImage) {
        fd.append("image", productImage);
      }

      if (editingItem) {
        await updateCatalogue(editingItem.id, fd);
      } else {
        await createCatalogue(fd);
      }
      setShowForm(false);
      setFormData({ item_code: "", name: "", category: "", brand: "", specifications: "", keywords: "", uom: "Pc" });
      setProductImage(null);
      setEditingItem(null);
      fetchItems(company.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !company) { setError("Please select a file"); return; }
    
    setLoading(true); 
    setError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", company.id.toString());
      fd.append("csv", file);
      const data = await importCatalogue(fd);
      setResult(data);
      setFile(null);
      // Wait a bit then refresh to let queue process (though simple import is usually fast)
      setTimeout(() => fetchItems(company.id), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    !searchTerm ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Company Catalogue" subtitle="Manage your products, add new items manually, or import from Excel/CSV.">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Action Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  item_code: "HTR-" + Math.floor(100000 + Math.random() * 900000),
                  name: "",
                  category: PRODUCT_CATEGORIES[0],
                  brand: "",
                  specifications: "",
                  keywords: "",
                  uom: "Pc",
                });
                setProductImage(null);
                setShowForm(true);
              }}
              style={{
                padding: "9px 18px", borderRadius: 8, border: "none",
                backgroundColor: "var(--huntr-orange)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
            >
              <Plus size={16} /> Add New Item
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 560 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} color="var(--ui-text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search your catalogue..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                style={{
                  width: "100%", padding: "9px 14px 9px 36px", borderRadius: 8,
                  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                  color: "var(--ui-text-primary)", outline: "none", fontSize: 13, boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ display: "flex", background: "var(--ui-bg-input)", padding: 3, borderRadius: 8, border: "1px solid var(--ui-border-input)" }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: viewMode === "grid" ? "var(--ui-bg-card)" : "transparent", cursor: "pointer" }}>
                <LayoutGrid size={16} color={viewMode === "grid" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
              </button>
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: viewMode === "list" ? "var(--ui-bg-card)" : "transparent", cursor: "pointer" }}>
                <List size={16} color={viewMode === "list" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Add / Edit Form Modal ── */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <div style={{
              width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
              padding: "0",
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-bg-card)",
              boxShadow: "0 20px 60px -12px rgba(0,0,0,0.35)",
              position: "relative",
            }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--ui-border)" }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                  {editingItem ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--ui-border)", background: "transparent", color: "var(--ui-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-input)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-muted)"; }}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} style={{ padding: "18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <Field label="Item Code" value={formData.item_code} onChange={(v: any) => setFormData({ ...formData, item_code: v })} placeholder="e.g. HTR-123456" required />
                <Field label="Product Name" value={formData.name} onChange={(v: any) => setFormData({ ...formData, name: v })} placeholder="e.g. Hydraulic Pump" required />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle} required>
                    {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <Field label="Brand (Optional)" value={formData.brand} onChange={(v: any) => setFormData({ ...formData, brand: v })} placeholder="e.g. Bosch, Siemens" />
                <Field label="Keywords / Tags" value={formData.keywords} onChange={(v: any) => setFormData({ ...formData, keywords: v })} placeholder="e.g. pump, hydraulic" />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>UOM</label>
                  <select value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })} style={inputStyle} required>
                    {["Pc", "Box", "Pack", "Kg", "Litre", "Meter", "Unit", "Set", "Roll"].map(uom => <option key={uom} value={uom}>{uom}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Product Image</label>
                  <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files?.[0] || null)} style={{ ...inputStyle, marginTop: 6, padding: "8px 12px" }} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>Specifications</label>
                  <textarea
                    value={formData.specifications}
                    onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Detailed description..."
                    style={{ ...inputStyle, height: 80, marginTop: 6, resize: "none" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{
                    padding: "9px 18px", borderRadius: 8, border: "1px solid var(--ui-border)",
                    background: "var(--ui-bg-input)", color: "var(--ui-text-secondary)",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}>Cancel</button>
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Bulk Import Section ── */}
        {!showForm && (
          <div style={{ padding: "16px 18px", borderRadius: 8, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>Bulk Import</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ui-text-muted)" }}>Upload your catalogue via Excel or CSV file.</p>
              </div>
              <form onSubmit={handleImportSubmit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input type="file" accept=".csv,.xlsx,.xls" id="csv-upload" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <label htmlFor="csv-upload" style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                  borderRadius: 8, cursor: "pointer", fontSize: 12, color: file ? "var(--ui-text-primary)" : "var(--ui-text-muted)"
                }}>
                  <UploadCloud size={15} /> {file ? file.name : "Select file..."}
                </label>
                <button type="submit" disabled={loading || !file} style={{ ...primaryBtn, padding: "8px 16px", opacity: (!file || loading) ? 0.5 : 1, fontSize: 12 }}>
                  {loading ? "Processing..." : "Import"}
                </button>
              </form>
            </div>
            {result && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "var(--huntr-green)", fontSize: 12 }}>
                ✓ Catalogue update has been queued and will be visible shortly.
              </div>
            )}
          </div>
        )}

        {/* ── Item List ── */}
        <div style={{ minHeight: 400 }}>
          {itemsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 0" }}>
              <Loader2 className="animate-spin" color="var(--huntr-orange)" size={28} />
              <span style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>Fetching your products...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", background: "var(--ui-bg-input)", borderRadius: 8, border: "1px dashed var(--ui-border-input)" }}>
              <Package size={40} color="var(--ui-text-muted)" style={{ marginBottom: 12, opacity: 0.3 }} />
              <h3 style={{ color: "var(--ui-text-primary)", margin: 0, fontSize: 15, fontWeight: 700 }}>No products found</h3>
              <p style={{ color: "var(--ui-text-muted)", marginTop: 6, fontSize: 13 }}>{searchTerm ? "Try another search term" : "Start by adding your first product"}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredItems.map(item => (
                <div key={item.id} style={{
                  padding: "16px", display: "flex", flexDirection: "column", gap: 12,
                  background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
                  borderRadius: 8, transition: "border-color 0.15s ease",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--huntr-orange)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ui-border)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "var(--ui-text-brand)",
                      background: "var(--ui-bg-badge)", padding: "3px 8px",
                      borderRadius: 4, letterSpacing: "0.06em", fontFamily: "monospace",
                    }}>
                      {item.item_code}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)", margin: 0, lineHeight: 1.3 }}>{item.name}</h4>
                    <div style={{ fontSize: 11, color: "var(--ui-text-brand)", marginTop: 3, fontWeight: 600 }}>{item.category || "General"}</div>
                    <p style={{ fontSize: 12, color: "var(--ui-text-secondary)", margin: "8px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.specifications || "No detailed specifications provided."}
                    </p>
                    {(item.image_url || item.image_path) && (
                      <div style={{ marginTop: 10 }}>
                        <img src={getAssetUrl(item.image_url || item.image_path)} alt={item.name} style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 6 }} />
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>UOM: <strong style={{ color: "var(--ui-text-secondary)" }}>{item.uom}</strong></span>
                    <button type="button" onClick={() => {
                      setEditingItem(item); setShowForm(true); setProductImage(null);
                      setFormData({
                        item_code: item.item_code || "", name: item.name || "",
                        category: item.category || PRODUCT_CATEGORIES[0], brand: item.brand || "",
                        specifications: item.specifications || "",
                        keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : (item.keywords || ""),
                        uom: item.uom || "Pc",
                      });
                    }} style={{ background: "none", border: "none", color: "var(--ui-text-brand)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      Edit <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflow: "hidden", borderRadius: 8, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--ui-bg-input)", borderBottom: "1px solid var(--ui-border)" }}>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Item Info</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>UOM</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--ui-border-subtle)", transition: "background 0.1s ease" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--ui-bg-input)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "var(--ui-text-primary)", fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                        <div style={{ color: "var(--ui-text-muted)", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>{item.item_code}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: "var(--ui-text-brand)", fontSize: 12, fontWeight: 600 }}>{item.category || "General"}</span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--ui-text-secondary)", fontSize: 12 }}>{item.uom}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button type="button" onClick={() => {
                          setEditingItem(item); setShowForm(true); setProductImage(null);
                          setFormData({
                            item_code: item.item_code || "", name: item.name || "",
                            category: item.category || PRODUCT_CATEGORIES[0], brand: item.brand || "",
                            specifications: item.specifications || "",
                            keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : (item.keywords || ""),
                            uom: item.uom || "Pc",
                          });
                        }} style={{ background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", padding: "6px 14px", borderRadius: 6, color: "var(--ui-text-primary)", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "border-color 0.15s ease" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--huntr-orange)"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ui-border-input)"}
                        >Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 24, flexWrap: "wrap" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ui-border)",
                  background: "var(--ui-bg-card)", color: "var(--ui-text-primary)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1,
                  fontSize: 12, fontWeight: 600,
                }}
              >Previous</button>

              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("...");
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  
                  if (currentPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((page, index) => typeof page === "number" ? (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: currentPage === page ? "none" : "1px solid var(--ui-border)",
                      background: currentPage === page ? "var(--huntr-orange)" : "var(--ui-bg-card)",
                      color: currentPage === page ? "#fff" : "var(--ui-text-primary)",
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                    }}
                  >{page}</button>
                ) : (
                  <span key={`ellipsis-${index}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12, fontWeight: 600 }}>
                    ...
                  </span>
                ));
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ui-border)",
                  background: "var(--ui-bg-card)", color: "var(--ui-text-primary)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1,
                  fontSize: 12, fontWeight: 600,
                }}
              >Next</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const lbl: React.CSSProperties = {
  fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.08em",
};
const inputStyle: React.CSSProperties = {
  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
  borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--ui-text-primary)",
  outline: "none", width: "100%", boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
  border: "none", backgroundColor: "var(--huntr-orange)", color: "#fff",
  display: "flex", alignItems: "center", gap: 8,
};

function Field({ label, value, onChange, type = "text", placeholder, required }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={lbl}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} type={type}
        placeholder={placeholder} required={required} style={inputStyle} />
    </div>
  );
}
