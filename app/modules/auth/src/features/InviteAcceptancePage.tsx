import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getInvitationInfo, acceptInvitation } from "~/lib/api";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        setStatus("error");
        setError("Invalid invitation token.");
        return;
      }

      const userSession = localStorage.getItem("user_session");
      
      // If not logged in, fetch info first to prefill register form
      if (!userSession) {
        try {
          const info = await getInvitationInfo(token);
          // Redirect to register, passing the token and pre-filled email & whatsapp
          navigate(`/register?returnTo=/invite/accept?token=${token}&email=${encodeURIComponent(info.email || "")}&whatsapp=${encodeURIComponent(info.whatsapp || "")}`);
        } catch (err: any) {
          setStatus("error");
          setError(err.message || "Invitation is invalid or has expired.");
        }
        return;
      }

      // If logged in, proceed to accept
      try {
        const res = await acceptInvitation(token);
        setCompanyName(res.company?.name || "the company");
        
        // Update user session with new company_id and role
        const user = JSON.parse(userSession);
        const updatedUser = { ...user, company_id: res.user.company_id, role: res.user.role };
        localStorage.setItem("user_session", JSON.stringify(updatedUser));
        localStorage.setItem("active_company", JSON.stringify(res.company));
        
        setStatus("success");
        setTimeout(() => navigate("/"), 3000);
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "Failed to accept invitation. It may have expired.");
      }
    };

    processInvitation();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--ui-bg-page-grad)]">
      <div className="w-full max-w-md bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-3xl p-10 text-center shadow-2xl">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <h2 className="text-xl font-bold text-[var(--ui-text-primary)]">Processing Invitation...</h2>
            <p className="text-sm text-[var(--ui-text-muted)]">Verifying your invitation token, please wait.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--ui-text-primary)] tracking-tight">Welcome Aboard!</h2>
              <p className="text-sm text-[var(--ui-text-muted)] mt-2">
                You have successfully joined <span className="text-orange-500 font-bold">{companyName}</span>.
              </p>
            </div>
            <p className="text-xs text-[var(--ui-text-muted)]">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--ui-text-primary)] tracking-tight">Invitation Error</h2>
              <p className="text-sm text-[var(--ui-text-muted)] mt-2">{error}</p>
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full py-3 bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded-xl text-sm font-bold text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input-focus)] transition-all"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
