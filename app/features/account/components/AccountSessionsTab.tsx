import React, { useEffect, useState } from "react";
import { Monitor, Smartphone, Clock, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { getSessions, logoutSession } from "../../../lib/api";

export function AccountSessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutSession = async (sessionId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Terminate Session?",
      text: "Are you sure you want to terminate this session?",
      showCancelButton: true,
      confirmButtonText: "Yes, Terminate",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await logoutSession(sessionId);
      fetchSessions();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Active Sessions</h2>
          <p className="text-sm text-[var(--ui-text-muted)] mt-1">Devices currently authenticated with your Huntr account.</p>
        </div>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm font-semibold text-orange-400 hover:border-orange-500/40 transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Connected Devices</span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-[var(--ui-text-muted)]">
              <Monitor size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No active session data found.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isMobile =
                session.name?.toLowerCase().includes("android") ||
                session.name?.toLowerCase().includes("ios") ||
                session.user_agent?.toLowerCase().includes("mobile");
              const Icon = isMobile ? Smartphone : Monitor;
              return (
                <div key={session.id} className="p-4 px-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        session.is_current_device
                          ? "bg-orange-500/15 text-orange-500"
                          : "bg-[var(--ui-bg-card)] text-[var(--ui-text-secondary)]"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--ui-text-primary)] truncate">
                          {session.type === "API Token" ? session.name || "Unknown Device" : session.ip_address}
                        </span>
                        {session.is_current_device && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--ui-text-muted)] truncate mt-0.5 flex items-center gap-2">
                        <span>{session.type === "API Token" ? "API Token" : session.user_agent}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {session.last_active}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.is_current_device && (
                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0"
                      title="Terminate session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
