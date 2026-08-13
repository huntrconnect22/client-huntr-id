import React, { useEffect, useState } from "react";
import { Search, Loader2, X, Package, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  adminGetCatalogue,
  adminCreateCatalogueItem,
  adminUpdateCatalogueItem,
  adminDeleteCatalogueItem,
} from "../../lib/api";
import { lbl, inp, thStyle, tdStyle, buildPageList } from "./shared";

/* Bottom-sheet modal wrapper */
function SheetModal({
  onClose,
  title,
  children,
  maxWidth = 560,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--ui-bg-overlay)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--ui-bg-card)",
          padding: "20px 20px 28px",
          borderRadius: "16px 16px 0 0",
          width: "100%",
          maxWidth,
          maxHeight: "92dvh",
          overflowY: "auto",
          border: "1px solid var(--ui-border)",
          borderBottom: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ui-text-primary)",
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border-input)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--ui-text-muted)",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const CATEGORIES = [
  "Electronics", "Raw Materials", "Equipment", "Chemicals",
  "Machinery", "Tools", "Spare Parts", "Safety Equipment",
  "Office Supplies", "Other",
];
const UOMS = [
  "Pc", "Kg", "L", "M", "Box", "Pallet", "Set", "Unit", "Ton", "Pair",
  "Drum", "Container",
];

export default function AdminCatalogueTab() {
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchCatalogues = async (
    page = currentPage,
    s = search,
    pp = perPage
  ) => {
    setIsLoading(true);
    try {
      const res = await adminGetCatalogue({ page, per_page: pp, search: s });
      setCatalogues(res.data || []);
      setCurrentPage(res.current_page || 1);
      setTotalPages(res.last_page || 1);
      setTotal(res.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCatalogues(1, search, perPage), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCatalogues(1, search, perPage);
  }, [perPage]);

  const allPageSelected =
    catalogues.length > 0 &&
    catalogues.every((item) => selectedIds.includes(String(item.id)));

  const toggleSelectAll = () => {
    const allPageIds = catalogues.map((item) => String(item.id));
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allPageIds])]);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const image = fd.get("image");
    if (image instanceof File && image.size === 0) fd.delete("image");
    try {
      await adminCreateCatalogueItem(fd);
      setShowAddModal(false);
      fetchCatalogues();
    } catch {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to create product" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const image = fd.get("image");
    if (image instanceof File && image.size === 0) fd.delete("image");
    try {
      await adminUpdateCatalogueItem(editingItem.id, fd);
      setEditingItem(null);
      fetchCatalogues();
    } catch {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to update product" });
    }
  };

  /* Shared form fields */
  const renderFormFields = (item?: any) => (
    <>
      <div>
        <label style={lbl}>Product Name</label>
        <input name="name" required defaultValue={item?.name || ""} style={{ ...inp, marginTop: 6 }} />
      </div>
      {item && (
        <div>
          <label style={lbl}>Item Code</label>
          <input name="item_code" defaultValue={item?.item_code || ""} style={{ ...inp, marginTop: 6 }} />
        </div>
      )}
      <div>
        <label style={lbl}>Category {!item && "(Optional)"}</label>
        {item ? (
          <input name="category" defaultValue={item?.category || ""} style={{ ...inp, marginTop: 6 }} />
        ) : (
          <select name="category" style={{ ...inp, marginTop: 6, cursor: "pointer" }}>
            <option value="">Select Category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
      <div>
        <label style={lbl}>Brand {!item && "(Optional)"}</label>
        <input name="brand" placeholder="e.g. Bosch, Siemens" defaultValue={item?.brand || ""} style={{ ...inp, marginTop: 6 }} />
      </div>
      <div>
        <label style={lbl}>UOM</label>
        {item ? (
          <input name="uom" required defaultValue={item?.uom || "Pc"} style={{ ...inp, marginTop: 6 }} />
        ) : (
          <select name="uom" required style={{ ...inp, marginTop: 6, cursor: "pointer" }}>
            <option value="">Select UOM…</option>
            {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>
      <div>
        <label style={lbl}>Keywords / Tags {!item && "(Optional)"}</label>
        <textarea
          name="keywords"
          rows={3}
          placeholder="e.g. pump, hydraulic, industrial"
          defaultValue={
            item
              ? Array.isArray(item?.keywords)
                ? item.keywords.join(", ")
                : item?.keywords || ""
              : undefined
          }
          style={{ ...inp, marginTop: 6, resize: "vertical" }}
        />
      </div>
      <div>
        <label style={lbl}>Specifications {!item && "(Optional)"}</label>
        <textarea
          name="specifications"
          rows={3}
          defaultValue={item?.specifications || ""}
          style={{ ...inp, marginTop: 6, resize: "vertical" }}
        />
      </div>
      <div>
        <label style={lbl}>{item ? "Replace Image" : "Image (Optional)"}</label>
        <input name="image" type="file" accept="image/*" style={{ ...inp, marginTop: 6 }} />
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ui-text-primary)",
            }}
          >
            Global Catalogue
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ui-text-muted)",
              marginTop: 2,
            }}
          >
            {total.toLocaleString()} produk total
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            background: "var(--ui-primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 240,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--ui-bg-input)",
            border: "1px solid var(--ui-border-input)",
            borderRadius: 10,
            padding: "9px 14px",
          }}
        >
          <Search size={14} color="var(--ui-text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari katalog…"
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--ui-text-primary)",
              width: "100%",
              fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ui-text-muted)",
                padding: 0,
                display: "flex",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--ui-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Tampilkan
          </span>
          {[10, 20, 30, 50].map((n) => (
            <button
              key={n}
              onClick={() => setPerPage(n)}
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                background:
                  perPage === n ? "var(--ui-primary)" : "var(--ui-bg-card)",
                color: perPage === n ? "#fff" : "var(--ui-text-muted)",
                border:
                  perPage === n
                    ? "1px solid var(--ui-primary)"
                    : "1px solid var(--ui-border)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--ui-primary-muted)",
            border: "1px solid var(--ui-primary-border)",
            borderRadius: 10,
            padding: "10px 16px",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ui-text-primary)",
            }}
          >
            {selectedIds.length} produk terpilih
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                background: "transparent",
                border: "1px solid var(--ui-border)",
                color: "var(--ui-text-primary)",
                cursor: "pointer",
              }}
            >
              Batal
            </button>
            <button
              onClick={async () => {
                const result = await Swal.fire({
                  icon: "question",
                  title: "Hapus Produk Terpilih?",
                  text: `Yakin ingin menghapus ${selectedIds.length} produk?`,
                  showCancelButton: true,
                  confirmButtonText: "Ya, Hapus",
                  cancelButtonText: "Batal",
                });
                if (!result.isConfirmed) return;
                Swal.fire({
                  title: "Menghapus...",
                  allowOutsideClick: false,
                  didOpen: () => Swal.showLoading(),
                });
                try {
                  await Promise.all(
                    selectedIds.map((id) => adminDeleteCatalogueItem(id))
                  );
                  Swal.fire({
                    icon: "success",
                    title: "Berhasil!",
                    text: "Produk berhasil dihapus.",
                  });
                  fetchCatalogues();
                } catch {
                  Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: "Gagal menghapus beberapa produk.",
                  });
                }
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Trash2 size={12} /> Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Loader2
              className="animate-spin"
              style={{ margin: "0 auto", color: "var(--ui-primary)" }}
              size={28}
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      width: 40,
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", accentColor: "var(--ui-primary)" }}
                    />
                  </th>
                  <th style={{ ...thStyle, width: 52 }}>IMG</th>
                  <th style={thStyle}>NAMA PRODUK</th>
                  <th style={thStyle}>ITEM CODE</th>
                  <th style={thStyle}>KATEGORI</th>
                  <th style={thStyle}>VENDOR</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>HARGA</th>
                  <th style={thStyle}>UOM</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 110 }}>
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalogues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        padding: 48,
                        color: "var(--ui-text-muted)",
                      }}
                    >
                      Tidak ada produk ditemukan
                    </td>
                  </tr>
                ) : (
                  catalogues.map((item) => {
                    const isSelected = selectedIds.includes(String(item.id));
                    return (
                      <tr
                        key={item.id}
                        style={{
                          background: isSelected
                            ? "var(--ui-primary-muted)"
                            : "transparent",
                          transition: "background 0.1s",
                        }}
                      >
                        <td
                          style={{ ...tdStyle, textAlign: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(String(item.id))
                                  ? prev.filter(
                                      (id) => id !== String(item.id)
                                    )
                                  : [...prev, String(item.id)]
                              )
                            }
                            style={{
                              cursor: "pointer",
                              accentColor: "var(--ui-primary)",
                            }}
                          />
                        </td>
                        <td style={{ ...tdStyle, padding: "8px 10px" }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: item.image_url
                                ? `url(${item.image_url}) center/cover`
                                : "var(--ui-primary-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid var(--ui-border)",
                            }}
                          >
                            {!item.image_url && (
                              <Package
                                size={15}
                                color="var(--ui-primary)"
                                style={{ opacity: 0.6 }}
                              />
                            )}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 220 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 200,
                            }}
                          >
                            {item.name}
                          </div>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: "var(--ui-text-muted)",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        >
                          {item.item_code || "—"}
                        </td>
                        <td style={tdStyle}>
                          {item.category ? (
                            <span
                              style={{
                                background: "var(--ui-primary-muted)",
                                color: "var(--ui-primary)",
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {item.category}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: "var(--ui-text-muted)",
                            fontSize: 12,
                          }}
                        >
                          {item.company?.name || (
                            <span
                              style={{
                                color: "var(--ui-text-muted)",
                                fontStyle: "italic",
                              }}
                            >
                              Global
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--ui-primary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Rp {item.price?.toLocaleString() ?? "—"}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            fontSize: 12,
                            color: "var(--ui-text-muted)",
                          }}
                        >
                          {item.uom}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => setEditingItem(item)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                fontSize: 12,
                                fontWeight: 700,
                                background: "rgba(59,130,246,0.08)",
                                color: "#3b82f6",
                                border: "1px solid rgba(59,130,246,0.20)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                            <button
                              onClick={async () => {
                                const result = await Swal.fire({
                                  icon: "question",
                                  title: "Hapus Produk?",
                                  text: `Hapus "${item.name}"?`,
                                  showCancelButton: true,
                                  confirmButtonText: "Hapus",
                                  cancelButtonText: "Batal",
                                });
                                if (!result.isConfirmed) return;
                                try {
                                  await adminDeleteCatalogueItem(item.id);
                                  fetchCatalogues();
                                } catch {
                                  Swal.fire({
                                    icon: "error",
                                    title: "Error!",
                                    text: "Gagal menghapus produk",
                                  });
                                }
                              }}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                fontSize: 12,
                                fontWeight: 700,
                                background: "rgba(239,68,68,0.08)",
                                color: "#ef4444",
                                border: "1px solid rgba(239,68,68,0.20)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Trash2 size={11} /> Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            Halaman {currentPage} dari {totalPages} ·{" "}
            {total.toLocaleString()} produk
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() =>
                fetchCatalogues(Math.max(1, currentPage - 1))
              }
              disabled={currentPage === 1}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                background:
                  currentPage === 1
                    ? "var(--ui-bg-input)"
                    : "var(--ui-primary-muted)",
                color:
                  currentPage === 1
                    ? "var(--ui-text-muted)"
                    : "var(--ui-primary)",
              }}
            >
              ← Prev
            </button>
            {buildPageList(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span
                  key={`d-${i}`}
                  style={{
                    padding: "0 4px",
                    color: "var(--ui-text-muted)",
                    fontSize: 12,
                  }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => fetchCatalogues(p as number)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      currentPage === p
                        ? "var(--ui-primary)"
                        : "var(--ui-bg-card)",
                    color:
                      currentPage === p ? "#fff" : "var(--ui-text-muted)",
                    border:
                      currentPage === p
                        ? "none"
                        : "1px solid var(--ui-border)",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() =>
                fetchCatalogues(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor:
                  currentPage === totalPages ? "not-allowed" : "pointer",
                background:
                  currentPage === totalPages
                    ? "var(--ui-bg-input)"
                    : "var(--ui-primary-muted)",
                color:
                  currentPage === totalPages
                    ? "var(--ui-text-muted)"
                    : "var(--ui-primary)",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <SheetModal onClose={() => setShowAddModal(false)} title="Add Global Product">
          <form
            onSubmit={handleAddSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {renderFormFields()}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--ui-border)",
                  color: "var(--ui-text-muted)",
                  cursor: "pointer",
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 8,
                  background: "var(--ui-primary)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                Add Product
              </button>
            </div>
          </form>
        </SheetModal>
      )}

      {/* Edit modal */}
      {editingItem && (
        <SheetModal
          onClose={() => setEditingItem(null)}
          title="Edit Product"
        >
          <form
            onSubmit={handleEditSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {renderFormFields(editingItem)}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--ui-border)",
                  color: "var(--ui-text-muted)",
                  cursor: "pointer",
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 8,
                  background: "var(--ui-primary)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </SheetModal>
      )}
    </div>
  );
}
