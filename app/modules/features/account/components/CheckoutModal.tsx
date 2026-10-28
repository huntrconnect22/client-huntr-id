import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function CheckoutModal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="subscription-checkout-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="subscription-checkout-dialog m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-0 text-[var(--ui-text-primary)] shadow-2xl open:flex"
    >
      <style>{`.subscription-checkout-dialog::backdrop { background: rgba(0, 0, 0, 0.55); }`}</style>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--ui-border)] px-5 py-4">
        <h3
          id="subscription-checkout-title"
          className="m-0 text-base font-semibold"
        >
          Pembayaran Midtrans
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pembayaran"
          className="rounded p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)]"
        >
          <X size={19} />
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto p-5">{children}</div>
    </dialog>,
    document.body,
  );
}


