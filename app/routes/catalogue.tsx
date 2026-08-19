import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useSearchParams } from "react-router";
import Swal from "sweetalert2";
import { 
  importCatalogue, 
  getCatalogues, 
  createCatalogue, 
  updateCatalogue, 
  deleteCatalogue,
  getCsrfCookie 
} from "../lib/api";
import { Sparkles, Loader2, Package } from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  type CatalogueFormData,
  type CatalogueItem,
  fetchProductKnowledge,
  fetchProductImage,
  CatalogueHeader,
  CatalogueModalForm,
  CatalogueBulkImport,
  CatalogueGridView,
  CatalogueTableView,
  CataloguePagination,
} from "../features/catalogue";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [company, setCompany] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Catalogue list state
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Genkit AI States
  const [aiAutofilling, setAiAutofilling] = useState(false);
  const [aiBatchUpdating, setAiBatchUpdating] = useState(false);
  const [aiImageSearching, setAiImageSearching] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Selected Products State for Batch AI Update
  const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);

  // Manual Entry Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CatalogueFormData>({
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
    
    getCsrfCookie().catch((err) => {
      console.warn("Failed to initialize CSRF cookie:", err);
    });
  }, []);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchParams((prev) => {
          if (localSearch) prev.set("search", localSearch);
          else prev.delete("search");
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, setSearchParams]);

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
    setSearchParams((prev) => {
      prev.set("page", String(newPage));
      return prev;
    });
  };

  const toggleSelectItem = (id: string | number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.slice(0, 10).length && filteredItems.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.slice(0, 10).map((item) => item.id));
    }
  };

  // Genkit AI Single Product Auto-fill
  const handleAiAutofill = async () => {
    if (!formData.name.trim()) {
      setError("Isi nama produk terlebih dahulu agar Genkit AI dapat mencari referensi, spesifikasi & gambar secara akurat.");
      return;
    }
    setAiAutofilling(true);
    setError(null);
    try {
      setAiStatusMessage(`Genkit AI sedang mencari spesifikasi teknis & gambar produk untuk "${formData.name}"...`);
      const info = await fetchProductKnowledge(formData.name);

      setFormData((prev) => ({
        ...prev,
        category: info.category && PRODUCT_CATEGORIES.includes(info.category) ? info.category : prev.category,
        brand: info.brand,
        specifications: info.specifications,
        keywords: info.keywords,
        uom: info.uom,
      }));

      if (info.imageFile) {
        setProductImage(info.imageFile);
      }

      setAiStatusMessage("Formulir & Gambar produk berhasil dicari & diisi otomatis oleh Genkit AI!");
      setTimeout(() => setAiStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal mengisi data dengan Genkit AI.");
    } finally {
      setAiAutofilling(false);
    }
  };

  // Genkit AI Image Search Helper
  const handleAiImageSearch = async () => {
    if (!formData.name.trim()) return;
    setAiImageSearching(true);
    setAiStatusMessage(`Mencari gambar untuk "${formData.name}"...`);
    try {
      const fileRes = await fetchProductImage(formData.name, formData.category);
      if (fileRes) {
        setProductImage(fileRes);
        setAiStatusMessage("Gambar produk berhasil ditemukan & dipasang otomatis!");
      } else {
        setAiStatusMessage("Gambar tidak ditemukan, coba nama produk yang lebih spesifik.");
      }
      setTimeout(() => setAiStatusMessage(null), 3500);
    } catch {
      setAiStatusMessage("Gagal mencari gambar.");
      setTimeout(() => setAiStatusMessage(null), 3000);
    } finally {
      setAiImageSearching(false);
    }
  };

  // Genkit AI Batch Mass Update for SELECTED products (max 10)
  const handleBatchAiUpdate = async () => {
    if (!company?.id) return;
    if (selectedItemIds.length === 0) {
      setError("Pilih setidaknya 1 produk (maksimal 10) untuk diperbarui oleh Genkit AI.");
      return;
    }

    const selectedProducts = items.filter((item) => selectedItemIds.includes(item.id)).slice(0, 10);
    setAiBatchUpdating(true);
    setError(null);
    setAiStatusMessage(`Memproses pencarian referensi spesifikasi Genkit AI untuk ${selectedProducts.length} produk terpilih...`);

    try {
      for (const p of selectedProducts) {
        const info = await fetchProductKnowledge(p.name);

        const fd = new FormData();
        fd.append("company_id", company.id.toString());
        fd.append("item_code", p.item_code || `HTR-${p.id}`);
        fd.append("name", p.name);
        fd.append("category", info.category);
        fd.append("brand", info.brand);
        fd.append("specifications", info.specifications);
        fd.append("keywords", info.keywords);
        fd.append("uom", info.uom);
        fd.append("price", "0");

        if (info.imageFile) {
          fd.append("image", info.imageFile);
        }

        await updateCatalogue(p.id, fd);
      }

      setAiStatusMessage(`Sukses! ${selectedProducts.length} produk terpilih telah diperbarui massal dengan spesifikasi & merek akurat oleh Genkit AI.`);
      setSelectedItemIds([]);
      fetchItems(company.id);
      setTimeout(() => setAiStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan batch update Genkit AI.");
    } finally {
      setAiBatchUpdating(false);
    }
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
    if (!file || !company) {
      setError("Please select a file");
      return;
    }
    
    setLoading(true); 
    setError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", company.id.toString());
      fd.append("csv", file);
      const data = await importCatalogue(fd);
      setResult(data);
      setFile(null);
      setTimeout(() => fetchItems(company.id), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => 
    !searchTerm ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNewItem = () => {
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
  };

  const handleEditItem = (item: CatalogueItem) => {
    setEditingItem(item);
    setShowForm(true);
    setProductImage(null);
    setFormData({
      item_code: item.item_code || "",
      name: item.name || "",
      category: item.category || PRODUCT_CATEGORIES[0],
      brand: item.brand || "",
      specifications: item.specifications || "",
      keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : (item.keywords || ""),
      uom: item.uom || "Pc",
    });
  };

  const handleDeleteItem = async (item: CatalogueItem) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hapus Produk?",
      text: `Apakah Anda yakin ingin menghapus produk "${item.name}" dari katalog?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteCatalogue(item.id);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Produk berhasil dihapus dari katalog.",
        timer: 2000,
        showConfirmButton: false,
      });
      if (company?.id) {
        fetchItems(company.id, currentPage, searchTerm);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.message || "Gagal menghapus produk.",
      });
    }
  };

  return (
    <Layout title="Company Catalogue" subtitle="Manage your products, add new items manually, or import from Excel/CSV.">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Status AI global notification */}
        {aiStatusMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.25)",
              color: "var(--huntr-orange)",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={14} /> {aiStatusMessage}
          </div>
        )}

        {/* Action Header & Search Bar */}
        <CatalogueHeader
          onAddNew={handleAddNewItem}
          onBatchAiUpdate={handleBatchAiUpdate}
          selectedCount={selectedItemIds.length}
          aiBatchUpdating={aiBatchUpdating}
          localSearch={localSearch}
          setLocalSearch={setLocalSearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Add / Edit Form Modal */}
        <CatalogueModalForm
          show={showForm}
          onClose={() => setShowForm(false)}
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          productImage={productImage}
          setProductImage={setProductImage}
          loading={loading}
          aiAutofilling={aiAutofilling}
          aiImageSearching={aiImageSearching}
          onAiAutofill={handleAiAutofill}
          onAiImageSearch={handleAiImageSearch}
          onSubmit={handleManualSubmit}
        />

        {/* Bulk Import Card */}
        {!showForm && (
          <CatalogueBulkImport
            file={file}
            setFile={setFile}
            loading={loading}
            result={result}
            onSubmit={handleImportSubmit}
          />
        )}

        {/* Item List Display */}
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
            <CatalogueGridView
              items={filteredItems}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={toggleSelectItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          ) : (
            <CatalogueTableView
              items={filteredItems}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={toggleSelectItem}
              onToggleSelectAll={toggleSelectAll}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {/* Pagination */}
          <CataloguePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </Layout>
  );
}
