import React, { useEffect, useState } from "react";
import { Search, Loader2, X, Users, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { adminGetUsers, adminDeleteUser } from "../../lib/api";
import { thStyle, tdStyle, buildPageList } from "./shared";

export default function AdminUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchUsers = async (
    page = currentPage,
    s = search,
    pp = perPage
  ) => {
    setIsLoading(true);
    try {
      const res = await adminGetUsers({ page, per_page: pp, search: s });
      setUsers(res.users?.data || []);
      setCurrentPage(res.users?.current_page || 1);
      setTotalPages(res.users?.last_page || 1);
      setTotal(res.total ?? res.users?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, search, perPage), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers(1, search, perPage);
  }, [perPage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "var(--ui-glass-shadow)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              flexShrink: 0,
              background: "linear-gradient(135deg,var(--ui-accent-indigo),#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px var(--ui-accent-indigo-muted)",
            }}
          >
            <Users size={20} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "var(--ui-text-primary)",
              }}
            >
              {total.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
              Total Users
            </div>
          </div>
        </div>
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
            placeholder="Cari nama, email, WhatsApp, atau perusahaan…"
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
                display: "flex",
                padding: 0,
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
          {[10, 20, 50].map((n) => (
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
              style={{
                margin: "0 auto",
                color: "var(--ui-accent-indigo)",
              }}
              size={28}
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>NAMA</th>
                  <th style={thStyle}>EMAIL</th>
                  <th style={thStyle}>WHATSAPP</th>
                  <th style={thStyle}>PERUSAHAAN</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>BERGABUNG</th>
                  <th
                    style={{
                      ...thStyle,
                      textAlign: "center",
                      width: 80,
                    }}
                  >
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        padding: 48,
                        color: "var(--ui-text-muted)",
                      }}
                    >
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ transition: "background 0.1s" }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background:
                                "linear-gradient(135deg,var(--ui-accent-indigo),#8b5cf6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#fff",
                            }}
                          >
                            {user.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          {user.name || "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--ui-text-muted)",
                        }}
                      >
                        {user.email || "—"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--ui-text-muted)",
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      >
                        {user.whatsapp || "—"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--ui-text-muted)",
                          fontSize: 12,
                        }}
                      >
                        {user.company?.name ? (
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
                            {user.company.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>
                        {user.roles?.[0]?.slug ? (
                          <span
                            style={{
                              background: "var(--ui-accent-indigo-muted)",
                              color: "var(--ui-accent-indigo-text)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "capitalize",
                            }}
                          >
                            {user.roles[0].slug}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--ui-text-muted)",
                              fontSize: 12,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--ui-text-muted)",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>
                      <td
                        style={{ ...tdStyle, textAlign: "center" }}
                      >
                        {!user.company && !user.company_id ? (
                          <button
                            onClick={async () => {
                              const result = await Swal.fire({
                                icon: "warning",
                                title: "Hapus User?",
                                text: `Hapus akun "${
                                  user.name || user.email
                                }"? Tindakan ini tidak bisa dibatalkan.`,
                                showCancelButton: true,
                                confirmButtonText: "Hapus",
                                cancelButtonText: "Batal",
                                confirmButtonColor: "#ef4444",
                              });
                              if (!result.isConfirmed) return;
                              try {
                                await adminDeleteUser(user.id);
                                fetchUsers();
                              } catch (err: any) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Gagal",
                                  text:
                                    err?.message || "Gagal menghapus user",
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
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Trash2 size={11} /> Hapus
                          </button>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--ui-text-muted)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
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
            {total.toLocaleString()} user
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => fetchUsers(Math.max(1, currentPage - 1))}
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
                    : "var(--ui-accent-indigo-muted)",
                color:
                  currentPage === 1
                    ? "var(--ui-text-muted)"
                    : "var(--ui-accent-indigo-text)",
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
                  onClick={() => fetchUsers(p as number)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      currentPage === p
                        ? "var(--ui-accent-indigo)"
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
                fetchUsers(Math.min(totalPages, currentPage + 1))
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
                    : "var(--ui-accent-indigo-muted)",
                color:
                  currentPage === totalPages
                    ? "var(--ui-text-muted)"
                    : "var(--ui-accent-indigo-text)",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
