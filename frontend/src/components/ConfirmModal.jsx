import React from "react";
import { X } from "lucide-react";
const ConfirmModal = ({ open, title, message, confirmLabel = "Confirm", confirmVariant = "destructive", onConfirm, onCancel, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg page-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}>

        <button onClick={onCancel} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-card ${confirmVariant === "destructive" ? "bg-destructive hover:bg-destructive/90" : "bg-success hover:bg-success/90"}`
            }>

            {confirmLabel}
          </button>
        </div>
      </div>
    </div>);

};

export default ConfirmModal;