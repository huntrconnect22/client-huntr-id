import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useEffect, useState, useCallback } from "react";
import { Search, Loader2, X, Users, Trash2, KeyRound, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import Swal from "sweetalert2";
import { adminGetUsers, adminDeleteUser, adminChangeUserPassword } from "../../lib/api";
import { thStyle, tdStyle, buildPageList } from "./shared";

/* ─── Password Strength Helper ──────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Sangat Lemah", color: "#ef4444" };
  if (score === 2) return { score, label: "Lemah", color: "#f97316" };
  if (score === 3) return { score, label: "Cukup", color: "#eab308" };
  if (score === 4) return { score, label: "Kuat", color: "#22c55e" };
  return { score, label: "Sangat Kuat", color: "#10b981" };
}

/* ─── Change Password Modal ──────────────────────────────────────────── */
interface ChangePasswordModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

function ChangePasswordModal({ user, onClose, onSuccess }: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getStrength(password);
  const match = confirm.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
    if (password !== confirm) { setError("Konfirmasi password tidak cocok."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await adminChangeUserPassword(user.id, {
        password,
        password_confirmation: confirm,
      });
      onClose();
      onSuccess();
      Swal.fire({
        icon: "success",
        title: "Password Berhasil Diubah",
        text: (res as any)?.message || `Password ${user.name} telah diubah. Semua sesi aktif dicabut.`,
        confirmButtonColor: "#f97316",
        timer: 4000,
        timerProgressBar: true,
      });
    } catch (err: any) {
      setError(err?.message || "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <style>{`
        @keyframes cpSlideUp { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
      <HuntrSurface style={{
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 20,
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        width: "100%", maxWidth: 440,
        animation: "cpSlideUp 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--ui-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#f97316,#f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
            }}>
              <KeyRound size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ui-text-primary)" }}>Ubah Password</div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 1 }}>
                {user.name} · {user.email || user.whatsapp || "—"}
              </div>
            </div>
          </div>
          <HuntrButton onClick={onClose} style={{
            background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ui-text-muted)",
          }}>
            <X size={14} />
          </HuntrButton>
        </div>

        {/* Warning */}
        <div style={{
          margin: "16px 24px 0", padding: "10px 14px", borderRadius: 10,
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <ShieldAlert size={15} color="#f97316" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#f97316", lineHeight: 1.5 }}>
            Setelah password diubah, <strong>semua sesi aktif</strong> user ini akan dicabut dan mereka harus login ulang.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* New Password */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Password Baru
            </label>
            <div style={{ position: "relative" }}>
              <HuntrInput
                id="admin-new-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                autoComplete="new-password"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "11px 44px 11px 14px", borderRadius: 10, fontSize: 14,
                  background: "var(--ui-bg-input)",
                  border: `1px solid ${password.length > 0 ? strength.color + "80" : "var(--ui-border-input)"}`,
                  color: "var(--ui-text-primary)", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit",
                }}
              />
              <HuntrButton type="button" onClick={() => setShowPw(p => !p)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex",
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </HuntrButton>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: i <= strength.score ? strength.color : "var(--ui-border)", transition: "background 0.2s",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: strength.color }}>{strength.label}</div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Konfirmasi Password
            </label>
            <div style={{ position: "relative" }}>
              <HuntrInput
                id="admin-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ulangi password baru"
                required
                autoComplete="new-password"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "11px 44px 11px 14px", borderRadius: 10, fontSize: 14,
                  background: "var(--ui-bg-input)",
                  border: `1px solid ${match ? "#22c55e80" : mismatch ? "#ef444480" : "var(--ui-border-input)"}`,
                  color: "var(--ui-text-primary)", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit",
                }}
              />
              <HuntrButton type="button" onClick={() => setShowConfirm(p => !p)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex",
              }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </HuntrButton>
            </div>
            {match && (
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={12} /> Password cocok
              </div>
            )}
            {mismatch && (
              <div style={{ marginTop: 5, fontSize: 11, fontWeight: 700, color: "#ef4444" }}>✕ Password tidak cocok</div>
            )}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <HuntrButton type="button" onClick={onClose} style={{
              flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
              color: "var(--ui-text-secondary)", cursor: "pointer",
            }}>
              Batal
            </HuntrButton>
            <HuntrButton type="submit" disabled={loading || !password || !confirm || mismatch} style={{
              flex: 2, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 800,
              background: (loading || !password || !confirm || mismatch) ? "var(--ui-bg-input)" : "linear-gradient(135deg,#f97316,#f59e0b)",
              border: "none",
              color: (loading || !password || !confirm || mismatch) ? "var(--ui-text-muted)" : "#fff",
              cursor: (loading || !password || !confirm || mismatch) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: (loading || !password || !confirm || mismatch) ? "none" : "0 4px 14px rgba(249,115,22,0.3)",
              transition: "all 0.2s",
            }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : <><KeyRound size={15} /> Ubah Password</>}
            </HuntrButton>
          </div>
        </form>
      </HuntrSurface>
    </div>
  );
}

/* ─── Main AdminUsersTab ─────────────────────────────────────────────── */
export default function AdminUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [changePwUser, setChangePwUser] = useState<any | null>(null);

  const fetchUsers = useCallback(async (page = currentPage, s = search, pp = perPage) => {
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
  }, [currentPage, search, perPage]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, search, perPage), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchUsers(1, search, perPage); }, [perPage]);

  return (
    <>
      {changePwUser && (
        <ChangePasswordModal
          user={changePwUser}
          onClose={() => setChangePwUser(null)}
          onSuccess={() => fetchUsers()}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Stat card */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <HuntrSurface style={{
            background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
            borderRadius: 14, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--ui-glass-shadow)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,var(--ui-accent-indigo),#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px var(--ui-accent-indigo-muted)",
            }}>
              <Users size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--ui-text-primary)" }}>{total.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>Total Users</div>
            </div>
          </HuntrSurface>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10,
            background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
            borderRadius: 10, padding: "9px 14px",
          }}>
            <Search size={14} color="var(--ui-text-muted)" />
            <HuntrInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, WhatsApp, atau perusahaan…"
              style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 13 }}
            />
            {search && (
              <HuntrButton onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", display: "flex", padding: 0 }}>
                <X size={13} />
              </HuntrButton>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>Tampilkan</span>
            {[10, 20, 50].map((n) => (
              <HuntrButton key={n} onClick={() => setPerPage(n)} style={{
                padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                background: perPage === n ? "var(--ui-primary)" : "var(--ui-bg-card)",
                color: perPage === n ? "#fff" : "var(--ui-text-muted)",
                border: perPage === n ? "1px solid var(--ui-primary)" : "1px solid var(--ui-border)",
              }}>
                {n}
              </HuntrButton>
            ))}
          </div>
        </div>

        {/* Table */}
        <HuntrSurface style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 56, textAlign: "center" }}>
              <Loader2 className="animate-spin" style={{ margin: "0 auto", color: "var(--ui-accent-indigo)" }} size={28} />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <HuntrTable style={{ width: "100%", borderCollapse: "collapse" }}>
                <HuntrTableHead>
                  <HuntrTableRow>
                    <HuntrTableHeaderCell style={thStyle}>NAMA</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={thStyle}>EMAIL</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={thStyle}>WHATSAPP</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={thStyle}>PERUSAHAAN</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={thStyle}>ROLE</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={thStyle}>BERGABUNG</HuntrTableHeaderCell>
                    <HuntrTableHeaderCell style={{ ...thStyle, textAlign: "center", minWidth: 170 }}>AKSI</HuntrTableHeaderCell>
                  </HuntrTableRow>
                </HuntrTableHead>
                <HuntrTableBody>
                  {users.length === 0 ? (
                    <HuntrTableRow>
                      <HuntrTableCell colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "var(--ui-text-muted)" }}>
                        Tidak ada user ditemukan
                      </HuntrTableCell>
                    </HuntrTableRow>
                  ) : (
                    users.map((user) => (
                      <HuntrTableRow key={user.id} style={{ transition: "background 0.1s" }}>
                        <HuntrTableCell style={{ ...tdStyle, fontWeight: 700 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                              background: "linear-gradient(135deg,var(--ui-accent-indigo),#8b5cf6)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 800, color: "#fff",
                            }}>
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            {user.name || "—"}
                          </div>
                        </HuntrTableCell>
                        <HuntrTableCell style={{ ...tdStyle, color: "var(--ui-text-muted)" }}>{user.email || "—"}</HuntrTableCell>
                        <HuntrTableCell style={{ ...tdStyle, color: "var(--ui-text-muted)", fontFamily: "monospace", fontSize: 12 }}>{user.whatsapp || "—"}</HuntrTableCell>
                        <HuntrTableCell style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12 }}>
                          {user.company?.name ? (
                            <span style={{ background: "var(--ui-primary-muted)", color: "var(--ui-primary)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {user.company.name}
                            </span>
                          ) : "—"}
                        </HuntrTableCell>
                        <HuntrTableCell style={tdStyle}>
                          {user.roles?.[0]?.slug ? (
                            <span style={{ background: "var(--ui-accent-indigo-muted)", color: "var(--ui-accent-indigo-text)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                              {user.roles[0].slug}
                            </span>
                          ) : <span style={{ color: "var(--ui-text-muted)", fontSize: 12 }}>—</span>}
                        </HuntrTableCell>
                        <HuntrTableCell style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </HuntrTableCell>
                        <HuntrTableCell style={{ ...tdStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                            <HuntrButton
                              onClick={() => setChangePwUser(user)}
                              title="Ubah Password"
                              style={{
                                padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                                background: "rgba(249,115,22,0.08)", color: "#f97316",
                                border: "1px solid rgba(249,115,22,0.20)", cursor: "pointer",
                                display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                              }}
                            >
                              <KeyRound size={11} /> Password
                            </HuntrButton>
                            {!user.company && !user.company_id ? (
                              <HuntrButton
                                onClick={async () => {
                                  const result = await Swal.fire({
                                    icon: "warning", title: "Hapus User?",
                                    text: `Hapus akun "${user.name || user.email}"? Tindakan ini tidak bisa dibatalkan.`,
                                    showCancelButton: true, confirmButtonText: "Hapus", cancelButtonText: "Batal", confirmButtonColor: "#ef4444",
                                  });
                                  if (!result.isConfirmed) return;
                                  try {
                                    await adminDeleteUser(user.id);
                                    fetchUsers();
                                  } catch (err: any) {
                                    Swal.fire({ icon: "error", title: "Gagal", text: err?.message || "Gagal menghapus user" });
                                  }
                                }}
                                style={{
                                  padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                                  background: "rgba(239,68,68,0.08)", color: "#ef4444",
                                  border: "1px solid rgba(239,68,68,0.20)", cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                                }}
                              >
                                <Trash2 size={11} /> Hapus
                              </HuntrButton>
                            ) : null}
                          </div>
                        </HuntrTableCell>
                      </HuntrTableRow>
                    ))
                  )}
                </HuntrTableBody>
              </HuntrTable>
            </div>
          )}
        </HuntrSurface>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
              Halaman {currentPage} dari {totalPages} · {total.toLocaleString()} user
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <HuntrButton onClick={() => fetchUsers(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                background: currentPage === 1 ? "var(--ui-bg-input)" : "var(--ui-accent-indigo-muted)",
                color: currentPage === 1 ? "var(--ui-text-muted)" : "var(--ui-accent-indigo-text)",
              }}>← Prev</HuntrButton>
              {buildPageList(currentPage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`d-${i}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12 }}>…</span>
                ) : (
                  <HuntrButton key={p} onClick={() => fetchUsers(p as number)} style={{
                    width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 700,
                    background: currentPage === p ? "var(--ui-accent-indigo)" : "var(--ui-bg-card)",
                    color: currentPage === p ? "#fff" : "var(--ui-text-muted)",
                    border: currentPage === p ? "none" : "1px solid var(--ui-border)", cursor: "pointer",
                  }}>{p}</HuntrButton>
                )
              )}
              <HuntrButton onClick={() => fetchUsers(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                background: currentPage === totalPages ? "var(--ui-bg-input)" : "var(--ui-accent-indigo-muted)",
                color: currentPage === totalPages ? "var(--ui-text-muted)" : "var(--ui-accent-indigo-text)",
              }}>Next →</HuntrButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
