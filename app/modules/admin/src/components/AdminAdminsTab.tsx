import React, { useEffect, useState } from "react";
import { Users, X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { adminGetAdmins, adminCreateAdmin } from "../../lib/api";
import { lbl, inp } from "./shared";
import type { AdminUser } from "./shared";

export default function AdminAdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminGetAdmins();
      setAdmins(res.admins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminCreateAdmin({ name, email, password });
      Swal.fire({ icon: "success", title: "Success", text: "Admin created successfully." });
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchAdmins();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create admin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--ui-text-primary)",
          }}
        >
          Admins Management
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
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.15s",
          }}
        >
          <Users size={15} /> Add New Admin
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
          <Loader2
            className="animate-spin"
            size={26}
            style={{ color: "var(--ui-primary)" }}
          />
        </div>
      ) : (
        <div
          style={{
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--ui-bg-inset)",
                  borderBottom: "1px solid var(--ui-border)",
                }}
              >
                <th
                  style={{
                    padding: "11px 20px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-muted)",
                    letterSpacing: "0.06em",
                  }}
                >
                  NAME
                </th>
                <th
                  style={{
                    padding: "11px 20px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ui-text-muted)",
                    letterSpacing: "0.06em",
                  }}
                >
                  EMAIL
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((adm) => (
                <tr
                  key={adm.id}
                  style={{ borderBottom: "1px solid var(--ui-border)" }}
                >
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 700,
                      color: "var(--ui-text-primary)",
                      fontSize: 14,
                    }}
                  >
                    {adm.name}
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      color: "var(--ui-text-muted)",
                      fontSize: 13,
                    }}
                  >
                    {adm.email}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "var(--ui-text-muted)",
                      fontSize: 14,
                    }}
                  >
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Admin bottom-sheet modal */}
      {showAddModal && (
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
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              background: "var(--ui-bg-card)",
              padding: "20px 20px 28px",
              borderRadius: "16px 16px 0 0",
              width: "100%",
              maxWidth: 440,
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
                Add New Admin
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label style={lbl}>Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...inp, marginTop: 6 }}
                />
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inp, marginTop: 6 }}
                />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  style={{ ...inp, marginTop: 6 }}
                />
              </div>
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
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: 8,
                    background: isSubmitting
                      ? "rgba(249,115,22,0.5)"
                      : "var(--ui-primary)",
                    color: "#fff",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    minHeight: 44,
                    transition: "background 0.15s",
                  }}
                >
                  {isSubmitting ? "Creating…" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
