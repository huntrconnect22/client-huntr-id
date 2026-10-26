import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  MessageCircle,
  Mail,
  Loader2,
  Settings,
  Check,
  X,
} from "lucide-react";
import { getCompanyAccess } from "../../../lib/api/company";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  role_id?: string;
  profile_photo_url?: string;
}

interface TeamManagementProps {
  company: any;
  teamMembers: TeamMember[];
  teamLoading: boolean;
  isInviting: boolean;
  inviteForm: { email: string; role: string; whatsapp?: string };
  setInviteForm: (form: any) => void;
  handleInviteUser: (e: React.FormEvent) => void;
  inviteError: string | null;
  inviteSuccess: string | null;
  onRoleChanged?: () => void; // Callback to refresh team data after role change
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  company,
  teamMembers,
  teamLoading,
  isInviting,
  inviteForm,
  setInviteForm,
  handleInviteUser,
  inviteError,
  inviteSuccess,
  onRoleChanged,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let isCurrent = true;
    if (!company?.id) return;
    getCompanyAccess(company.id)
      .then((response) => {
        if (isCurrent) {
          setCompanyRoles(response?.roles || []);
        }
      })
      .catch(() => {
        if (isCurrent) setCompanyRoles([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [company?.id]);

  const handleRoleEdit = (userId: string, currentRole: string, currentRoleId?: string) => {
    setEditingUserId(userId);
    setNewRole(currentRoleId || currentRole);
  };

  const handleRoleCancel = () => {
    setEditingUserId(null);
    setNewRole("");
  };

  const handleRoleSave = async (userId: string) => {
    if (
      !newRole ||
      newRole === (teamMembers.find((m) => m.id === userId)?.role_id || teamMembers.find((m) => m.id === userId)?.role)
    ) {
      handleRoleCancel();
      return;
    }

    setUpdatingRole(true);
    try {
      const { updateUserRole } = await import("../../../lib/api/company");
      await updateUserRole(company.id, userId, newRole);

      // Check if this is the current user's role being updated
      const currentUser = (() => {
        try {
          const userSession = localStorage.getItem("user_session");
          return userSession ? JSON.parse(userSession) : null;
        } catch (e) {
          return null;
        }
      })();

      // If current user is updating their own role, refresh their session
      if (currentUser && currentUser.id === userId) {
        console.log(
          "🔄 Updating current user role in session from",
          currentUser.role,
          "to",
          newRole,
        );

        const updatedUser = { ...currentUser, role: companyRoles.find((role) => role.id === newRole)?.name || newRole };
        localStorage.setItem("user_session", JSON.stringify(updatedUser));

        // Trigger session manager update if available
        try {
          const { SessionManager } = await import("../../../lib/session");
          SessionManager.notify();
        } catch (e) {
          // SessionManager not available, that's ok
        }

        // Force page reload for immediate visual update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      // Call parent callback to refresh team data
      if (onRoleChanged) {
        onRoleChanged();
      }

      setEditingUserId(null);
      setNewRole("");
    } catch (error) {
      console.error("Error updating user role:", error);
      alert(
        "Gagal mengubah role user. Pastikan Anda memiliki izin untuk melakukan tindakan ini.",
      );
    } finally {
      setUpdatingRole(false);
    }
  };

  const getValidRoles = () => companyRoles.map((role) => ({ value: role.id, label: role.name }));
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Invite Section */}
      <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow shadow-orange-500/20">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ui-text-primary)] m-0">
              Invite Team Member
            </h3>
            <p className="text-xs text-[var(--ui-text-muted)] mt-1">
              Add colleagues to your workspace via Email invitation.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleInviteUser}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
              Email Address <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
              />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm focus:border-orange-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
              Workspace Role <span className="text-red-500">*</span>
            </span>
            <select
              required
              value={inviteForm.role}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, role: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm focus:border-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Select Role...</option>
              {getValidRoles().map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="h-[38px] px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isInviting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Mail size={16} /> Send Email Invite
              </>
            )}
          </button>
        </form>

        {inviteError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
            {inviteError}
          </div>
        )}
        {inviteSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
            {inviteSuccess}
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--ui-bg-input)] text-orange-500">
              <Users size={16} />
            </div>
            <h3 className="text-base font-bold text-[var(--ui-text-primary)] m-0">
              Active Team
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 text-xs font-semibold">
              {teamMembers.length} Members
            </span>
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={async () => {
                  try {
                    const { diagnoseRoleInconsistencies } =
                      await import("../../../lib/api/company");
                    const result = await diagnoseRoleInconsistencies(
                      company.id,
                    );
                    console.log("Role Diagnosis:", result);
                    alert(
                      `Found ${result.inconsistencies_found} role inconsistencies. Check console for details.`,
                    );
                  } catch (err) {
                    console.error("Diagnosis failed:", err);
                    alert("Diagnosis failed. Check console for details.");
                  }
                }}
                className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20 transition-all"
                title="Diagnose role inconsistencies"
              >
                Diagnose
              </button>
            )}
          </div>
        </div>

        {teamLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-orange-500" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-10 bg-[var(--ui-bg-input)] rounded-xl border border-dashed border-[var(--ui-border)]">
            <Users
              size={32}
              className="mx-auto text-[var(--ui-text-muted)] opacity-30 mb-2"
            />
            <p className="text-[var(--ui-text-muted)] text-xs font-medium">
              No team members yet. Invite your first colleague!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group p-4 rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] hover:border-orange-500/30 hover:shadow-md hover:shadow-orange-500/5 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--ui-bg-input)] flex items-center justify-center text-orange-500 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white transition-all overflow-hidden shrink-0 border border-[var(--ui-border)]">
                  {member.profile_photo_url ? (
                    <img
                      src={member.profile_photo_url}
                      alt={member.name || "Member"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[var(--ui-text-primary)] truncate">
                    {member.name || "Unnamed User"}
                  </div>
                  <div className="text-xs text-[var(--ui-text-muted)] truncate">
                    {member.email || member.whatsapp}
                  </div>
                </div>

                {/* Role Section */}
                <div className="flex items-center gap-2">
                  {editingUserId === member.id ? (
                    // Edit Mode
                    <div className="flex items-center gap-1">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] focus:border-orange-500/50 outline-none"
                        disabled={updatingRole}
                      >
                        {getValidRoles().map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRoleSave(member.id)}
                        disabled={updatingRole}
                        className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                        title="Simpan perubahan"
                      >
                        {updatingRole ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>
                      <button
                        onClick={handleRoleCancel}
                        disabled={updatingRole}
                        className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Batal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${
                          !member.role_id
                            ? "bg-red-500/20 text-red-600 border border-red-500/30"
                            : "bg-orange-500/10 text-orange-500"
                        }`}
                      >
                        {member.role}
                      </div>

                      {/* Only show edit button for managers (or company owners in the future) */}
                      {/* Assuming current user role check will be added later */}
                      <button
                        onClick={() => handleRoleEdit(member.id, member.role, member.role_id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--ui-text-muted)] hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                        title="Edit role"
                      >
                        <Settings size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
