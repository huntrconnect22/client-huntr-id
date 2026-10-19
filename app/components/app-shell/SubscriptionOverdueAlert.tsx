import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

interface Props {
  userId: string;
  companyId: string;
  companyPrefix: string;
  overdueSince: string | null;
  canManage: boolean;
}

export function SubscriptionOverdueAlert({
  userId,
  companyId,
  companyPrefix,
  overdueSince,
  canManage,
}: Props) {
  const navigate = useNavigate();
  const shown = useRef(new Set<string>());

  useEffect(() => {
    const key = `huntr:subscription-overdue:${userId}:${companyId}:${overdueSince ?? "unknown"}`;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const alreadyShown = () => {
      if (shown.current.has(key)) return true;
      try {
        return sessionStorage.getItem(key) === "shown";
      } catch {
        return false;
      }
    };
    const show = () => {
      if (!active || alreadyShown()) return;
      if (Swal.isVisible()) {
        timer = setTimeout(show, 1000);
        return;
      }
      shown.current.add(key);
      try {
        sessionStorage.setItem(key, "shown");
      } catch {
        /* Keep the in-memory marker. */
      }
      const due = overdueSince ? new Date(overdueSince) : null;
      const date =
        due && !Number.isNaN(due.getTime())
          ? due.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null;
      void Swal.fire({
        icon: "warning",
        title: "Langganan Enterprise berakhir",
        text: `${date ? `Paket berakhir pada ${date}. ` : ""}Akses WMS dan pembuatan PR dibatasi hingga paket diperpanjang. ${canManage ? "Perpanjang paket untuk memulihkan akses." : "Hubungi owner atau manager perusahaan untuk memperpanjang paket."}`,
        background: "var(--ui-bg-card)",
        color: "var(--ui-text-primary)",
        confirmButtonText: canManage ? "Perpanjang paket" : "Lihat langganan",
        confirmButtonColor: "#ea580c",
        showCancelButton: true,
        cancelButtonText: "Nanti",
        cancelButtonColor: "#6b7280",
        didOpen: (popup) => {
          popup.dataset.overdueAlertKey = key;
        },
      }).then((result) => {
        if (active && result.isConfirmed)
          navigate(`${companyPrefix}/account?tab=subscription`);
      });
    };
    timer = setTimeout(show, 0);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (Swal.getPopup()?.dataset.overdueAlertKey === key) Swal.close();
    };
  }, [userId, companyId, companyPrefix, overdueSince, canManage, navigate]);

  return null;
}
